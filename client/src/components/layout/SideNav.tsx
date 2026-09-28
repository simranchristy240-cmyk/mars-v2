import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, BarChart3, Trophy, Settings, LogOut, Shield, ChevronDown, Sparkles, Lock, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { GoalSelectionModal } from '../GoalSelectionModal';
import { TierUpgradeModal } from '../TierUpgradeModal';

interface SideNavProps {
  className?: string;
}

export const SideNav: React.FC<SideNavProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: myCourseRes } = useQuery({
    queryKey: ['my-course', user?.selectedCourseId],
    queryFn: () => api.get('/courses/my/active'),
    enabled: !!user && user.role === 'student',
  });

  const activeCourse = myCourseRes?.data?.data?.course;
  const studentTier = myCourseRes?.data?.data?.studentTier || 'free';

  const navItems = [
    { to: '/', label: 'Home', icon: <Compass size={20} />, end: true },
    { to: '/reports', label: 'Stats', icon: <BarChart3 size={20} />, end: false },
    { to: '/achievements', label: 'Rank & Badges', icon: <Trophy size={20} />, end: false },
    { to: '/settings', label: 'Settings', icon: <Settings size={20} />, end: false },
  ];

  const getTrackEmoji = (title?: string) => {
    if (!title) return '🎓';
    const lower = title.toLowerCase();
    if (lower.includes('mbbs')) return '🩺';
    if (lower.includes('bds')) return '🦷';
    if (lower.includes('ayush')) return '🌿';
    return '🔬';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`side-nav-desktop ${className}`.trim()}
      style={{
        width: '240px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexDirection: 'column',
        padding: '24px 16px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 100,
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <NavLink
        to="/"
        style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', paddingLeft: '8px', textDecoration: 'none' }}
      >
        <img
          src="/logo.png"
          alt="MARS Logo"
          style={{
            height: '36px',
            borderRadius: '8px',
            background: '#ffffff',
            padding: '2px 10px',
            objectFit: 'contain',
            boxShadow: 'var(--logo-glow)',
          }}
        />
      </NavLink>

      {/* Target Track Card */}
      {user && user.role === 'student' && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '16px',
            background: 'var(--bg-card, #161c28)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Target Track
            </span>
            {user.isCourseLocked ? (
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Lock size={11} /> Locked
              </span>
            ) : (
              <button
                onClick={() => setGoalModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <RefreshCw size={11} /> Switch
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>{getTrackEmoji(activeCourse?.title)}</span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {activeCourse?.title?.split(' - ')[0] || (user.selectedCourseId ? 'Loading...' : 'Select Track')}
              </div>
              <div style={{ fontSize: '0.72rem', color: studentTier === 'free' ? 'var(--text-secondary)' : '#10b981', fontWeight: 600 }}>
                {studentTier === 'free' ? 'Free Preview' : `${studentTier.toUpperCase()} Plan`}
              </div>
            </div>
          </div>

          {activeCourse && studentTier !== 'premium' && (
            <button
              onClick={() => setTierModalOpen(true)}
              style={{
                marginTop: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(var(--accent-rgb, 59, 130, 246), 0.15)',
                color: 'var(--accent)',
                border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <Sparkles size={12} /> {studentTier === 'free' ? 'Upgrade Plan' : 'Upgrade Tier'}
            </button>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              border: isActive ? '1px solid var(--nav-active-border)' : '1px solid transparent',
              boxShadow: isActive ? 'var(--nav-active-shadow)' : 'none',
              transition: 'all 0.18s ease',
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User identity block */}
      {user && (
        <div ref={menuRef} style={{ position: 'relative', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '14px',
              background: userMenuOpen ? 'var(--accent-light)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.18s ease',
            }}
            title="Account menu"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                flexShrink: 0,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email || user.phone || 'Student'}
              </div>
            </div>
            <ChevronDown
              size={16}
              color="var(--text-secondary)"
              style={{ flexShrink: 0, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            />
          </button>

          {/* User pop-up menu (expands upward) */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 200,
              }}
            >
              {user.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Shield size={16} color="var(--accent)" />
                  <span>Admin Panel</span>
                </NavLink>
              )}

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  color: 'var(--error, #ef4444)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--error-light, rgba(239,68,68,0.1))')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {goalModalOpen && (
        <GoalSelectionModal
          isOpen={true}
          onClose={() => setGoalModalOpen(false)}
          mandatory={false}
        />
      )}

      {tierModalOpen && activeCourse && (
        <TierUpgradeModal
          isOpen={true}
          onClose={() => setTierModalOpen(false)}
          course={activeCourse}
          currentTier={studentTier}
        />
      )}
    </aside>
  );
};
