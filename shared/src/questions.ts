export interface AnswerQuestion {
  questionType?: string;
  questionText?: string;
  questionImage?: string;
  options?: Array<{ id: string; text: string; image?: string; isCorrect?: boolean }>;
  matchPairs?: Array<{ left: string; right: string }>;
  matchChoices?: string[];
  marks?: number;
  negativeMarks?: number;
}

export const matchToken = (index: number, right: string) => `${index}:${encodeURIComponent(right)}`;

export function correctAnswerIds(question: AnswerQuestion): string[] {
  return question.questionType === 'match'
    ? (question.matchPairs || []).map((pair, index) => matchToken(index, pair.right))
    : (question.options || []).filter(option => option.isCorrect).map(option => option.id);
}

export function isAnswerCorrect(question: AnswerQuestion, selected: string[] = []): boolean {
  const correct = correctAnswerIds(question);
  return correct.length > 0 && selected.length === correct.length &&
    new Set(selected).size === selected.length && correct.every(id => selected.includes(id));
}

export function studentQuestion<T extends AnswerQuestion>(question: T): T {
  const result: any = { ...question };
  delete result.explanation;
  result.options = (question.options || []).map(({ isCorrect, ...option }) => option);
  if (question.questionType === 'match') {
    result.matchChoices = [...new Set((question.matchPairs || []).map(pair => pair.right))].sort();
    result.matchPairs = (question.matchPairs || []).map(pair => ({ left: pair.left, right: '' }));
  }
  return result;
}

export function questionValidationError(question: AnswerQuestion): string | null {
  const text = (value?: string) => (value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!text(question.questionText)) return 'Enter the question text before publishing.';
  if (!['single-mcq', 'multi-mcq', 'true-false', 'match', 'image-based'].includes(question.questionType || 'single-mcq')) return 'Unsupported question type.';
  if (question.marks !== undefined && (!Number.isFinite(question.marks) || question.marks <= 0)) return 'Marks must be greater than zero.';
  if (question.negativeMarks !== undefined && (!Number.isFinite(question.negativeMarks) || question.negativeMarks < 0)) return 'Penalty cannot be negative.';
  if (question.questionType === 'match') {
    const pairs = question.matchPairs || [];
    if (pairs.length < 2 || pairs.some(pair => !text(pair.left) || !text(pair.right))) return 'Add at least two complete matching pairs.';
    return null;
  }
  const options = question.options || [];
  if (options.length < 2 || options.some(option => !text(option.text) && !option.image)) return 'Add at least two complete answer options.';
  if (new Set(options.map(option => option.id)).size !== options.length) return 'Answer option IDs must be unique.';
  const count = options.filter(option => option.isCorrect).length;
  if (count === 0 || (question.questionType !== 'multi-mcq' && count !== 1)) return question.questionType === 'multi-mcq' ? 'Select at least one correct answer.' : 'Select exactly one correct answer.';
  if (question.questionType === 'image-based' && !question.questionImage) return 'Add a question image before publishing.';
  return null;
}

export function testDeadline(test: { duration: number; endTime: Date | string }, startedAt: Date | string): number {
  return Math.min(new Date(startedAt).getTime() + test.duration * 60000, new Date(test.endTime).getTime());
}
