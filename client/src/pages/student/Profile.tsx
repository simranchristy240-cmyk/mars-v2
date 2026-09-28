import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AppTheme } from '@mars/shared';
import api from '../../services/api';
import { User, Palette, Moon, Sun, Sunset, Shield, LogOut, Check, Sparkles, CloudFog, Mail, ArrowUpRight } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { PageHeader } from '../../components/ui';
import '../../styles/pages/profile.css';

const THEME_PREVIEW: Record<AppTheme, { bg: string; tile: string; accent: string; text: string; gold: string }> = {
  'deep-ocean': { bg: '#040e1e', tile: '#0a2240', accent: '#06b6d4', text: '#f1f5f9', gold: '#fbbf24' },
  'soft-cloud': { bg: '#f4f2ec', tile: '#ffffff', accent: '#090941', text: '#0b0b3b', gold: '#e2ae2a' },
  'sunset-calm': { bg: '#1c1917', tile: '#342e2b', accent: '#f97316', text: '#fef3c7', gold: '#f59e0b' },
  'lunar-drift': { bg: '#0b0d10', tile: '#161a20', accent: '#7eb8a8', text: '#e8ecef', gold: '#d4b96a' },
  'silk-paper': { bg: '#f5f6f4', tile: '#ffffff', accent: '#5f8f7a', text: '#090941', gold: '#b8860b' },
};

