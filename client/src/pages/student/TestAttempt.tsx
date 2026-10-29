import { PendingTestAnswer, savePendingAnswers } from '../../services/answerQueue';
import { QuestionAnswer } from '../../components/QuestionAnswer';
import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const { user } = useAuth();
  const [testData, setTestData] = useState<any>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [status, setStatus] = useState('Loading test...');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const pending = useRef<Record<string, PendingTestAnswer>>({});
  const saving = useRef<Promise<boolean> | null>(null);
  const submittingRef = useRef(false);
  const deadline = useRef(0);
  const ready = useRef(false);
  const reviewDialog = useRef<HTMLDivElement>(null);
  const storageKey = `mars-test-pending:${user?._id}:${id}`;
  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(pending.current)); }
    catch { setError('Browser storage is unavailable. Keep this tab open until all answers are saved.'); }
  }, [storageKey]);

  const flush = useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    const run = async () => {
      try {
        if (Object.keys(pending.current).length) setStatus('Saving answers...');
        await savePendingAnswers(pending.current, answer => api.put(`/tests/${id}/answer`, answer, { timeout: 10000 }), persist);
        setStatus('All answers saved');
        return true;
      } catch (err: any) {
        setStatus(err.response?.data?.expired ? 'Time ended. Unsaved changes could not be accepted.' : 'Answers not saved. Retrying automatically...');
        return false;
      }
    };
    saving.current = run().finally(() => { saving.current = null; });
    return saving.current;
  }, [id, persist]);

  const submit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const saved = await flush();
      if (!saved && !auto) {
        setError('Some answers are not saved. Reconnect and retry before submitting.');
        return;
      }
      await api.post(`/tests/${id}/submit`, {}, { timeout: 15000 });

      try { localStorage.removeItem(storageKey); } catch { /* Submission is already saved on the server. */ }
      navigate(`/tests/${id}/report`, { replace: true, state: !saved ? { notice: 'Time ended. Only answers received by the server before the deadline were included.' } : undefined });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed. Reconnect and retry; your pending answers remain on this device.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [flush, id, navigate, storageKey]);

  useEffect(() => {
    let cancelled = false;
    ready.current = false;
    const load = async () => {
      try {
        const res = await api.post(`/tests/${id}/start`, {}, { timeout: 15000 });
        if (cancelled) return;
        const { test, attempt, deadline: endsAt, serverNow } = res.data.data;
        if (attempt.status !== 'in-progress') {
          let hasPending = false;
          try { hasPending = Object.keys(JSON.parse(localStorage.getItem(storageKey) || '{}')).length > 0; localStorage.removeItem(storageKey); } catch { /* Storage unavailable. */ }
          navigate(`/tests/${id}/report`, { replace: true, state: hasPending ? { notice: 'This test has ended. Pending changes on this device were not included; only answers already saved on the server were graded.' } : undefined });
          return;
        }
        const restored: Record<string, string[]> = {};
        const flags: Record<string, boolean> = {};
        attempt.answers?.forEach((answer: any) => {
          restored[answer.questionId] = answer.selectedOptions || [];
          flags[answer.questionId] = !!answer.isMarkedForReview;
        });
        try { pending.current = JSON.parse(localStorage.getItem(storageKey) || '{}'); }
        catch { pending.current = {}; }
        for (const answer of Object.values(pending.current)) {
          restored[answer.questionId] = answer.selectedOptions;
          flags[answer.questionId] = answer.isMarkedForReview;
        }
        deadline.current = performance.now() + Math.max(0, Date.parse(endsAt) - Date.parse(serverNow));
        setTimeLeftSeconds(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)));
        setTestData(test);
        setAnswers(restored);
        setFlagged(flags);
        setError('');
        ready.current = true;
        void flush();
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.error || 'Unable to load the test. Check your connection and retry.');
      }
    };
    void load();
    return () => { cancelled = true; ready.current = false; };
  }, [id, storageKey, loadVersion, flush, navigate]);

  useEffect(() => {
    let autoAttempted = false;
    const timer = window.setInterval(() => {
      if (!ready.current) return;
      const left = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
      setTimeLeftSeconds(left);
      if (!left && !autoAttempted) { autoAttempted = true; void submit(true); }
    }, 250);
    const retry = () => { if (ready.current) { if (deadline.current > performance.now()) void flush(); else void submit(true); } };
    const retries = window.setInterval(retry, 5000);
    window.addEventListener('online', retry);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { clearInterval(timer); clearInterval(retries); window.removeEventListener('online', retry); window.removeEventListener('beforeunload', beforeUnload); };
  }, [flush, submit, loadVersion]);

  useEffect(() => {
    if (!review) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = reviewDialog.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) { event.preventDefault(); setReview(false); }
      if (event.key !== 'Tab') return;
      const controls = dialog?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!controls?.length) { event.preventDefault(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => { document.removeEventListener('keydown', trapFocus); previous?.focus(); };
  }, [review]);

  if (!testData) return <div className="tst-exam-loading" role="status">
    <p>{error || 'Loading test environment...'}</p>
    {error && <button className="ui-btn is-primary" onClick={() => setLoadVersion(v => v + 1)}>Retry loading</button>}
  </div>;

  const allQuestions = testData.sections.flatMap((section: any) => (section.questions || []).map((question: any) => ({ ...question, sectionName: section.name })));
  const currentQ = allQuestions[currentQIdx];
  const queueAnswer = (selectedOptions: string[], isMarkedForReview: boolean) => {
    if (!currentQ || submittingRef.current || performance.now() >= deadline.current) return;
    const answer = { questionId: currentQ._id, selectedOptions, isMarkedForReview };
    pending.current[currentQ._id] = answer;
    persist();
    setAnswers(prev => ({ ...prev, [currentQ._id]: selectedOptions }));
    setFlagged(prev => ({ ...prev, [currentQ._id]: isMarkedForReview }));
    void flush();
  };
  const toggleFlag = () => queueAnswer(answers[currentQ._id] || [], !flagged[currentQ._id]);
  const handleFinalSubmit = (auto = false) => auto ? void submit(true) : setReview(true);

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
              {currentQ?.sectionName}
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

      <div className="ui-callout" role="status">{status}
        <button type="button" className="ui-btn is-ghost is-sm" disabled={submitting} onClick={() => timeLeftSeconds <= 0 ? void submit(true) : void flush()}>Retry {timeLeftSeconds <= 0 ? 'submission' : 'saving'}</button>
      </div>
      {error && <div className="ui-callout is-danger" role="alert">{error}</div>}
      {review && <div className="ui-modal-backdrop"><div ref={reviewDialog} className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" style={{ padding: 24 }}>
        <h2 id="submit-title">Submit your test?</h2>
        <p>{answeredCount} answered / {allQuestions.length - answeredCount} unanswered / {flaggedCount} marked for review across all sections.</p>
        <p>You cannot change answers after submission.</p>
        <button autoFocus type="button" className="ui-btn is-outline" disabled={submitting} onClick={() => setReview(false)}>Continue reviewing</button>
        <button type="button" className="ui-btn is-primary" disabled={submitting} onClick={() => void submit(timeLeftSeconds <= 0)}>{submitting ? 'Submitting...' : 'Confirm submission'}</button>
      </div></div>}
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

                <QuestionAnswer question={currentQ} value={answers[currentQ._id] || []}
                  onChange={value => queueAnswer(value, !!flagged[currentQ._id])} disabled={submitting || timeLeftSeconds <= 0} />
                <button type="button" className="ui-btn is-ghost" disabled={submitting || timeLeftSeconds <= 0} onClick={() => queueAnswer([], !!flagged[currentQ._id])}>Clear answer</button>

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
