import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AppTheme } from '@mars/shared';
import { Sun, Moon, Sunset, Sparkles, CloudFog } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
    { id: 'deep-ocean', label: 'Deep Ocean', icon: <Moon size={16} /> },
    { id: 'soft-cloud', label: 'Soft Cloud', icon: <Sun size={16} /> },
    { id: 'sunset-calm', label: 'Sunset Calm', icon: <Sunset size={16} /> },
    { id: 'lunar-drift', label: 'Lunar Drift', icon: <Sparkles size={16} /> },
    { id: 'silk-paper', label: 'Silk Paper', icon: <CloudFog size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: theme === t.id ? 'var(--on-accent)' : 'var(--text-secondary)',
            background: theme === t.id ? 'var(--accent)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          {t.icon}
          <span className="theme-name">{t.label}</span>
        </button>
      ))}
    </div>
  );
};
