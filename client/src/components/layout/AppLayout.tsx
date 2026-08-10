import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AmbientBackground } from './AmbientBackground';
import { useContentProtection } from '../../hooks/useContentProtection';
import { AlertTriangle } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDevToolsOpen } = useContentProtection(true);
  const { pathname } = useLocation();

  const hideBottomNav =
    pathname.startsWith('/lesson/') ||
    pathname.includes('/attempt');

  return (
    <>
      <AmbientBackground />
      <div
        className="protected-content"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}
      >
        {isDevToolsOpen && (
          <div
            style={{
              background: 'var(--warning)',
              color: '#000',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={18} />
            <span>Security Alert: Developer inspection tools detected. Content protection is active.</span>
          </div>
        )}

        <main style={{ flex: 1, paddingBottom: hideBottomNav ? '24px' : '100px' }}>{children}</main>

        {!hideBottomNav && <BottomNav />}
      </div>
    </>
  );
};
