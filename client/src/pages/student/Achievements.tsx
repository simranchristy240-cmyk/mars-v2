import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trophy, Flame, Zap, Award, Crown, Check } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { EmptyState, PageHeader, ProgressBar, ProgressRing } from '../../components/ui';
import '../../styles/pages/achievements.css';

const XP_PER_LEVEL = 500;
const WEEK_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PODIUM_CLASS: Record<number, string> = { 1: 'is-gold', 2: 'is-silver', 3: 'is-bronze' };

const initials = (name?: string) =>
  (name || 'Student')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

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

  const streak = stats?.currentStreak ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const levelXp = xp % XP_PER_LEVEL;
  const levelPct = Math.round((levelXp / XP_PER_LEVEL) * 100);
  const badges: any[] = stats?.badges || [];

  const myId = stats?.studentId ? String(stats.studentId?._id || stats.studentId) : null;
  const isMe = (item: any) => !!myId && String(item.studentId?._id || item.studentId) === myId;
  const myEntry = leaderboard.find(isMe);

  const today = new Date().getDay();
  const week = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    return { letter: WEEK_LETTERS[dayIndex], active: 6 - i < streak, isToday: i === 6 };
  });

  return (
    <StudentPageShell>
      <PageHeader
        eyebrow="Rank"
        title="Level up, one day at a time"
        subtitle="Earn XP, keep your daily streak alive, unlock badges and climb the leaderboard."
      />

      <div className="ui-bento">
        {/* Level hero */}
        <section className="ui-tile is-inverse span-8 ach-hero ui-rise" style={{ ['--i' as string]: 0 }}>
          <div className="ui-sunburst" aria-hidden="true" />
          <div className="ach-hero-body">
            <ProgressRing value={levelPct} size={136} stroke={10} color="var(--ui-gold)">
              <div className="ach-hero-ring">
                <span>Level</span>
                {level}
              </div>
            </ProgressRing>

            <div className="ui-grow ach-hero-copy">
              <span className="ui-label">Experience</span>
              <div className="ui-metric ach-hero-xp">
                {xp.toLocaleString()}
                <small>XP</small>
              </div>
              <div className="ach-hero-progress">
                <ProgressBar value={levelPct} height={6} />
                <span>
                  {XP_PER_LEVEL - levelXp} XP to level {level + 1}
                </span>
              </div>
              <div className="ui-row ach-hero-chips">
                {myEntry && (
                  <span className="ui-chip ach-rank-chip">
                    <Crown size={12} /> #{myEntry.rank} on the leaderboard
                  </span>
                )}
                <span className="ui-chip is-on-inverse">
                  <Award size={12} /> {badges.length} {badges.length === 1 ? 'badge' : 'badges'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Streak */}
        <section className="ui-tile is-gold span-4 ach-streak ui-rise" style={{ ['--i' as string]: 1 }}>
          <div className="ui-row is-between">
            <span className="ui-label">Daily streak</span>
            <span className="ach-flame">
              <Flame size={18} fill="currentColor" />
            </span>
          </div>
          <div className="ui-metric">
            {streak}
            <small>{streak === 1 ? 'day' : 'days'}</small>
          </div>
          <div className="ach-week">
            {week.map((d, i) => (
              <div key={i} className={`ach-week-day${d.active ? ' is-active' : ''}${d.isToday ? ' is-today' : ''}`}>
                <span className="ach-week-dot">{d.active && <Check size={11} strokeWidth={3} />}</span>
                <span>{d.letter}</span>
              </div>
            ))}
          </div>
          {stats?.longestStreak ? <div className="ui-faint">Best run · {stats.longestStreak} days</div> : null}
        </section>

        {/* Badges */}
        <section className="ui-tile span-7 ui-rise" style={{ ['--i' as string]: 2 }}>
          <div className="ui-tile-head">
            <div>
              <h2 className="ui-section-title">Badges</h2>
              <p className="ui-faint ach-sub">Milestones you’ve unlocked along the way.</p>
            </div>
            <span className="ui-chip is-gold">{badges.length} earned</span>
          </div>

          {badges.length === 0 ? (
            <EmptyState
              icon={<Award size={24} />}
              title="Your first badge is close"
              text="Finish lessons, practise daily and take tests to start collecting badges."
            />
          ) : (
            <div className="ui-grid" style={{ ['--min' as string]: '150px', ['--gap' as string]: '12px' }}>
              {badges.map((b: any, idx: number) => (
                <div key={idx} className="ui-tile is-muted is-compact ach-badge ui-rise" style={{ ['--i' as string]: idx }}>
                  <div className="ach-badge-icon">{b.icon || '🏆'}</div>
                  <div className="ui-list-title">{b.name}</div>
                  {b.description && <div className="ui-faint ui-clamp-2">{b.description}</div>}
                  {b.earnedAt && (
                    <div className="ach-badge-date">
                      {new Date(b.earnedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="ui-tile span-5 ui-rise" style={{ ['--i' as string]: 3 }}>
          <div className="ui-tile-head">
            <div>
              <h2 className="ui-section-title">Leaderboard</h2>
              <p className="ui-faint ach-sub">Top students by total XP.</p>
            </div>
            <span className="ui-icon-box is-gold" style={{ ['--size' as string]: '38px' }}>
              <Trophy size={18} />
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <EmptyState icon={<Crown size={24} />} title="No rankings yet" text="Be the first to earn XP and take the top spot." />
          ) : (
            <div className="ui-list ach-board">
              {leaderboard.map((item: any) => {
                const podium = PODIUM_CLASS[item.rank] || '';
                const me = isMe(item);
                return (
                  <div key={item.rank} className={`ui-list-item ach-row ${podium}${me ? ' is-me' : ''}`}>
                    <span className={`ach-rank ${podium}`}>{item.rank === 1 ? <Crown size={14} /> : item.rank}</span>
                    {item.studentId?.avatar ? (
                      <img className="ui-avatar ach-avatar" src={item.studentId.avatar} alt="" />
                    ) : (
                      <span className="ui-avatar ach-avatar">{initials(item.studentId?.name)}</span>
                    )}
                    <div className="ui-grow">
                      <div className="ui-list-title ui-truncate">
                        {item.studentId?.name || 'Student'}
                        {me && <span className="ui-chip is-accent ach-you">You</span>}
                      </div>
                      <div className="ach-row-meta">
                        <span>
                          <Flame size={12} /> {item.streak}d
                        </span>
                        {item.level ? <span>Lv {item.level}</span> : null}
                      </div>
                    </div>
                    <span className="ach-xp">
                      <Zap size={13} fill="currentColor" />
                      {item.xp} <small>XP</small>
                    </span>
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
