import React, { useId } from 'react';
import { AnswerQuestion, matchToken } from '@mars/shared';
import { HtmlContent, stripHtml } from './RichTextEditor';

export const QuestionAnswer: React.FC<{
  question: AnswerQuestion;
  value: string[];
  onChange?: (value: string[]) => void;
  correctIds?: string[];
  disabled?: boolean;
}> = ({ question, value, onChange, correctIds, disabled }) => {
  const groupId = useId();
  const locked = disabled || !!correctIds || !onChange;
  if (question.questionType === 'match') {
    const choices = question.matchChoices || [...new Set((question.matchPairs || []).map(pair => pair.right))].sort();
    return <fieldset className="question-answers" disabled={locked}>
      <legend>Match each item to an answer. Answers may be used more than once.</legend>
      {(question.matchPairs || []).map((pair, index) => {
        const selected = value.find(id => id.startsWith(`${index}:`)) || '';
        const correct = correctIds?.find(id => id.startsWith(`${index}:`));
        return <div className="ui-stack" key={index}>
          <label className="ui-row">
            <HtmlContent html={pair.left} className="ui-grow" />
            <select className="ui-input" aria-label={`Match ${stripHtml(pair.left)}`} value={selected}
              onChange={event => onChange?.([...value.filter(id => !id.startsWith(`${index}:`)), ...(event.target.value ? [event.target.value] : [])])}>
              <option value="">Choose an answer</option>
              {choices.map(choice => <option key={choice} value={matchToken(index, choice)}>{stripHtml(choice)}</option>)}
            </select>
          </label>
          {correct && <p className="ui-muted">Correct answer: {decodeURIComponent(correct.slice(correct.indexOf(':') + 1))}</p>}
        </div>;
      })}
    </fieldset>;
  }
  const multi = question.questionType === 'multi-mcq';
  return <fieldset className="question-answers" disabled={locked}>
    <legend>{multi ? 'Select all correct answers' : 'Select one answer'}</legend>
    {(question.options || []).map(option => {
      const selected = value.includes(option.id);
      const correct = correctIds?.includes(option.id);
      return <label key={option.id} className={`ui-option${correct ? ' is-correct' : correctIds && selected ? ' is-wrong' : selected ? ' is-selected' : ''}`}>
        <input type={multi ? 'checkbox' : 'radio'} name={groupId} checked={selected}
          onChange={() => onChange?.(multi ? selected ? value.filter(id => id !== option.id) : [...value, option.id] : [option.id])} />
        <HtmlContent html={option.text} className="ui-grow" />
        {option.image && <img src={option.image} alt="Answer option" style={{ maxWidth: '100%', maxHeight: 180 }} />}
        {correct && <span>Correct answer</span>}
        {correctIds && selected && <span>Your answer</span>}
      </label>;
    })}
  </fieldset>;
};