const previewVars = (id: AppTheme): React.CSSProperties => {
  const p = THEME_PREVIEW[id];
  return {
    ['--pv-bg' as string]: p.bg,
    ['--pv-tile' as string]: p.tile,
    ['--pv-accent' as string]: p.accent,
    ['--pv-text' as string]: p.text,
    ['--pv-gold' as string]: p.gold,
  };
};

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [savedMsg, setSavedMsg] = useState('');

  const themes: { id: AppTheme; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'deep-ocean', label: 'Deep Ocean', desc: 'Dark theme based on brand #090941', icon: <Moon size={20} /> },
    { id: 'soft-cloud', label: 'Soft Cloud (Default)', desc: 'Warm paper, navy ink and a touch of gold', icon: <Sun size={20} /> },
    { id: 'sunset-calm', label: 'Sunset Calm', desc: 'Warm theme with muted terracotta earth tones', icon: <Sunset size={20} /> },
    { id: 'lunar-drift', label: 'Lunar Drift', desc: 'Charcoal night with soft moons that slowly drift', icon: <Sparkles size={20} /> },
    { id: 'silk-paper', label: 'Silk Paper', desc: 'Cool porcelain studio with gentle ink-wash motion', icon: <CloudFog size={20} /> },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', { name });
      if (res.data.success) {
        updateUser({ name });
        setSavedMsg('Profile updated!');
        setTimeout(() => setSavedMsg(''), 3000);
      }
    } catch {
      alert('Failed to update profile');
    }
  };

  const contact = user?.email || user?.phone || 'Authenticated Account';
  const displayName = user?.name || 'Student';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const activeTheme = themes.find((t) => t.id === theme);
  const isAdmin = user?.role === 'admin';

  return (
    <StudentPageShell>
      <PageHeader eyebrow="Profile" title="Account & settings" />

      <div className="ui-bento">
        {/* Identity */}
        <section className="ui-tile span-12 prof-head ui-rise" style={{ ['--i' as string]: 0 }}>
          {user?.avatar ? (
            <img className="ui-avatar prof-avatar" src={user.avatar} alt="" />
          ) : (
            <span className="ui-avatar prof-avatar">{initials}</span>
          )}
          <div className="ui-grow">
            <h2 className="ui-title-lg ui-truncate">{displayName}</h2>
            <p className="ui-muted prof-contact">
              <Mail size={14} />
              <span className="ui-truncate">{contact}</span>
            </p>
            <div className="ui-row prof-chips">
              <span className={`ui-chip ${isAdmin ? 'is-accent' : ''}`}>{isAdmin ? 'Admin' : 'Student'}</span>
              {activeTheme && (
                <span className="ui-chip is-outline">
                  <Palette size={11} /> {activeTheme.label}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Personal information */}
        <section className="ui-tile span-5 ui-rise" style={{ ['--i' as string]: 1 }}>
          <div className="ui-tile-head">
            <div>
              <h2 className="ui-section-title">Personal information</h2>
              <p className="ui-faint prof-sub">How your name appears across MARS.</p>
            </div>
            <span className="ui-icon-box" style={{ ['--size' as string]: '38px' }}>
              <User size={18} />
            </span>
          </div>

          <form onSubmit={handleSave} className="ui-stack prof-form">
            <label className="ui-field">
              <span className="ui-field-label">Full name</span>
              <input className="ui-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="ui-field">
              <span className="ui-field-label">Email / phone</span>
              <input className="ui-input prof-readonly" type="text" value={contact} disabled />
            </label>

            <button type="submit" className="ui-btn is-primary is-block is-lg prof-save">
              Save changes
            </button>
            {savedMsg && (
              <div className="ui-callout is-success prof-saved" role="status">
                <Check size={16} /> {savedMsg}
              </div>
            )}
          </form>
        </section>

        {/* Appearance */}
        <section className="ui-tile span-7 ui-rise" style={{ ['--i' as string]: 2 }}>
          <div className="ui-tile-head">
            <div>
              <h2 className="ui-section-title">Appearance</h2>
              <p className="ui-faint prof-sub">Pick the palette that helps you focus best.</p>
            </div>
            <span className="ui-icon-box is-gold" style={{ ['--size' as string]: '38px' }}>
              <Palette size={18} />
            </span>
          </div>

          <div className="ui-grid" style={{ ['--min' as string]: '200px', ['--gap' as string]: '12px' }}>
            {themes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`ui-tile is-compact prof-theme${isActive ? ' is-selected' : ''}`}
                  aria-pressed={isActive}
                >
                  <div className="prof-preview" style={previewVars(t.id)} aria-hidden="true">
                    <div className="prof-preview-hero">
                      <span className="prof-preview-sun" />
                      <span className="prof-preview-line is-wide" />
                    </div>
                    <div className="prof-preview-tiles">
                      <div className="prof-preview-tile">
                        <span className="prof-preview-line" />
                        <span className="prof-preview-bar" />
                      </div>
                      <div className="prof-preview-tile">
                        <span className="prof-preview-dot" />
                        <span className="prof-preview-line is-short" />
                      </div>
                    </div>
                  </div>

                  <div className="ui-row is-nowrap prof-theme-meta">
                    <span className="prof-theme-icon">{t.icon}</span>
                    <div className="ui-grow">
                      <div className="ui-list-title ui-truncate">{t.label}</div>
                      <div className="ui-list-meta ui-clamp-2">{t.desc}</div>
                    </div>
                    <span className="prof-theme-check">{isActive && <Check size={14} strokeWidth={3} />}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Admin quick link */}
        {isAdmin && (
          <Link to="/admin" className="ui-tile span-6 md-span-3 prof-link ui-rise" style={{ ['--i' as string]: 3 }}>
            <span className="ui-icon-box is-accent">
              <Shield size={20} />
            </span>
            <div className="ui-grow">
              <div className="ui-title">Admin dashboard</div>
              <div className="ui-faint">Manage courses, lessons & students</div>
            </div>
            <ArrowUpRight size={18} className="prof-link-go" />
          </Link>
        )}

        {/* Sign out */}
        <section
          className={`ui-tile is-muted ${isAdmin ? 'span-6 md-span-3' : 'span-12'} prof-danger ui-rise`}
          style={{ ['--i' as string]: 4 }}
        >
          <div className="ui-grow">
            <div className="ui-title">Sign out</div>
            <div className="ui-faint">You’ll need to sign in again to continue learning on this device.</div>
          </div>
          <button
            type="button"
            className="ui-btn is-danger"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} /> Log out
          </button>
        </section>
      </div>
    </StudentPageShell>
  );
};
