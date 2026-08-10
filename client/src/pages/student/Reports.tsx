import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BarChart2, CheckCircle2, Award, BookOpen, Clock } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const Reports: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: () => api.get('/reports/overview'),
  });

  const report = data?.data?.data;
  const testScores = report?.testScoresTrend || [];
  const courseProgress = report?.courseProgress || [];

  return (
    <StudentPageShell>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Learning Reports & Progress</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Track your improvement, test scores, and video watch completion stats.
      </p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tests Attempted</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>
            {report?.totalTestsTaken || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Average Test Score</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
            {report?.averageTestScore || 0}%
          </div>
        </div>
      </div>

      {/* Test Score Trend Chart Representation */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="var(--accent)" /> Test Performance History
        </h2>

        {testScores.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No test scores recorded yet. Complete a test series to view performance trends!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {testScores.map((t: any, idx: number) => (
              <div key={idx} style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>{t.testTitle}</span>
                  <span style={{ color: 'var(--accent)' }}>{t.percentage}%</span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${t.percentage}%`,
                      height: '100%',
                      background: t.percentage >= 70 ? 'var(--success)' : 'var(--warning)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Completion Breakdown */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="var(--accent)" /> Course Progress Stats
        </h2>

        {courseProgress.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enrolled course progress will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {courseProgress.map((cp: any) => (
              <div key={cp._id} style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                  {cp.courseId?.title || 'Anatomy Course'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Lessons Completed: {cp.lessonsCompleted?.length || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentPageShell>
  );
};
