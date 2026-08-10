import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, BookOpen, BarChart3, Trophy, User } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses'),
    enabled: !!user,
  });

  // Keep Explore visible until courses load; hide only once we know none remain.
  const hideExplore =
    coursesRes !== undefined &&
    !(coursesRes?.data?.data || []).some((c: any) => !c.isEnrolled);

  const navItems = [
    { to: '/', label: 'Home', icon: <Compass size={22} /> },
    ...(!hideExplore
      ? [{ to: '/courses', label: 'Explore', icon: <BookOpen size={22} /> }]
      : []),
    { to: '/reports', label: 'Stats', icon: <BarChart3 size={22} /> },
    { to: '/achievements', label: 'Rank', icon: <Trophy size={22} /> },
    { to: '/settings', label: 'Profile', icon: <User size={22} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        zIndex: 900,
        pointerEvents: 'none',
      }}
    >
      <nav
        style={{
          pointerEvents: 'auto',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--nav-border)',
          borderRadius: '26px',
          boxShadow: 'var(--nav-shadow)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 8px',
          position: 'relative',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '8px 12px',
              borderRadius: '18px',
              textDecoration: 'none',
              fontSize: '0.68rem',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              border: isActive ? '1px solid var(--nav-active-border)' : '1px solid transparent',
              boxShadow: isActive ? 'var(--nav-active-shadow)' : 'none',
              transition: 'all 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                {item.icon}
                <span style={{ letterSpacing: '0.01em', fontWeight: isActive ? 800 : 500 }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
