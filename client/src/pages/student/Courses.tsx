import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const Courses: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses'),
  });

  const courses = (data?.data?.data || []).filter((c: any) => !c.isEnrolled);

  return (
    <StudentPageShell>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Anatomy Courses</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Master human anatomy through structured topics, video lessons, and practice tests.
      </p>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <BookOpen size={40} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <h3>You&apos;re enrolled in all courses</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Check back later when new courses are published.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {courses.map((c: any) => (
            <div
              key={c._id}
              onClick={() => navigate(`/course/${c._id}`)}
              className="glass-card"
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                background: 'var(--course-catalog-bg)',
                border: '1px solid var(--course-catalog-border)',
                boxShadow: 'var(--course-catalog-shadow)',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  background: 'var(--course-catalog-icon-bg)',
                  border: '1px solid var(--course-catalog-icon-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--course-catalog-accent)',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={30} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>{c.title}</h2>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: 'var(--course-emerald)',
                      background: 'var(--price-badge-bg)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      border: '1px solid var(--price-badge-border)',
                    }}
                  >
                    {c.price === 0 ? 'FREE' : `₹${c.price / 100}`}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', lineClamp: 2 }}>
                  {c.description || 'Comprehensive video lessons, question banks & timed tests.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--course-catalog-accent)', fontWeight: 600 }}>
                  <span>{c.topics?.length || 0} Topics</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span>Video & Practice</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentPageShell>
  );
};
