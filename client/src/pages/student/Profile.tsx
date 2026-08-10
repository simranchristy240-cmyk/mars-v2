import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AppTheme } from '@mars/shared';
import api from '../../services/api';
import { User, Palette, Moon, Sun, Sunset, Shield, LogOut, Check, Sparkles, CloudFog } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [savedMsg, setSavedMsg] = useState('');

  const themes: { id: AppTheme; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'deep-ocean', label: 'Deep Ocean (Default)', desc: 'Dark theme based on brand #090941', icon: <Moon size={20} /> },
    { id: 'soft-cloud', label: 'Soft Cloud', desc: 'Light theme with warm off-whites & gentle blues', icon: <Sun size={20} /> },
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

  return (
    <StudentPageShell>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>Account & Settings</h1>

      {/* Profile Info Card */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="var(--accent)" /> Personal Information
        </h2>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email / Phone
            </label>
            <input
              type="text"
              value={user?.email || user?.phone || 'Authenticated Account'}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginTop: '8px',
            }}
          >
            Save Changes
          </button>
          {savedMsg && <div style={{ fontSize: '0.85rem', color: 'var(--success)', textAlign: 'center' }}>{savedMsg}</div>}
        </form>
      </div>

      {/* Soothing Themes Selector */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={20} color="var(--accent)" /> Soothing App Themes
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Select a visual palette to suit your meditative learning environment.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {themes.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                background: theme === t.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                border: `1.5px solid ${theme === t.id ? 'var(--accent)' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
                </div>
              </div>

              {theme === t.id && <Check size={18} color="var(--accent)" />}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Panel Quick Link */}
      {user?.role === 'admin' && (
        <div className="glass-card" style={{ padding: '18px 24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={22} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Admin Dashboard</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Manage courses, lessons & students</div>
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>Open</span>
          </Link>
        </div>
      )}

      {/* Logout Action Card */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--error-light)',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          fontWeight: 700,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <LogOut size={18} /> Log Out
      </button>
    </StudentPageShell>
  );
};
