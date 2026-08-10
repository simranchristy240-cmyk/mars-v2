import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, loginWithPhoneOTP } from '../services/firebase';
import { Sparkles, ShieldCheck, UserPlus, UserCheck, Shield, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'password' | 'phone' | 'email'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    loginWithToken,
    loginWithPassword,
    loginAsDemoNewStudent,
    loginAsDemoStudent,
    loginAsDemoAdmin,
  } = useAuth();
  const navigate = useNavigate();

  const afterLogin = (role?: string) => {
    navigate(role === 'admin' ? '/admin' : '/');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      return setError('Enter username and password');
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginWithPassword(username.trim(), password);
      afterLogin(user.role);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'phone' && !phone) return setError('Enter valid phone number');
    if (authMethod === 'email' && !email) return setError('Enter valid email address');

    setError('');
    setStep('otp');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, idToken } = await loginWithPhoneOTP(phone || email, otp);
      const loggedIn = await loginWithToken(idToken, {
        name:
          (user as any).displayName ||
          (authMethod === 'phone' ? `Student ${phone.slice(-4)}` : email.split('@')[0]),
        email: email || undefined,
        phone: phone || undefined,
      });
      afterLogin(loggedIn.role);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { user, idToken } = await loginWithGoogle();
      const loggedIn = await loginWithToken(idToken, {
        name: user.displayName || 'Google Student',
        email: user.email || undefined,
      });
      afterLogin(loggedIn.role);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async (fn: () => Promise<any>, roleHint?: string) => {
    setLoading(true);
    setError('');
    try {
      const user = await fn();
      afterLogin(user.role || roleHint);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <img
          src="/logo.png"
          alt="MARS Logo"
          style={{
            height: '48px',
            borderRadius: '10px',
            background: '#ffffff',
            padding: '4px 14px',
            objectFit: 'contain',
            margin: '0 auto 16px',
            display: 'block',
            boxShadow: 'var(--logo-glow)',
          }}
        />

        <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Welcome to MARS</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Meditative Anatomy Learning Platform
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--error-light)',
              color: 'var(--error)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        {/* Auth method tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          {(
            [
              ['password', 'Password'],
              ['phone', 'Phone OTP'],
              ['email', 'Email OTP'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setAuthMethod(id);
                setStep('input');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: authMethod === id ? 'var(--on-accent)' : 'var(--text-secondary)',
                background: authMethod === id ? 'var(--accent)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="student"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <KeyRound size={18} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Demo: <strong>newstudent</strong> / <strong>student</strong> / <strong>admin</strong> — password{' '}
              <strong>mars123</strong>
            </p>
          </form>
        )}

        {authMethod !== 'password' && step === 'input' && (
          <form onSubmit={handleSendOTP} style={{ textAlign: 'left', marginBottom: '16px' }}>
            {authMethod === 'phone' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Phone Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@mars.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '16px',
              }}
            >
              Get OTP
            </button>
          </form>
        )}

        {authMethod !== 'password' && step === 'otp' && (
          <form onSubmit={handleVerifyOTP} style={{ textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter 6-digit code sent to <strong>{phone || email}</strong> (Use <strong>123456</strong> for test mode)
            </p>

            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                ...inputStyle,
                fontSize: '1.4rem',
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: '20px',
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('input')}
              style={{
                width: '100%',
                padding: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              Change phone/email
            </button>
          </form>
        )}

        {/* 1-CLICK DEMO LOGIN BUTTONS */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '10px' }}>
            1-Click Demo Logins
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => runDemo(loginAsDemoNewStudent)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <UserPlus size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <span style={{ display: 'block' }}>New Student</span>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                  newstudent / mars123 — no courses yet
                </span>
              </span>
            </button>

            <button
              onClick={() => runDemo(loginAsDemoStudent)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--success-light)',
                color: 'var(--success)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <UserCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <span style={{ display: 'block' }}>Enrolled Student</span>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                  student / mars123 — 1 course enrolled
                </span>
              </span>
            </button>

            <button
              onClick={() => runDemo(loginAsDemoAdmin, 'admin')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--warning-light)',
                color: 'var(--warning)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <span style={{ display: 'block' }}>Admin</span>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                  admin / mars123 — manage courses
                </span>
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <Sparkles size={18} color="var(--gold)" /> Continue with Google
        </button>

        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} /> Protected by MARS Security & Content Encryption
        </div>
      </div>
    </div>
  );
};
