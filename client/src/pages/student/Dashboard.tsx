import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Flame, Play, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: gamificationRes } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats'),
    enabled: !!user,
  });

  const { data: continueRes } = useQuery({
    queryKey: ['continue-learning'],
    queryFn: () => api.get('/progress/continue'),
    enabled: !!user,
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses'),
    enabled: !!user,
  });

  const stats = gamificationRes?.data?.data;
  const recentProgress = continueRes?.data?.data || [];
  const courses = (coursesRes?.data?.data || []).filter((c: any) => !c.isEnrolled);

  return (
    <StudentPageShell style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. TOP CENTER LOGO */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="MARS Logo"
          style={{
            height: '40px',
            borderRadius: '10px',
            background: '#ffffff',
            padding: '3px 12px',
            objectFit: 'contain',
            boxShadow: 'var(--logo-glow)',
          }}
        />
      </div>

      {/* 2. GAMIFICATION HUD (WITH INTEGRATED HELLO GREETING) */}
      <Link
        to="/achievements"
        className="glass-card"
        style={{
          width: '100%',
          padding: '18px 16px',
          borderRadius: '24px',
          background: 'var(--gamification-bg)',
          border: '1px solid var(--gamification-border)',
          boxShadow: 'var(--gamification-shadow)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Integrated Center-Aligned Greeting Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Hello, {user?.name.split(' ')[0] || 'Learner'}
          </h1>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: 'var(--divider)' }} />

        {/* Middle Row: Streak & XP Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {/* Streak Metric */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--streak-icon-bg)',
                border: '1px solid var(--streak-icon-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Flame size={18} color="var(--gamification-ember)" fill="var(--gamification-ember)" />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats?.currentStreak || 1} {stats?.currentStreak === 1 ? 'Day' : 'Days'}
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--streak-label)', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                STREAK
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: '1px', height: '24px', background: 'var(--divider)', flexShrink: 0 }} />

          {/* XP Metric */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--xp-icon-bg)',
                border: '1px solid var(--xp-icon-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="var(--gamification-gold)" fill="var(--gamification-gold)" />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats?.xp || 20} XP
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--xp-label)', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                LEVEL {stats?.level || 1}
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Bar Sub-meter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 600 }}>
            <span>Level Progress</span>
            <span>{(stats?.xp || 20) % 500} / 500 XP</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: '10px',
              background: 'var(--track-bg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (((stats?.xp || 20) % 500) / 500) * 100)}%`,
                height: '100%',
                background: 'var(--gamification-bar)',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>
      </Link>

      {/* 3. COURSES SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {recentProgress.length === 0 && (
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px' }}>Browse Courses</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                You are not enrolled yet — pick a course to begin.
              </p>
            </div>
          )}
          {recentProgress.length > 0 ? (
            // ENROLLED COURSES LIST
            recentProgress.map((item: any) => (
              <div
                key={item._id || item.courseId?._id}
                onClick={() => {
                  const lessonId =
                    item.lastActivity?.lessonId?._id || item.lastActivity?.lessonId;
                  const courseId = item.courseId?._id || item.courseId;
                  if (lessonId) {
                    navigate(`/lesson/${lessonId}`);
                  } else if (courseId) {
                    navigate(`/course/${courseId}`);
                  }
                }}
                className="glass-card"
                style={{
                  position: 'relative',
                  borderRadius: '24px',
                  padding: '22px',
                  background: 'var(--course-enrolled-bg)',
                  border: '1px solid var(--course-enrolled-border)',
                  boxShadow: 'var(--course-enrolled-shadow)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {/* Ambient Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'var(--course-enrolled-glow)',
                    opacity: 0.22,
                    filter: 'blur(35px)',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--course-emerald)',
                    }}
                  >
                    CONTINUE LESSON • {item.overallPercentage || 0}%
                  </div>

                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--course-play-btn)',
                      color: 'var(--on-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--course-play-shadow)',
                    }}
                  >
                    <Play size={15} fill="currentColor" style={{ marginLeft: '2px' }} />
                  </div>
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px', lineHeight: 1.25, color: 'var(--text-primary)' }}>
                  {item.courseId?.title || 'Anatomy Course'}
                </h2>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {item.lastActivity?.lessonId?.title || 'Resume learning'}
                </p>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    borderRadius: '10px',
                    background: 'var(--track-bg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.overallPercentage || 25}%`,
                      height: '100%',
                      background: 'var(--course-progress-bar)',
                      borderRadius: '10px',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            // ALL AVAILABLE COURSES LIST (WHEN STUDENT HAS NOT ENROLLED IN ANY)
            courses.map((c: any) => (
              <div
                key={c._id}
                onClick={() => navigate(`/course/${c._id}`)}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  borderRadius: '20px',
                  background: 'var(--course-catalog-bg)',
                  border: '1px solid var(--course-catalog-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: 'var(--course-catalog-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: 'var(--course-catalog-icon-bg)',
                      color: 'var(--course-catalog-accent)',
                      border: '1px solid var(--course-catalog-icon-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '2px', color: 'var(--text-primary)' }}>{c.title}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {c.topics?.length || 0} Topics • {c.price === 0 ? 'Free' : `₹${c.price / 100}`}
                    </span>
                  </div>
                </div>

                <ChevronRight size={18} color="var(--course-catalog-accent)" />
              </div>
            ))
          )}
        </div>
    </StudentPageShell>
  );
};
