import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BarChart2, CheckCircle2, Award, BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { EmptyState, PageHeader, ProgressBar, ProgressRing } from '../../components/ui';
import '../../styles/pages/reports.css';

const STRONG_SCORE = 70;
const TREND_LIMIT = 12;

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

export const Reports: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: () => api.get('/reports/overview'),
  });

  const report = data?.data?.data;
  const testScores = report?.testScoresTrend || [];
  const courseProgress = report?.courseProgress || [];

  const testsTaken: number = report?.totalTestsTaken || 0;
  const averageScore: number = report?.averageTestScore || 0;
  const bestScore = testScores.reduce((max: number, t: any) => Math.max(max, t.percentage || 0), 0);
  const strongCount = testScores.filter((t: any) => t.percentage >= STRONG_SCORE).length;
  const lessonsDone = courseProgress.reduce((sum: number, cp: any) => sum + (cp.lessonsCompleted?.length || 0), 0);
  const practiceAttempts = courseProgress.flatMap((cp: any) => cp.practiceAttempts || []);
  const practiceCorrect = practiceAttempts.filter((p: any) => p.isCorrect).length;
  const practiceAccuracy = practiceAttempts.length ? Math.round((practiceCorrect / practiceAttempts.length) * 100) : 0;
  const trend = testScores.slice(0, TREND_LIMIT).reverse();

  const heroLine =
    testsTaken === 0
      ? 'Take your first test to start tracking your scores.'
      : averageScore >= STRONG_SCORE
      ? 'Strong work. Keep that momentum going.'
      : 'Every test sharpens your aim. Keep practising.';

  const metrics = [
    { label: 'Tests taken', value: testsTaken, unit: '', icon: <CheckCircle2 size={18} />, tone: '' },
    { label: 'Best score', value: bestScore, unit: '%', icon: <Award size={18} />, tone: 'is-gold' },
    { label: 'Lessons done', value: lessonsDone, unit: '', icon: <BookOpen size={18} />, tone: '' },
    {
      label: 'Practice accuracy',
      value: practiceAccuracy,
      unit: '%',
      icon: <Target size={18} />,
      tone: 'is-success',
      meta: practiceAttempts.length ? `${practiceCorrect}/${practiceAttempts.length} correct` : 'No practice yet',
    },
  ];

  if (isLoading) {
    return (
      <StudentPageShell>
        <PageHeader eyebrow="Progress" title="Your learning, at a glance" />
        <div className="ui-bento">
          <div className="ui-skeleton span-5" style={{ ['--h' as string]: '240px' }} />
          <div className="ui-skeleton span-7" style={{ ['--h' as string]: '240px' }} />
          <div className="ui-skeleton span-12" style={{ ['--h' as string]: '320px' }} />
        </div>
      </StudentPageShell>
    );
  }

  return (
    <StudentPageShell>
      <PageHeader
        eyebrow="Progress"
        title="Your learning, at a glance"
        subtitle="Track your test scores, course completion and practice accuracy."
      />

      <div className="ui-bento">
        {/* Average score hero */}
        <section className="ui-tile is-inverse span-5 md-span-3 rep-hero ui-rise" style={{ ['--i' as string]: 0 }}>
          <div className="ui-sunburst" aria-hidden="true" />
          <span className="ui-label">Average test score</span>
          <div className="rep-hero-body">
            <ProgressRing value={averageScore} size={128} stroke={10} color="var(--ui-gold)">
              <div className="rep-hero-ring">
                {averageScore}
                <span>%</span>
              </div>
            </ProgressRing>
            <p className="rep-hero-line">{heroLine}</p>
          </div>
          <div className="ui-row">
            <span className="ui-chip is-on-inverse">
              {testsTaken} {testsTaken === 1 ? 'test' : 'tests'} taken
            </span>
            {testsTaken > 0 && (
              <span className="ui-chip is-gold">
                {strongCount} at {STRONG_SCORE}%+
              </span>
            )}
          </div>
        </section>

        {/* Score trend */}
        <section className="ui-tile span-7 md-span-3 rep-trend ui-rise" style={{ ['--i' as string]: 1 }}>
          <div className="ui-tile-head">
            <div>
              <h2 className="ui-section-title">Score trend</h2>
              <p className="ui-faint rep-sub">
                {trend.length ? `Your last ${trend.length} ${trend.length === 1 ? 'test' : 'tests'}, oldest to newest` : 'Scores appear after your first test'}
              </p>
            </div>
            <span className="ui-icon-box" style={{ ['--size' as string]: '38px' }}>
              <TrendingUp size={18} />
            </span>
          </div>

          {trend.length === 0 ? (
            <EmptyState
              icon={<BarChart2 size={24} />}
              title="No scores yet"
              text="Complete a test series to see your performance trend."
            />
          ) : (
            <div className="rep-chart" role="img" aria-label="Test score trend">
              <div className="rep-chart-goal" style={{ bottom: `${STRONG_SCORE}%` }}>
                <span>{STRONG_SCORE}%</span>
              </div>
              {trend.map((t: any, idx: number) => (
                <div key={idx} className="rep-chart-col" title={`${t.testTitle} · ${t.percentage}%`}>
                  <span
                    className={`rep-chart-bar${idx === trend.length - 1 ? ' is-latest' : ''}`}
                    style={{ height: `${Math.max(2, Math.min(100, t.percentage || 0))}%`, ['--i' as string]: idx }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary metrics */}
        <div className="rep-metrics">
          {metrics.map((m, idx) => (
            <div key={m.label} className="ui-tile is-compact rep-metric ui-rise" style={{ ['--i' as string]: idx + 2 }}>
              <div className="ui-row is-between is-nowrap">
                <span className="ui-label">{m.label}</span>
                <span className={`ui-icon-box ${m.tone}`} style={{ ['--size' as string]: '34px' }}>
                  {m.icon}
                </span>
              </div>
              <div className="ui-metric rep-metric-value">
                {m.value}
                {m.unit && <small>{m.unit}</small>}
              </div>
              {m.meta && <div className="ui-faint">{m.meta}</div>}
            </div>
          ))}
        </div>

        {/* Course progress */}
        <section className="ui-tile span-7 ui-rise" style={{ ['--i' as string]: 6 }}>
          <div className="ui-tile-head">
            <h2 className="ui-section-title">Course progress</h2>
            <span className="ui-chip">
              {courseProgress.length} {courseProgress.length === 1 ? 'course' : 'courses'}
            </span>
          </div>

          {courseProgress.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={24} />}
              title="Nothing tracked yet"
              text="Enrolled course progress will appear here."
            />
          ) : (
            <div className="ui-list">
              {courseProgress.map((cp: any) => {
                const pct = Math.round(cp.overallPercentage || 0);
                const lessons = cp.lessonsCompleted?.length || 0;
                const practiced = cp.practiceAttempts?.length || 0;
                return (
                  <div key={cp._id} className="ui-list-item rep-course">
                    <ProgressRing value={pct} size={56} stroke={6} color={pct >= 100 ? 'var(--success)' : undefined}>
                      <span className="rep-course-ring">{pct}%</span>
                    </ProgressRing>
                    <div className="ui-grow">
                      <div className="ui-list-title ui-truncate">{cp.courseId?.title || 'Anatomy Course'}</div>
                      <div className="ui-list-meta">
                        {lessons} {lessons === 1 ? 'lesson' : 'lessons'} completed
                        {practiced > 0 && ` · ${practiced} practice ${practiced === 1 ? 'question' : 'questions'}`}
                      </div>
                      <div className="rep-course-bar">
                        <ProgressBar value={pct} height={5} tone={pct >= 100 ? 'success' : undefined} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent tests */}
        <section className="ui-tile span-5 ui-rise" style={{ ['--i' as string]: 7 }}>
          <div className="ui-tile-head">
            <h2 className="ui-section-title">Recent tests</h2>
            {bestScore > 0 && <span className="ui-chip is-gold">Best {bestScore}%</span>}
          </div>

          {testScores.length === 0 ? (
            <EmptyState
              icon={<Clock size={24} />}
              title="No tests yet"
              text="No test scores recorded yet. Complete a test series to view your results here."
            />
          ) : (
            <div className="ui-list rep-tests">
              {testScores.map((t: any, idx: number) => {
                const isStrong = t.percentage >= STRONG_SCORE;
                return (
                  <div key={idx} className="ui-list-item">
                    <span className={`ui-icon-box ${isStrong ? 'is-success' : ''}`} style={{ ['--size' as string]: '38px' }}>
                      <BarChart2 size={17} />
                    </span>
                    <div className="ui-grow">
                      <div className="ui-list-title ui-truncate">{t.testTitle}</div>
                      <div className="rep-test-bar">
                        <ProgressBar value={t.percentage} height={4} tone={isStrong ? 'success' : undefined} />
                        {t.date && <span className="ui-faint">{formatDate(t.date)}</span>}
                      </div>
                    </div>
                    <span className={`ui-chip ${isStrong ? 'is-success' : 'is-warning'}`}>{t.percentage}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </StudentPageShell>
  );
};
