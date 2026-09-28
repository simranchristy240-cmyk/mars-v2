import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trophy, CheckCircle, XCircle, Clock, ArrowLeft, BarChart2, MinusCircle, Home, FileSearch } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';
import { EmptyState, ProgressBar, ProgressRing } from '../../components/ui';
import '../../styles/pages/tests.css';

const isAnswerCorrect = (q: any, ans: any) => {
  const correctOpts = (q.options || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
  return (
    correctOpts.length === (ans.selectedOptions || []).length &&
    correctOpts.every((id: string) => (ans.selectedOptions || []).includes(id))
  );
};

const getCheer = (pct: number) => {
  if (pct >= 80) return { lead: 'Outstanding!', text: 'You nailed this one.' };
  if (pct >= 60) return { lead: 'Great work.', text: 'You’re well on your way.' };
  if (pct >= 40) return { lead: 'Good effort.', text: 'A little more revision and you’re there.' };
  return { lead: 'Every attempt counts.', text: 'Review the answers below and come back stronger.' };
};

const formatDuration = (ms: number) => {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return { m, s };
};

export const TestReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['test-report', id],
    queryFn: () => api.get(`/tests/${id}/report`),
    enabled: !!id,
  });

  const reportData = data?.data?.data;
  const attempt = reportData?.attempt;
  const test = reportData?.test;

  if (isLoading) {
    return (
      <StudentPageShell>
        <div className="ui-bento" aria-busy="true">
          <div className="ui-skeleton span-8" style={{ ['--h' as string]: '280px' }} />
          <div className="ui-skeleton span-4" style={{ ['--h' as string]: '280px' }} />
          <div className="ui-skeleton" style={{ ['--h' as string]: '140px' }} />
        </div>
        <p className="ui-faint tst-loading-text">Generating test report…</p>
      </StudentPageShell>
    );
  }

  if (!attempt) {
    return (
      <StudentPageShell narrow>
        <div className="ui-tile tst-report-state">
          <EmptyState
            icon={<FileSearch size={24} />}
            title="Test attempt report not found"
            text="We couldn’t find a submitted attempt for this test."
            action={
              <button type="button" className="ui-btn is-primary" onClick={() => navigate('/')}>
                <Home size={16} /> Back to home
              </button>
            }
          />
        </div>
      </StudentPageShell>
    );
  }

  const answers: any[] = attempt.answers || [];
  const graded = answers.filter((a) => a.questionId);
  const correctCount = graded.filter((a) => (a.selectedOptions || []).length > 0 && isAnswerCorrect(a.questionId, a)).length;
  const wrongCount = graded.filter((a) => (a.selectedOptions || []).length > 0 && !isAnswerCorrect(a.questionId, a)).length;
  const totalQuestions =
    (test?.sections || []).reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || graded.length;
  const skippedCount = Math.max(0, totalQuestions - correctCount - wrongCount);
  const reviewCorrect = graded.filter((a) => isAnswerCorrect(a.questionId, a)).length;
  const attemptedCount = correctCount + wrongCount;
  const accuracy = attemptedCount ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : NaN;
  const endedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : NaN;
  const timeSpent = Number.isFinite(startedAt) && Number.isFinite(endedAt) ? formatDuration(endedAt - startedAt) : null;

  const percentage = attempt.percentage || 0;
  const cheer = getCheer(percentage);
  const hasPassMark = typeof test?.passingMarks === 'number' && test.passingMarks > 0;
  const passed = hasPassMark && attempt.score >= test.passingMarks;

  const topicRows: { name: string; correct: number; total: number; pct: number }[] =
    (attempt.topicWiseScores || []).length > 0
      ? attempt.topicWiseScores.map((t: any) => ({
          name: t.topicName || 'Topic',
          correct: t.correct || 0,
          total: t.total || 0,
          pct: t.percentage ?? (t.total ? Math.round(((t.correct || 0) / t.total) * 100) : 0),
        }))
      : (test?.sections || [])
          .map((s: any) => {
            const ids = new Set((s.questions || []).map((qid: any) => String(qid?._id || qid)));
            const correct = graded.filter(
              (a) =>
                ids.has(String(a.questionId._id)) &&
                (a.selectedOptions || []).length > 0 &&
                isAnswerCorrect(a.questionId, a)
            ).length;
            const total = ids.size;
            return { name: s.name, correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
          })
          .filter((r: any) => r.total > 0);
  const breakdownLabel = (attempt.topicWiseScores || []).length > 0 ? 'Topic-wise breakdown' : 'Section breakdown';

  const stats = [
    { label: 'Correct', value: correctCount, icon: <CheckCircle size={18} />, tone: 'is-success', foot: `${accuracy}% accuracy` },
    { label: 'Wrong', value: wrongCount, icon: <XCircle size={18} />, tone: 'is-danger', foot: test?.negativeMarkingEnabled ? 'Negative marking on' : 'No negative marking' },
    { label: 'Skipped', value: skippedCount, icon: <MinusCircle size={18} />, tone: '', foot: `of ${totalQuestions} questions` },
  ];

  return (
    <StudentPageShell>
      <div className="tst-topbar">
        <button type="button" className="ui-btn is-ghost is-sm tst-back" onClick={() => navigate('/reports')}>
          <ArrowLeft size={16} /> Back to reports
        </button>
      </div>

      <div className="ui-bento">
        {/* Hero */}
        <section className="ui-tile is-inverse span-8 tst-hero ui-rise" style={{ ['--i' as string]: 0 }}>
          <div className="ui-sunburst" aria-hidden="true" />
          <div className="tst-hero-top">
            <div className="ui-row">
              <span className="ui-label">
                Test report · {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString()}
              </span>
              {attempt.isAutoSubmitted && <span className="ui-chip is-on-inverse">Auto-submitted</span>}
              {hasPassMark && (
                <span className={`ui-chip ${passed ? 'is-success' : 'is-danger'}`}>{passed ? 'Passed' : 'Below pass mark'}</span>
              )}
            </div>
            <h1 className="tst-hero-title">{test?.title || 'Test attempt report'}</h1>
            <p className="tst-hero-cheer">
              <strong>{cheer.lead}</strong> {cheer.text}
            </p>
          </div>

          <div className="tst-hero-score">
            <ProgressRing value={percentage} size={128} stroke={10} color="var(--ui-gold)">
              <div className="tst-hero-ring">
                {percentage}%<span>Score</span>
              </div>
            </ProgressRing>
            <div className="ui-grow">
              <div className="ui-label">Marks scored</div>
              <div className="ui-metric">
                {attempt.score}
                <small>/ {attempt.totalMarks}</small>
              </div>
            </div>
          </div>

          <div className="ui-row tst-hero-actions">
            <button type="button" className="ui-btn is-gold" onClick={() => navigate('/')}>
              <Home size={15} /> Back to home
            </button>
            <button type="button" className="ui-btn is-on-inverse" onClick={() => navigate('/reports')}>
              <BarChart2 size={15} /> All reports
            </button>
          </div>
        </section>

        {/* Rank */}
        <div className="ui-tile is-gold span-4 tst-rank ui-rise" style={{ ['--i' as string]: 1 }}>
          <div className="ui-row is-between">
            <span className="ui-label">Your rank</span>
            <span className="tst-rank-badge">
              <Trophy size={18} />
            </span>
          </div>
          <div className="ui-metric">#{attempt.rank || 1}</div>
          <div className="ui-faint">Among everyone who took this test</div>
        </div>

        {/* Stats */}
        <div className="tst-stats">
          {stats.map((s, i) => (
            <div key={s.label} className="ui-tile tst-stat ui-rise" style={{ ['--i' as string]: i + 2 }}>
              <div className="ui-row is-between is-nowrap">
                <span className="ui-label">{s.label}</span>
                <span className={`ui-icon-box ${s.tone}`} style={{ ['--size' as string]: '34px' }}>
                  {s.icon}
                </span>
              </div>
              <div className="ui-metric">{s.value}</div>
              <div className="ui-faint">{s.foot}</div>
            </div>
          ))}
          <div className="ui-tile tst-stat ui-rise" style={{ ['--i' as string]: 5 }}>
            <div className="ui-row is-between is-nowrap">
              <span className="ui-label">Time</span>
              <span className="ui-icon-box is-gold" style={{ ['--size' as string]: '34px' }}>
                <Clock size={18} />
              </span>
            </div>
            <div className="ui-metric">
              {timeSpent ? (
                <>
                  {timeSpent.m}
                  <small>m</small> {timeSpent.s}
                  <small>s</small>
                </>
              ) : (
                '—'
              )}
            </div>
            <div className="ui-faint">{test?.duration ? `of ${test.duration} min allowed` : 'Time spent'}</div>
          </div>
        </div>

        {/* Breakdown */}
        {topicRows.length > 0 && (
          <section className="ui-tile ui-rise" style={{ ['--i' as string]: 6 }}>
            <div className="ui-tile-head">
              <div>
                <h2 className="ui-section-title">{breakdownLabel}</h2>
                <p className="ui-faint">See where you’re strong and what to revise next.</p>
              </div>
            </div>
            <div className="tst-breakdown-list">
              {topicRows.map((row, i) => (
                <div key={`${row.name}-${i}`} className="tst-breakdown-row">
                  <div className="tst-breakdown-meta">
                    <span className="tst-breakdown-name ui-truncate">{row.name}</span>
                    <span className="tst-breakdown-score">
                      {row.correct}/{row.total}
                      <strong>{row.pct}%</strong>
                    </span>
                  </div>
                  <ProgressBar
                    value={row.pct}
                    height={8}
                    tone={row.pct >= 80 ? 'success' : row.pct >= 40 ? undefined : 'gold'}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Question-by-question review */}
      <div className="tst-review-head">
        <div>
          <h2 className="ui-section-title">Question-by-question review</h2>
          <p className="ui-faint">Your answers next to the correct ones, with explanations.</p>
        </div>
        <div className="ui-row">
          <span className="ui-chip is-success">{reviewCorrect} correct</span>
          <span className="ui-chip is-danger">{graded.length - reviewCorrect} incorrect</span>
        </div>
      </div>

      <div className="tst-review-list">
        {attempt.answers?.map((ans: any, idx: number) => {
          const q = ans.questionId;
          if (!q) return null;

          const isCorrect = isAnswerCorrect(q, ans);

          return (
            <article key={q._id || idx} className="ui-tile tst-review">
              <div className="ui-tile-head">
                <span className="tst-review-num">Question {idx + 1}</span>
                <span className={`ui-chip ${isCorrect ? 'is-success' : 'is-danger'}`}>
                  {isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <HtmlContent as="div" html={q.questionText} className="tst-review-text" />

              <div className="tst-review-options">
                {q.options?.map((opt: any) => {
                  const wasSelected = ans.selectedOptions?.includes(opt.id);
                  const isOptCorrect = opt.isCorrect;
                  const state = isOptCorrect ? ' is-correct' : wasSelected ? ' is-wrong' : '';

                  return (
                    <div key={opt.id} className={`ui-option tst-review-option${state}`}>
                      <span className="ui-option-key">{opt.id.toUpperCase()}</span>
                      <HtmlContent html={opt.text} className="ui-grow" />
                      {isOptCorrect && <span className="tst-review-tag">{wasSelected ? 'Your answer · Correct' : 'Correct answer'}</span>}
                      {wasSelected && !isOptCorrect && <span className="tst-review-tag">Your choice</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ui-callout tst-review-explanation">
                  <div className="ui-grow">
                    <div className="ui-label">Explanation</div>
                    <HtmlContent as="div" html={q.explanation} className="tst-review-explanation-body" />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </StudentPageShell>
  );
};
