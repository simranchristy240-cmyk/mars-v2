import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Clock, Calendar, FileSpreadsheet, ArrowLeft, ArrowRight, CheckCircle2, BarChart2, Lock, Minus } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { EmptyState, PageHeader } from '../../components/ui';
import '../../styles/pages/tests.css';

const formatClock = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const TestLobby: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['course-tests', courseId],
    queryFn: () => api.get(`/tests/course/${courseId}`),
    enabled: !!courseId,
  });

  const tests = data?.data?.data || [];

  const now = new Date();
  const liveCount = tests.filter(
    (t: any) => !t.hasAttempted && now >= new Date(t.startTime) && now <= new Date(t.endTime)
  ).length;
  const doneCount = tests.filter((t: any) => t.hasAttempted).length;

  return (
    <StudentPageShell>
      <div className="tst-topbar">
        <button type="button" className="ui-btn is-ghost is-sm tst-back" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to home
        </button>
      </div>

      <PageHeader
        eyebrow="Test series"
        title="Course test series"
        subtitle="Scheduled, timed tests. You get one attempt at each, so make it count."
        actions={
          tests.length > 0 ? (
            <>
              {liveCount > 0 && (
                <span className="ui-chip is-gold">
                  <span className="ui-dot" /> {liveCount} live now
                </span>
              )}
              <span className="ui-chip">
                {doneCount}/{tests.length} completed
              </span>
            </>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="ui-grid tst-lobby-grid" aria-busy="true">
          <div className="ui-skeleton tst-skel-card" />
          <div className="ui-skeleton tst-skel-card" />
          <div className="ui-skeleton tst-skel-card" />
        </div>
      ) : tests.length === 0 ? (
        <div className="ui-tile">
          <EmptyState
            icon={<FileSpreadsheet size={24} />}
            title="No tests scheduled yet"
            text="Your admin will schedule upcoming tests for this course soon."
          />
        </div>
      ) : (
        <div className="ui-grid tst-lobby-grid">
          {tests.map((test: any, index: number) => {
            const now = new Date();
            const start = new Date(test.startTime);
            const end = new Date(test.endTime);
            const isUpcoming = now < start;
            const isExpired = now > end;
            const isOpen = now >= start && now <= end;

            const status = test.hasAttempted
              ? { label: 'Completed', tone: 'is-success' }
              : isOpen
              ? { label: 'Live now', tone: 'is-gold' }
              : isUpcoming
              ? { label: 'Upcoming', tone: '' }
              : { label: 'Ended', tone: 'is-outline' };

            const isLive = isOpen && !test.hasAttempted;

            return (
              <article
                key={test._id}
                className={`ui-tile tst-test ui-rise${isLive ? ' is-live' : ''}${isExpired && !test.hasAttempted ? ' is-ended' : ''}`}
                style={{ ['--i' as string]: Math.min(index, 8) }}
              >
                <div className="ui-row is-between">
                  <span className={`ui-chip ${status.tone}`}>
                    {isLive && <span className="ui-dot tst-live-dot" />}
                    {test.hasAttempted && <CheckCircle2 size={12} />}
                    {status.label}
                  </span>
                  {test.negativeMarkingEnabled && (
                    <span className="ui-chip is-outline">
                      <Minus size={11} /> Negative marking
                    </span>
                  )}
                </div>

                <h2 className="ui-title tst-test-title">{test.title}</h2>
                <p className="ui-faint ui-clamp-2 tst-test-desc">{test.description || 'Timed comprehensive exam.'}</p>

                <div className="tst-test-meta">
                  <span>
                    <Clock size={14} /> {test.duration} min
                  </span>
                  {test.totalMarks ? (
                    <span>
                      <CheckCircle2 size={14} /> {test.totalMarks} marks
                    </span>
                  ) : null}
                </div>

                <div className="tst-test-schedule">
                  <span className="ui-icon-box" style={{ ['--size' as string]: '36px' }}>
                    <Calendar size={16} />
                  </span>
                  <div className="ui-grow">
                    <div className="tst-test-date">
                      {start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="ui-faint">
                      {formatClock(start)} – {formatClock(end)}
                    </div>
                  </div>
                </div>

                <div className="tst-test-cta">
                  {test.hasAttempted ? (
                    <button
                      type="button"
                      className="ui-btn is-outline is-block"
                      onClick={() => navigate(`/tests/${test._id}/report`)}
                    >
                      <BarChart2 size={15} /> View report &amp; score
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`ui-btn is-block ${isOpen ? 'is-primary' : ''}`}
                      onClick={() => {
                        if (isOpen) navigate(`/tests/${test._id}/attempt`);
                        else alert('Test is not currently in the open schedule window.');
                      }}
                      disabled={!isOpen}
                    >
                      {isOpen ? (
                        <>
                          Start test <ArrowRight size={15} />
                        </>
                      ) : isUpcoming ? (
                        <>
                          <Lock size={14} /> Opens {start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </>
                      ) : (
                        'Test ended'
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </StudentPageShell>
  );
};
