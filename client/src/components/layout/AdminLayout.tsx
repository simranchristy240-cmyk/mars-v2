import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AmbientBackground } from './AmbientBackground';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LayoutDashboard, LogOut, PlusCircle } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: isActive ? 'var(--on-accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent)' : 'transparent',
  });

  return (
    <>
      <AmbientBackground />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          background: 'var(--bg-primary)',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(16px)',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/logo.png"
                alt="MARS"
                style={{
                  height: '32px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  padding: '2px 8px',
                  objectFit: 'contain',
                  boxShadow: 'var(--logo-glow)',
                }}
              />
              <span style={{ marginLeft: '12px', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Admin Console
              </span>
            </Link>

            <nav style={{ display: 'flex', gap: '6px' }}>
              <NavLink to="/admin" end style={linkStyle}>
                <LayoutDashboard size={16} /> Dashboard
              </NavLink>
              <NavLink to="/admin/builder" style={linkStyle}>
                <PlusCircle size={16} /> New Course
              </NavLink>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {user?.name || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--error-light)',
                color: 'var(--error)',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: '1px solid var(--error)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px 48px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </>
  );
};
