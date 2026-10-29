import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';
import { AmbientBackground } from './AmbientBackground';
import { useContentProtection } from '../../hooks/useContentProtection';
import { useAuth } from '../../contexts/AuthContext';
import { GoalSelectionModal } from '../GoalSelectionModal';
import { AlertTriangle } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname, search } = location;
  const isEmbedded = new URLSearchParams(search).get('embed') === 'true';

  const { isDevToolsOpen } = useContentProtection(!isEmbedded && user?.role !== 'admin');

  const showOnboarding = !!user && user.role === 'student' && !user.selectedCourseId;

  const hideBottomNav =
    isEmbedded ||
    pathname.startsWith('/lesson/') ||
    pathname.includes('/attempt');

  if (isEmbedded) {
    return (
      <div className="protected-content app-layout-body" style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
        <main className="app-main-content is-immersive" style={{ height: '100%', padding: 0 }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <AmbientBackground />

      {isDevToolsOpen && (
        <div className="shell-alert">
          <AlertTriangle size={16} />
          <span>Security Alert: Developer inspection tools detected. Content protection is active.</span>
        </div>
      )}

      {/* Top navbar — always visible */}
      <div className="top-navbar">
        <Navbar />
      </div>

      {/* Outer body wrapper */}
      <div className="protected-content app-layout-body">
        {/* Main scrollable content */}
        <main className={`app-main-content${hideBottomNav ? ' is-immersive' : ''}`}>
          {children}
        </main>

        {/* Bottom floating nav — across all screens */}
        {!hideBottomNav && <BottomNav />}
      </div>

      {showOnboarding && <GoalSelectionModal isOpen={true} mandatory={true} />}
    </>
  );
};

