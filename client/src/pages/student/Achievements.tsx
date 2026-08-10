import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trophy, Flame, Zap, Award, Crown } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const Achievements: React.FC = () => {
  const { data: statsRes } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats'),
  });

  const { data: leaderboardRes } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard'),
  });

  const stats = statsRes?.data?.data;
  const leaderboard = leaderboardRes?.data?.data || [];

  return (
    <StudentPageShell>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '6px' }}>Gamification & Leaderboard</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Earn XP, maintain daily learning streaks, unlock badges, and top the anatomy leaderboard!
      </p>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '24px' }}>
        <div
          className="glass-card"
          style={{
            padding: '16px',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--streak-icon-bg) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--streak-icon-border)',
            boxShadow: 'var(--level-shadow)',
          }}
        >
          <Flame size={28} color="var(--gamification-ember)" fill="var(--gamification-ember)" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--streak-label)', fontWeight: 700 }}>Streak</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.currentStreak || 1} Days</div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--xp-icon-bg) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--xp-icon-border)',
            boxShadow: 'var(--level-shadow)',
          }}
        >
          <Zap size={28} color="var(--gamification-gold)" fill="var(--gamification-gold)" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--xp-label)', fontWeight: 700 }}>Total XP</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.xp || 20}</div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--level-bg)',
            border: '1px solid var(--level-border)',
            boxShadow: 'var(--level-shadow)',
          }}
        >
          <Award size={28} color="var(--level-icon)" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--level-label)', fontWeight: 700 }}>Level</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lvl {stats?.level || 1}</div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--accent)" /> Badges & Achievements
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
          {(stats?.badges || []).map((b: any, idx: number) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-primary)',
                padding: '16px 12px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{b.icon || '🏆'}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{b.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Leaderboard */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown size={20} color="var(--gold)" /> Anatomy Student Leaderboard
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((item: any) => (
            <div
              key={item.rank}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: item.rank === 1 ? 'var(--leaderboard-gold-bg)' : 'var(--bg-primary)',
                border: `1px solid ${item.rank === 1 ? 'var(--gold)' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-full)',
                    background: item.rank === 1 ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: item.rank === 1 ? 'var(--on-accent)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                  }}
                >
                  #{item.rank}
                </span>

                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {item.studentId?.name || 'Student'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--streak-fire)', fontWeight: 700 }}>
                  🔥 {item.streak}d
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold)' }}>
                  {item.xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentPageShell>
  );
};
