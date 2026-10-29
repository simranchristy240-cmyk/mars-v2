import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { QuestionAnswer } from '../../../components/QuestionAnswer';
import { HtmlContent } from '../../../components/RichTextEditor';
import { ProgressBar } from '../../../components/ui';
import { BuilderHeader } from './BuilderHeader';
import '../../../styles/pages/practice.css';

interface Props {
  topicTitle: string;
  practiceTitle?: string;
  questions: any[];
  activeIdx: number;
  onSelectIdx: (idx: number) => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: any) => void;
  onDeleteQuestion: (questionId: string) => void;
  onEditPractice?: () => void;
  onBackToOverview: () => void;
}

export const AuthorPracticeView: React.FC<Props> = ({
  topicTitle,
  practiceTitle,
  questions,
  activeIdx,
  onSelectIdx,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onEditPractice,
  onBackToOverview,
}) => {
  const [selectedOpt, setSelectedOpt] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const currentQ = questions[activeIdx] || questions[0];
  const total = questions.length;
  const pct = total > 0 ? Math.round(((activeIdx + 1) / total) * 100) : 0;

  const handleNext = () => {
    setSelectedOpt([]);
    setFeedback(null);
    if (activeIdx < total - 1) {
      onSelectIdx(activeIdx + 1);
    }
  };

  const handlePrev = () => {
    setSelectedOpt([]);
    setFeedback(null);
    if (activeIdx > 0) {
      onSelectIdx(activeIdx - 1);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ─── Standard Minimalist Header (Icon-only Edit & Add) ─────────── */}
      <BuilderHeader
        current={total > 0 ? activeIdx + 1 : 0}
        total={total}
        title={practiceTitle || `Practice: ${topicTitle || 'Chapter'}`}
        onBack={onBackToOverview}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={activeIdx > 0}
        hasNext={activeIdx < total - 1}
        onEdit={() => currentQ && onEditQuestion(currentQ)}
        onAdd={onAddQuestion}
        editTitle="Edit Question"
        addTitle="Add Practice Question"
      />

      {/* ─── If No Questions ─────────────────────────────────────────── */}
      {total === 0 ? (
        <div
          className="ui-tile"
          style={{
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <HelpCircle size={40} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px' }}>No Practice Questions Yet</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Add MCQs, matching, or image-based questions to help students master this chapter.
            </p>
          </div>
          <button
            type="button"
            className="ui-btn is-primary"
            onClick={onAddQuestion}
            style={{ marginTop: 8 }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Add First Practice Question
          </button>
        </div>
      ) : (
        <>
          {/* ─── Progress Bar & Counter ───────────────────────────────── */}
          <section className="prac-progress">
            <div className="prac-progress-row">
              <div className="prac-counter">
                Question <strong>{activeIdx + 1}</strong>
                <span className="ui-faint"> of {total}</span>
              </div>
              <span className="ui-faint prac-pct">{pct}% completed</span>
            </div>
            <ProgressBar value={pct} tone="gold" height={6} />
          </section>

          {/* ─── Question Card ────────────────────────────────────────── */}
          <div>
            <article className="ui-tile prac-card">
              <div className="ui-tile-head">
                <span className="ui-chip is-gold">
                  <HelpCircle size={13} /> Question {activeIdx + 1}
                </span>
                <span className="ui-faint">{currentQ.marks || 1} mark</span>
              </div>

              <HtmlContent as="div" html={currentQ.questionText} className="prac-question-text" />

              {currentQ.questionImage && (
                <img
                  src={currentQ.questionImage}
                  alt="Anatomy question visual"
                  className="prac-question-img"
                  style={{ maxHeight: 320, objectFit: 'contain', margin: '14px 0', borderRadius: 'var(--radius-sm)' }}
                />
              )}

              <QuestionAnswer
                question={currentQ}
                value={selectedOpt}
                onChange={setSelectedOpt}
                disabled={false}
              />

              {!feedback ? (
                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="ui-btn is-primary is-lg"
                    style={{ width: '100%' }}
                    disabled={selectedOpt.length === 0}
                    onClick={() => {
                      const isCorrect = (currentQ.options || [])
                        .filter((o: any) => o.isCorrect)
                        .every((o: any) => selectedOpt.includes(o.id));
                      setFeedback({
                        isCorrect,
                        explanation: currentQ.explanation || 'Detailed explanation of anatomical landmarks and rationale.',
                      });
                    }}
                  >
                    Check response
                  </button>
                </div>
              ) : (
                <div
                  className={`les-feedback ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}
                  style={{ marginTop: 20 }}
                >
                  <div className="les-feedback-head">
                    {feedback.isCorrect ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}
                    <strong>{feedback.isCorrect ? 'Correct response' : 'Incorrect response'}</strong>
                  </div>
                  {feedback.explanation && (
                    <p className="les-feedback-body">{feedback.explanation}</p>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      className="ui-btn is-ghost is-sm"
                      onClick={() => { setFeedback(null); setSelectedOpt([]); }}
                    >
                      Retry
                    </button>
                    {activeIdx < total - 1 && (
                      <button
                        type="button"
                        className="ui-btn is-primary is-sm"
                        onClick={handleNext}
                      >
                        Next question <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Nav */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 22,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div>
                  {activeIdx > 0 && (
                    <button type="button" className="ui-btn is-outline is-sm" onClick={handlePrev}>
                      <ArrowLeft size={14} /> Previous
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="ui-btn is-danger is-sm"
                    onClick={() => onDeleteQuestion(currentQ._id)}
                    title="Delete question"
                  >
                    <Trash2 size={13} />
                  </button>

                  {activeIdx < total - 1 && (
                    <button type="button" className="ui-btn is-outline is-sm" onClick={handleNext}>
                      Next <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          </div>
        </>
      )}
    </div>
  );
};
