import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { LogOut, Shield, Settings, Trophy, Sparkles, Lock, ChevronDown, PanelLeft } from 'lucide-react';
import { useDrawer } from '../../contexts/DrawerContext';
import { GoalSelectionModal } from '../GoalSelectionModal';
import { TierUpgradeModal } from '../TierUpgradeModal';
import { NAV_ITEMS } from './navItems';

const getTrackEmoji = (title?: string) => {
  if (!title) return '🎓';
  const lower = title.toLowerCase();
  if (lower.includes('mbbs')) return '🩺';
  if (lower.includes('bds')) return '🦷';
  if (lower.includes('ayush')) return '🌿';
  return '🔬';
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDrawerOpen, toggleDrawer, hasDrawerContent } = useDrawer();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: myCourseRes } = useQuery({
    queryKey: ['my-course', user?.selectedCourseId],
    queryFn: () => api.get('/courses/my/active'),
    enabled: !!user && user.role === 'student',
  });

  const activeCourse = myCourseRes?.data?.data?.course;
  const studentTier = myCourseRes?.data?.data?.studentTier || 'free';
  const isStudent = !!user && user.role === 'student';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="shell-topbar">
      <div className="shell-topbar-inner">
        <div className="shell-topbar-left">
          {isStudent && hasDrawerContent && (
            <button
              type="button"
              onClick={toggleDrawer}
              className={`ui-icon-btn${isDrawerOpen ? ' is-active' : ''}`}
              title={isDrawerOpen ? 'Hide curriculum' : 'Show curriculum'}
              aria-label="Toggle curriculum navigation"
            >
              <PanelLeft size={19} />
            </button>
          )}
          <Link to="/" className="shell-logo" aria-label="MARS home">
            <img src="/logo.png" alt="MARS" />
          </Link>
        </div>

        {isStudent && (
          <nav className="shell-pillnav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <div className="shell-topbar-right">
          {isStudent && (
            <>
              <button
                type="button"
                className="shell-track"
                onClick={() => {
                  if (!user.isCourseLocked) setGoalModalOpen(true);
                }}
                title={user.isCourseLocked ? 'Track locked after purchase' : 'Change preparation track'}
                style={{ cursor: user.isCourseLocked ? 'default' : 'pointer' }}
              >
                <span className="shell-track-emoji">{getTrackEmoji(activeCourse?.title)}</span>
                <span className="ui-truncate">
                  {activeCourse?.title?.split(' - ')[0] || (user.selectedCourseId ? 'Loading…' : 'Select track')}
                </span>
                {user.isCourseLocked ? <Lock size={12} /> : <ChevronDown size={14} />}
              </button>

              {activeCourse && studentTier !== 'premium' && (
                <button type="button" className="ui-btn is-gold is-sm shell-upgrade" onClick={() => setTierModalOpen(true)}>
                  <Sparkles size={14} />
                  <span>{studentTier === 'free' ? 'Upgrade' : `${studentTier[0].toUpperCase()}${studentTier.slice(1)}`}</span>
                </button>
              )}
            </>
          )}

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="shell-avatar-btn"
                title="Account"
                aria-expanded={dropdownOpen}
              >
                <span className="ui-avatar">{user.name.charAt(0).toUpperCase()}</span>
              </button>

              {dropdownOpen && (
                <div className="ui-menu" style={{ top: 'calc(100% + 10px)', right: 0, width: 248 }}>
                  <div className="shell-menu-identity">
                    <span className="ui-avatar" style={{ ['--size' as string]: '40px' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="ui-grow">
                      <div className="ui-truncate" style={{ fontWeight: 600 }}>{user.name}</div>
                      <div className="ui-faint ui-truncate">{user.email || user.phone || 'Student account'}</div>
                    </div>
                  </div>
                  <div className="ui-menu-sep" />

                  {user.role === 'admin' && (
                    <Link to="/admin" className="ui-menu-item" onClick={() => setDropdownOpen(false)}>
                      <Shield size={16} /> Admin panel
                    </Link>
                  )}
                  <Link to="/achievements" className="ui-menu-item" onClick={() => setDropdownOpen(false)}>
                    <Trophy size={16} /> Rank &amp; badges
                  </Link>
                  <Link to="/settings" className="ui-menu-item" onClick={() => setDropdownOpen(false)}>
                    <Settings size={16} /> Settings
                  </Link>

                  <div className="ui-menu-sep" />
                  <button type="button" className="ui-menu-item is-danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="ui-btn is-primary is-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {goalModalOpen && <GoalSelectionModal isOpen={true} onClose={() => setGoalModalOpen(false)} mandatory={false} />}

      {tierModalOpen && activeCourse && (
        <TierUpgradeModal
          isOpen={true}
          onClose={() => setTierModalOpen(false)}
          course={activeCourse}
          currentTier={studentTier}
        />
      )}
    </header>
  );
};
