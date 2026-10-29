import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { QuestionAnswer } from '../../../components/QuestionAnswer';
import { HtmlContent } from '../../../components/RichTextEditor';
import { BuilderHeader } from './BuilderHeader';
import '../../../styles/pages/tests.css';

interface Props {
  test: any;
  questions: any[];
  activeIdx: number;
  onSelectIdx: (idx: number) => void;
  onEditSettings: () => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: any) => void;
  onDeleteQuestion: (questionId: string) => void;
  onBackToOverview: () => void;
}

export const AuthorTestView: React.FC<Props> = ({
  test,
  questions,
  activeIdx,
  onSelectIdx,
  onEditSettings,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onBackToOverview,
}) => {
  const [selectedOpt, setSelectedOpt] = useState<string[]>([]);

  const currentQ = questions[activeIdx] || questions[0];
  const total = questions.length;

  const handleNext = () => {
    setSelectedOpt([]);
    if (activeIdx < total - 1) onSelectIdx(activeIdx + 1);
  };

  const handlePrev = () => {
    setSelectedOpt([]);
    if (activeIdx > 0) onSelectIdx(activeIdx - 1);
  };

  return (
    <div className="tst-exam" style={{ minHeight: 'auto' }}>
      {/* ─── Standard Minimalist Header (Icon-only Edit & Add) ─────────── */}
      <BuilderHeader
        current={total > 0 ? activeIdx + 1 : 0}
        total={total}
        title={test.title || 'Assessment Test'}
        onBack={onBackToOverview}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={activeIdx > 0}
        hasNext={activeIdx < total - 1}
        onEdit={() => currentQ && onEditQuestion(currentQ)}
        onAdd={onAddQuestion}
        editTitle="Edit Question"
        addTitle="Add Test Question"
      />

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <div className="tst-exam-body" style={{ padding: '24px 0' }}>
        <main className="tst-exam-main" style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px' }}>No Questions in this Test</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Add graded MCQs or clinical questions to this assessment test.
                </p>
              </div>
              <button
                type="button"
                className="ui-btn is-primary"
                onClick={onAddQuestion}
                style={{ marginTop: 8 }}
              >
                <Plus size={14} style={{ marginRight: 6 }} /> Add First Test Question
              </button>
            </div>
          ) : (
            <>
              <div className="tst-q-counter">
                <span className="tst-q-counter-num">
                  Question <strong>{activeIdx + 1}</strong>
                  <span className="ui-faint"> / {total}</span>
                </span>
                <span className="ui-faint">
                  {currentQ.marks || 1} mark{currentQ.marks === 1 ? '' : 's'}
                  {test.negativeMarking && ' · -0.25 penalty'}
                </span>
              </div>

              {/* ─── Question Card ─────────────────────────────────────── */}
              <div>
                <article className="ui-tile tst-q-card">
                  <HtmlContent as="div" html={currentQ.questionText} className="tst-q-text" />

                  {currentQ.questionImage && (
                    <img
                      src={currentQ.questionImage}
                      alt="Question diagram"
                      className="tst-q-img"
                      style={{ maxHeight: 340, objectFit: 'contain', margin: '14px 0', borderRadius: 'var(--radius-sm)' }}
                    />
                  )}

                  <QuestionAnswer
                    question={currentQ}
                    value={selectedOpt}
                    onChange={setSelectedOpt}
                    disabled={false}
                  />

                  {currentQ.explanation && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                        Explanation Note:
                      </strong>
                      {currentQ.explanation}
                    </div>
                  )}

                  <div className="tst-exam-actions" style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
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
                        <button type="button" className="ui-btn is-primary is-sm" onClick={handleNext}>
                          Next question <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
