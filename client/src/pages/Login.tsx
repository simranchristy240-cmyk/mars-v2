import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, loginWithPhoneOTP } from '../services/firebase';
import {
  Sparkles,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Shield,
  KeyRound,
  Crown,
  Brain,
  Flame,
  BarChart3,
  User,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';
import '../styles/pages/login.css';

const FEATURES = [
  { icon: <Brain size={18} />, title: 'Structured curriculum', desc: 'Topic-by-topic courses built for deep retention' },
  { icon: <Flame size={18} />, title: 'Daily streaks & XP', desc: 'Gamified progress that keeps you coming back', gold: true },
  { icon: <BarChart3 size={18} />, title: 'Test analytics', desc: 'Track performance trends across every test series' },
];

const TRACKS = ['MBBS', 'BDS', 'AYUSH', 'General'];

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
    loginAsDemoPaidStudent,
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

  const demos = [
    {
      key: 'new',
      icon: <UserPlus size={17} />,
      tone: 'is-accent',
      title: 'New student',
      desc: 'newstudent / mars123 — no track yet (triggers goal modal)',
      run: () => runDemo(loginAsDemoNewStudent),
    },
    {
      key: 'free',
      icon: <UserCheck size={17} />,
      tone: 'is-success',
      title: 'Free student',
      desc: 'student / mars123 — MBBS free preview (unlocked, can switch tracks)',
      run: () => runDemo(loginAsDemoStudent),
    },
    {
      key: 'paid',
      icon: <Crown size={17} />,
      tone: 'is-gold',
      title: 'Paid student',
      desc: 'paidstudent / mars123 — MBBS Basic (locked track, can upgrade tier)',
      run: () => runDemo(loginAsDemoPaidStudent),
    },
    {
      key: 'admin',
      icon: <Shield size={17} />,
      tone: '',
      title: 'Admin',
      desc: 'admin / mars123 — manage tracks, tiers, pricing & content',
      run: () => runDemo(loginAsDemoAdmin, 'admin'),
    },
  ];

  return (
    <div className="login">
      {/* ── Brand panel: compact header on phones, full inverse panel on desktop ── */}
      <aside className="ui-tile is-inverse login-brand ui-rise" style={{ ['--i' as string]: 0 }}>
        <div className="ui-sunburst login-sunburst" aria-hidden="true" />
        <div className="ui-sunburst login-sunburst is-small" aria-hidden="true" />

        <div className="login-logo-chip">
          <span className="login-logo">
            <img src="/logo.png" alt="MARS Logo" />
          </span>
        </div>

        <div className="login-brand-copy">
          <span className="ui-label">Meditative Anatomy Learning Platform</span>
          <h1 className="login-headline">
            Master anatomy, <span>one layer at a time.</span>
          </h1>
          <p className="login-lede">
            Structured lessons, progressive tests and a gamified learning journey — all in one calm place.
          </p>
        </div>

        <div className="login-bento">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="login-feature" style={{ ['--i' as string]: i + 2 }}>
              <span className={`ui-icon-box ${f.gold ? 'is-gold' : 'is-on-inverse'}`} style={{ ['--size' as string]: '38px' }}>
                {f.icon}
              </span>
              <div>
                <div className="login-feature-title">{f.title}</div>
                <div className="ui-muted login-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
          <div className="login-feature is-tracks" style={{ ['--i' as string]: 5 }}>
            <span className="ui-label">Pick your track</span>
            <div className="ui-row" style={{ ['--gap' as string]: '6px' }}>
              {TRACKS.map((t) => (
                <span key={t} className="ui-chip is-on-inverse">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form column ────────────────────────────────────────────────────── */}
      <main className="ui-tile login-main ui-rise" style={{ ['--i' as string]: 1 }}>
        <div className="login-form">
          <header className="login-form-head">
            <h2 className="ui-page-title">Welcome to MARS</h2>
            <p className="ui-page-sub">Sign in to pick up right where you left off.</p>
          </header>

          {error && (
            <div className="ui-callout is-danger login-error" role="alert">
              {error}
            </div>
          )}

          <div className="ui-segmented login-tabs" role="tablist">
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
                role="tab"
                aria-selected={authMethod === id}
                className={authMethod === id ? 'is-active' : ''}
                onClick={() => {
                  setAuthMethod(id);
                  setStep('input');
                  setError('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="ui-stack login-fields" style={{ ['--gap' as string]: '14px' }}>
              <label className="ui-field">
                <span className="ui-field-label">Username</span>
                <span className="ui-input-group">
                  <User size={17} />
                  <input
                    className="ui-input"
                    type="text"
                    autoComplete="username"
                    placeholder="student"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </span>
              </label>
              <label className="ui-field">
                <span className="ui-field-label">Password</span>
                <span className="ui-input-group">
                  <Lock size={17} />
                  <input
                    className="ui-input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </span>
              </label>
              <button type="submit" disabled={loading} className="ui-btn is-primary is-lg is-block login-submit">
                <KeyRound size={18} />
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <p className="ui-faint login-hint">
                Demo: <strong>newstudent</strong> / <strong>student</strong> / <strong>admin</strong> — password{' '}
                <strong>mars123</strong>
              </p>
            </form>
          )}

          {authMethod !== 'password' && step === 'input' && (
            <form onSubmit={handleSendOTP} className="ui-stack login-fields" style={{ ['--gap' as string]: '16px' }}>
              {authMethod === 'phone' ? (
                <label className="ui-field">
                  <span className="ui-field-label">Phone number</span>
                  <span className="login-phone">
                    <span className="login-prefix">+91</span>
                    <input
                      className="ui-input"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </span>
                </label>
              ) : (
                <label className="ui-field">
                  <span className="ui-field-label">Email address</span>
                  <span className="ui-input-group">
                    <Mail size={17} />
                    <input
                      className="ui-input"
                      type="email"
                      placeholder="student@mars.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </span>
                </label>
              )}

              <button type="submit" className="ui-btn is-primary is-lg is-block login-submit">
                Get OTP <ArrowRight size={17} />
              </button>
            </form>
          )}

          {authMethod !== 'password' && step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="ui-stack login-fields" style={{ ['--gap' as string]: '14px' }}>
              <p className="ui-muted">
                Enter the 6-digit code sent to <strong>{phone || email}</strong> (use <strong>123456</strong> for test mode)
              </p>

              <input
                className="ui-input login-otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button type="submit" disabled={loading} className="ui-btn is-primary is-lg is-block login-submit">
                {loading ? 'Verifying...' : 'Verify & continue'}
              </button>

              <button type="button" className="ui-btn is-ghost is-block" onClick={() => setStep('input')}>
                Change phone/email
              </button>
            </form>
          )}

          <div className="login-or">
            <span>or</span>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="ui-btn is-outline is-lg is-block">
            <Sparkles size={18} className="login-google-icon" /> Continue with Google
          </button>

          {/* 1-click demo logins */}
          <section className="login-demos">
            <div className="ui-label login-demos-label">1-click demo logins</div>
            <div className="ui-list">
              {demos.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={d.run}
                  disabled={loading}
                  className="ui-list-item is-interactive login-demo"
                >
                  <span className={`ui-icon-box ${d.tone}`} style={{ ['--size' as string]: '38px' }}>
                    {d.icon}
                  </span>
                  <span className="ui-grow">
                    <span className="ui-list-title login-block">{d.title}</span>
                    <span className="ui-list-meta login-block">{d.desc}</span>
                  </span>
                  <ArrowRight size={16} className="login-demo-go" />
                </button>
              ))}
            </div>
          </section>

          <div className="ui-faint login-secure">
            <ShieldCheck size={14} /> Protected by MARS Security & Content Encryption
          </div>
        </div>
      </main>
    </div>
  );
};
