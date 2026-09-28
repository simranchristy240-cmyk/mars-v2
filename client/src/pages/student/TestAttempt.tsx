import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Clock, Flag, ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, Send, HelpCircle } from 'lucide-react';
import { HtmlContent } from '../../components/RichTextEditor';
import { EmptyState, ProgressBar } from '../../components/ui';
import '../../styles/pages/tests.css';

export const TestAttempt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [testData, setTestData] = useState<any>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [showNavGrid, setShowNavGrid] = useState(false);

  useEffect(() => {
    const fetchStart = async () => {
      try {
        const res = await api.post(`/tests/${id}/start`);
        const { test, attempt } = res.data.data;
        setTestData(test);
        setTimeLeftSeconds(test.duration * 60);

        // Populate existing answers if resuming
        const ansMap: Record<string, string[]> = {};
        const flagMap: Record<string, boolean> = {};
        attempt.answers?.forEach((a: any) => {
          ansMap[a.questionId] = a.selectedOptions || [];
          if (a.isMarkedForReview) flagMap[a.questionId] = true;
        });
        setAnswers(ansMap);
        setFlagged(flagMap);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to start test attempt');
        navigate(-1);
      }
    };

    if (id) fetchStart();
  }, [id]);

  // Timer Countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  if (!testData) {
    return (
      <div className="tst-exam-loading" aria-busy="true">
        <span className="ui-icon-box tst-exam-loading-icon" style={{ ['--size' as string]: '56px' }}>
          <Clock size={24} />
        </span>
        <p className="ui-muted">Loading test environment…</p>
      </div>
    );
  }

  const currentSection = testData.sections[currentSectionIdx];
  const allQuestions = currentSection?.questions || [];
  const currentQ = allQuestions[currentQIdx];

  const handleSelectOption = (optId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: [optId],
    }));

    // Auto-save answer to server
    api.put(`/tests/${id}/answer`, {
      questionId: currentQ._id,
      selectedOptions: [optId],
      isMarkedForReview: !!flagged[currentQ._id],
    });
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    const newFlagged = !flagged[currentQ._id];
    setFlagged((prev) => ({ ...prev, [currentQ._id]: newFlagged }));

    api.put(`/tests/${id}/answer`, {
      questionId: currentQ._id,
      selectedOptions: answers[currentQ._id] || [],
      isMarkedForReview: newFlagged,
    });
  };

  const handleFinalSubmit = async (isAuto = false) => {
    const confirmSub = isAuto || window.confirm('Are you sure you want to submit your test attempt?');
    if (confirmSub) {
      try {
        await api.post(`/tests/${id}/submit`, { isAutoSubmitted: isAuto });
        alert(isAuto ? 'Time expired! Test auto-submitted.' : 'Test submitted successfully!');
        navigate(`/tests/${id}/report`);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error submitting test');
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAnsweredQ = (q: any) => !!(answers[q._id] && answers[q._id].length > 0);
  const answeredCount = allQuestions.filter(isAnsweredQ).length;
  const flaggedCount = allQuestions.filter((q: any) => !!flagged[q._id]).length;
  const answeredPct = allQuestions.length ? Math.round((answeredCount / allQuestions.length) * 100) : 0;
  const timerTone = timeLeftSeconds < 300 ? ' is-danger' : timeLeftSeconds < 600 ? ' is-warning' : '';
  const isFirst = currentQIdx === 0;
  const isLast = currentQIdx === allQuestions.length - 1;
  const isCurrentFlagged = !!(currentQ && flagged[currentQ._id]);

  return (
    <div className="tst-exam">
      <header className="tst-exam-bar">
        <div className="tst-exam-bar-inner">
          <div className="ui-grow tst-exam-heading">
            <h1 className="tst-exam-title ui-truncate">{testData.title}</h1>
            <div className="ui-faint ui-truncate">
              Section {currentSectionIdx + 1} · {currentSection?.name}
            </div>
          </div>

          <div className={`tst-timer${timerTone}`} role="timer" aria-label={`Time left ${formatTime(timeLeftSeconds)}`}>
            <Clock size={16} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            type="button"
            className={`ui-icon-btn is-tile tst-palette-toggle${showNavGrid ? ' is-active' : ''}`}
            onClick={() => setShowNavGrid(!showNavGrid)}
            aria-expanded={showNavGrid}
            aria-label="Question palette"
          >
            <LayoutGrid size={18} />
          </button>

          <button type="button" className="ui-btn is-primary tst-exam-submit" onClick={() => handleFinalSubmit(false)}>
            <Send size={15} /> <span className="tst-exam-submit-label">Submit</span>
          </button>
        </div>
        <div className="tst-exam-progress" aria-hidden="true">
          <span style={{ width: `${answeredPct}%` }} />
        </div>
      </header>

      <div className="tst-exam-body">
        <main className="tst-exam-main">
          {currentQ ? (
            <>
              <div className="tst-q-counter">
                <span className="tst-q-counter-num">
                  Question <strong>{currentQIdx + 1}</strong>
                  <span className="ui-faint"> / {allQuestions.length}</span>
                </span>
                <span className="ui-faint">
                  {answeredCount} answered
                  {flaggedCount > 0 ? ` · ${flaggedCount} marked` : ''}
                </span>
              </div>

              <section className="ui-tile tst-question ui-rise" key={currentQ._id}>
                <div className="ui-tile-head">
                  <div className="ui-row">
                    <span className="ui-chip">Q{currentQIdx + 1}</span>
                    <span className="ui-chip is-outline">
                      {currentQ.marks || 1} {(currentQ.marks || 1) === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`ui-btn is-sm tst-flag-btn${isCurrentFlagged ? ' is-flagged' : ' is-ghost'}`}
                    onClick={toggleFlag}
                    aria-pressed={isCurrentFlagged}
                  >
                    <Flag size={14} fill={isCurrentFlagged ? 'currentColor' : 'none'} />
                    {isCurrentFlagged ? 'Marked for review' : 'Mark for review'}
                  </button>
                </div>

                <HtmlContent as="div" html={currentQ.questionText} className="tst-question-text" />

                {currentQ.questionImage && <img src={currentQ.questionImage} alt="Diagram" className="tst-question-image" />}

                <div className="tst-options" role="radiogroup">
                  {currentQ.options?.map((opt: any) => {
                    const isSelected = answers[currentQ._id]?.includes(opt.id);
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!!isSelected}
                        key={opt.id}
                        className={`ui-option${isSelected ? ' is-selected' : ''}`}
                        onClick={() => handleSelectOption(opt.id)}
                      >
                        <span className="ui-option-key">{opt.id.toUpperCase()}</span>
                        <HtmlContent html={opt.text} className="ui-grow" />
                      </button>
                    );
                  })}
                </div>

                <div className="tst-q-nav">
                  <button
                    type="button"
                    className="ui-btn is-outline"
                    onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
                    disabled={isFirst}
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>

                  {isLast ? (
                    <button type="button" className="ui-btn is-gold" onClick={() => handleFinalSubmit(false)}>
                      <Send size={15} /> Submit test
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ui-btn is-primary"
                      onClick={() => setCurrentQIdx((prev) => Math.min(allQuestions.length - 1, prev + 1))}
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="ui-tile">
              <EmptyState
                icon={<HelpCircle size={24} />}
                title="No questions in this section"
                text="There’s nothing to answer here yet."
              />
            </div>
          )}
        </main>

        <aside className={`tst-palette-wrap${showNavGrid ? ' is-open' : ''}`}>
          <div className="ui-tile tst-palette">
            <button
              type="button"
              className="tst-palette-head"
              onClick={() => setShowNavGrid(!showNavGrid)}
              aria-expanded={showNavGrid}
            >
              <div className="ui-grow">
                <div className="ui-section-title">Question palette</div>
                <div className="ui-faint">
                  {answeredCount} of {allQuestions.length} answered
                </div>
              </div>
              <ChevronDown size={18} className="tst-palette-chevron" />
            </button>

            <ProgressBar value={answeredPct} height={6} tone="gold" />

            <div className="tst-palette-grid">
              {allQuestions.map((q: any, idx: number) => {
                const isAnswered = isAnsweredQ(q);
                const isFlagged = !!flagged[q._id];
                const isCurrent = idx === currentQIdx;
                const state = `${isAnswered ? ' is-answered' : ''}${isFlagged ? ' is-flagged' : ''}${isCurrent ? ' is-current' : ''}`;

                return (
                  <button
                    type="button"
                    key={q._id}
                    className={`tst-palette-cell${state}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Question ${idx + 1}${isAnswered ? ', answered' : ', not answered'}${isFlagged ? ', marked for review' : ''}`}
                    onClick={() => {
                      setCurrentQIdx(idx);
                      setShowNavGrid(false);
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <ul className="tst-legend">
              <li>
                <span className="tst-legend-swatch is-answered" /> Answered
              </li>
              <li>
                <span className="tst-legend-swatch is-flagged" /> Marked
              </li>
              <li>
                <span className="tst-legend-swatch is-current" /> Current
              </li>
              <li>
                <span className="tst-legend-swatch" /> Not answered
              </li>
            </ul>

            <button type="button" className="ui-btn is-primary is-block tst-palette-submit" onClick={() => handleFinalSubmit(false)}>
              <Send size={15} /> Submit test
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
