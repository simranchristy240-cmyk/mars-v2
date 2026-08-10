import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Clock, Calendar, AlertCircle, FileSpreadsheet, PlayCircle, ArrowLeft } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const TestLobby: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['course-tests', courseId],
    queryFn: () => api.get(`/tests/course/${courseId}`),
    enabled: !!courseId,
  });

  const tests = data?.data?.data || [];

  return (
    <StudentPageShell>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: '16px' }}
      >
        <ArrowLeft size={18} /> Back to Course
      </button>

      <h1 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Course Test Series</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Scheduled timed tests. Single attempt policy strictly enforced.
      </p>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <FileSpreadsheet size={36} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <h3>No Tests Scheduled Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Admin will schedule upcoming anatomy tests for this course soon.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tests.map((test: any) => {
            const now = new Date();
            const start = new Date(test.startTime);
            const end = new Date(test.endTime);
            const isUpcoming = now < start;
            const isExpired = now > end;
            const isOpen = now >= start && now <= end;

            return (
              <div key={test._id} className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.2rem' }}>{test.title}</h2>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: isOpen
                        ? 'var(--success-light)'
                        : isUpcoming
                        ? 'var(--warning-light)'
                        : 'var(--bg-secondary)',
                      color: isOpen ? 'var(--success)' : isUpcoming ? 'var(--warning)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {isOpen ? 'AVAILABLE NOW' : isUpcoming ? 'UPCOMING' : 'EXPIRED'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {test.description || 'Timed comprehensive exam.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Duration: {test.duration} mins
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Schedule: {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {test.hasAttempted ? (
                    <button
                      onClick={() => navigate(`/tests/${test._id}/report`)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      View Attempt Report & Score
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (isOpen) navigate(`/tests/${test._id}/attempt`);
                        else alert('Test is not currently in the open schedule window.');
                      }}
                      disabled={!isOpen}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 'var(--radius-full)',
                        background: isOpen ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: 'var(--on-accent)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        opacity: isOpen ? 1 : 0.5,
                      }}
                    >
                      Start Test Attempt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentPageShell>
  );
};
