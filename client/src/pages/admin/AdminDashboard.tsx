import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, DollarSign, BookOpen, PlusCircle, CreditCard, Pencil } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard'),
  });

  const { data: coursesRes, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/courses/admin'),
  });

  const stats = data?.data?.data;
  const courses = coursesRes?.data?.data || [];

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading admin dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage courses, lessons, question banks, test series & revenue.
          </p>
        </div>

        <Link
          to="/admin/builder"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <PlusCircle size={18} /> Create New Course
        </Link>
      </div>

      {/* Stats Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginBottom: '8px' }}>
            <DollarSign size={22} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>₹{stats?.totalRevenue || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', marginBottom: '8px' }}>
            <Users size={22} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enrolled Students</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>{stats?.totalStudents || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold)', marginBottom: '8px' }}>
            <BookOpen size={22} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Courses</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>{stats?.totalCourses || courses.length || 0}</div>
        </div>
      </div>

      {/* Courses table */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="var(--accent)" /> Courses
        </h2>

        {coursesLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No courses yet. Create your first course to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Topics</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c: any) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 700 }}>{c.title}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>{c.topics?.length || 0}</td>
                    <td style={{ padding: '14px 12px' }}>{c.price === 0 ? 'Free' : `₹${c.price / 100}`}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: c.isPublished ? 'var(--success-light)' : 'var(--warning-light)',
                          color: c.isPublished ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/admin/builder/${c._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Revenue */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} color="var(--accent)" /> Recent Course Purchases
        </h2>

        {(stats?.recentPayments || []).length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No transaction records yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recentPayments.map((p: any) => (
              <div
                key={p._id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.studentId?.name || 'Student'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.courseId?.title || 'Course'}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--success)' }}>₹{p.amount / 100}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
