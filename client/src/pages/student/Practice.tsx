import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { HelpCircle, ArrowLeft, CheckCircle, XCircle, ChevronRight, Zap, Target, Flag } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';
import { EmptyState, ProgressBar } from '../../components/ui';
import '../../styles/pages/practice.css';

export const Practice: React.FC = () => {
  const { topicId, setId } = useParams<{ topicId: string; setId?: string }>();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-questions', topicId, setId],
    queryFn: () => api.get(setId ? `/practice/topic/${topicId}/set/${setId}` : `/practice/topic/${topicId}`),
    enabled: !!topicId,
  });

  const questions = data?.data?.data || [];
  const practiceSet = data?.data?.practiceSet;
  const currentQ = questions[currentIdx];

  const handleSubmit = async () => {
    if (!selectedOpt || !currentQ) return;

    try {
      const res = await api.post('/practice/submit', {
        questionId: currentQ._id,
        selectedOptions: [selectedOpt],
      });
      setFeedback(res.data.data);
    } catch (err) {
      alert('Failed to evaluate answer');
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      alert('Practice Bank Complete! Great job 🎉');
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <StudentPageShell narrow>
        <div className="prac-loading" aria-busy="true">
          <div className="ui-skeleton prac-skel-line" />
          <div className="ui-skeleton prac-skel-title" />
          <div className="ui-skeleton prac-skel-bar" />
          <div className="ui-skeleton prac-skel-card" />
          <p className="ui-faint">Loading question bank…</p>
        </div>
      </StudentPageShell>
    );
  }

  if (questions.length === 0) {
    return (
      <StudentPageShell narrow>
        <div className="ui-tile prac-empty">
          <EmptyState
            icon={<HelpCircle size={24} />}
            title="No questions yet"
            text="There are no practice questions in this practice set yet."
            action={
              <button type="button" className="ui-btn is-primary" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Back to home
              </button>
            }
          />
        </div>
      </StudentPageShell>
    );
  }

  const isLast = currentIdx >= questions.length - 1;
  const answeredCount = currentIdx + (feedback ? 1 : 0);
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <StudentPageShell narrow>
      <div className="prac-topbar">
        <button type="button" className="ui-btn is-ghost is-sm prac-back" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to home
        </button>
        <span className="ui-chip is-gold">
          <Zap size={12} fill="currentColor" /> +10 XP each
        </span>
      </div>

      <header className="prac-head">
        <div className="ui-label prac-eyebrow">
          <Target size={13} /> Practice drill
        </div>
        <h1 className="ui-page-title">{practiceSet?.title || 'Practice Drill'}</h1>
        {practiceSet?.description && <p className="ui-page-sub">{practiceSet.description}</p>}
      </header>

      <div className="prac-progress" aria-label={`Question ${currentIdx + 1} of ${questions.length}`}>
        <div className="prac-progress-row">
          <span className="prac-counter">
            Question <strong>{currentIdx + 1}</strong>
            <span className="ui-faint"> / {questions.length}</span>
          </span>
          <span className="ui-faint prac-pct">{progressPct}% done</span>
        </div>
        <ProgressBar value={progressPct} height={8} tone="gold" />
      </div>

      <section className="ui-tile prac-card ui-rise" key={currentQ._id || currentIdx}>
        <div className="ui-tile-head">
          <span className="ui-chip">
            <HelpCircle size={12} /> Q{currentIdx + 1}
          </span>
          {!feedback && <span className="ui-faint">Choose the best answer</span>}
        </div>

        <HtmlContent as="div" html={currentQ.questionText} className="prac-question" />

        {currentQ.questionImage && <img src={currentQ.questionImage} alt="Anatomy Diagram" className="prac-image" />}

        <div className="prac-options" role="radiogroup">
          {currentQ.options?.map((opt: any) => {
            const isSelected = selectedOpt === opt.id;
            const state = isSelected ? (feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ' is-selected') : '';
            return (
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                key={opt.id}
                className={`ui-option${state}${feedback && !isSelected ? ' prac-option-dim' : ''}`}
                onClick={() => !feedback && setSelectedOpt(opt.id)}
              >
                <span className="ui-option-key">{opt.id.toUpperCase()}</span>
                <HtmlContent html={opt.text} className="ui-grow" />
                {isSelected && feedback && (
                  <span className={`prac-option-mark ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    {feedback.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!feedback ? (
          <button type="button" className="ui-btn is-primary is-lg is-block" onClick={handleSubmit} disabled={!selectedOpt}>
            Check answer
          </button>
        ) : (
          <div className="prac-result">
            <div className={`ui-callout ${feedback.isCorrect ? 'is-success' : 'is-danger'} prac-feedback`} role="status">
              <span className={`prac-feedback-icon ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                {feedback.isCorrect ? <CheckCircle size={22} /> : <XCircle size={22} />}
              </span>
              <div className="ui-grow">
                <div className="prac-feedback-title">
                  {feedback.isCorrect ? (
                    <>
                      Correct! <span className="prac-xp">+10 XP 🎯</span>
                    </>
                  ) : (
                    'Not quite — keep going'
                  )}
                </div>
                {!feedback.explanation && (
                  <div className="prac-feedback-body ui-muted">
                    {feedback.isCorrect ? 'Nice work, that’s the right answer.' : 'Review the question and try the next one.'}
                  </div>
                )}
              </div>
            </div>

            {feedback.explanation && (
              <div className="ui-callout prac-explanation">
                <div className="ui-grow">
                  <div className="ui-label">Explanation</div>
                  <HtmlContent as="div" html={feedback.explanation} className="prac-explanation-body" />
                </div>
              </div>
            )}

            <button type="button" className={`ui-btn is-lg is-block ${isLast ? 'is-gold' : 'is-primary'}`} onClick={handleNext}>
              {isLast ? (
                <>
                  <Flag size={16} /> Finish practice
                </>
              ) : (
                <>
                  Next question <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </StudentPageShell>
  );
};
