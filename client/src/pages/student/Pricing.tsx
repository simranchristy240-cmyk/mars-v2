import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { loadRazorpayScript } from '../../services/razorpay';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  HelpCircle,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import '../../styles/pages/modals.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: myCourseRes, isLoading } = useQuery({
    queryKey: ['my-course', user?.selectedCourseId],
    queryFn: () => api.get('/courses/my/active'),
    enabled: !!user,
  });

  const course = myCourseRes?.data?.data?.course;
  const currentTier: 'free' | 'basic' | 'plus' | 'premium' =
    myCourseRes?.data?.data?.studentTier || 'free';

  const [selectedTier, setSelectedTier] = useState<'basic' | 'plus' | 'premium'>(
    currentTier === 'basic' ? 'plus' : 'plus'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pricing = course?.pricing || {
    basic: { price: 49900 },
    plus: { price: 99900 },
    premium: { price: 149900 },
  };

  const basicPrice = Math.round((pricing.basic?.price || 49900) / 100);
  const plusPrice = Math.round((pricing.plus?.price || 99900) / 100);
  const premiumPrice = Math.round((pricing.premium?.price || 149900) / 100);

  const getEffectivePrice = (tier: 'basic' | 'plus' | 'premium') => {
    const fullPrice = tier === 'basic' ? basicPrice : tier === 'plus' ? plusPrice : premiumPrice;
    if (currentTier === 'basic') {
      if (tier === 'plus') return Math.max(0, plusPrice - basicPrice);
      if (tier === 'premium') return Math.max(0, premiumPrice - basicPrice);
    } else if (currentTier === 'plus') {
      if (tier === 'premium') return Math.max(0, premiumPrice - plusPrice);
    }
    return fullPrice;
  };

  const handleCheckout = async (tier: 'basic' | 'plus' | 'premium') => {
    if (!course?._id) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const orderRes = await api.post('/payments/order', {
        courseId: course._id,
        tier,
      });

      if (!orderRes.data.success) {
        setErrorMsg(orderRes.data.error || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      const orderData = orderRes.data.data;

      // Free / 100% discount direct unlock
      if (orderData.isFree) {
        setSuccessMsg(`Congratulations! Your ${tier.toUpperCase()} plan is unlocked.`);
        queryClient.invalidateQueries({ queryKey: ['course-detail'] });
        queryClient.invalidateQueries({ queryKey: ['my-course'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setTimeout(() => {
          navigate('/');
        }, 1500);
        return;
      }

      // Check if mock / test key mode
      const isMock = !orderData.keyId || orderData.keyId.startsWith('rzp_test_mock');

      if (isMock) {
        const verifyRes = await api.post('/payments/verify', {
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'sig_mock_' + Date.now(),
          paymentId: orderData.paymentId,
        });

        if (verifyRes.data.success) {
          setSuccessMsg(`Payment successful! You are now upgraded to the ${tier.toUpperCase()} plan.`);
          queryClient.invalidateQueries({ queryKey: ['course-detail'] });
          queryClient.invalidateQueries({ queryKey: ['my-course'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setErrorMsg(verifyRes.data.error || 'Verification failed');
        }
      } else {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'MARS Anatomy Platform',
          description: `${course.title} - ${tier.toUpperCase()} Plan`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: orderData.paymentId,
              });

              if (verifyRes.data.success) {
                setSuccessMsg(`Payment successful! Course unlocked on ${tier.toUpperCase()} plan.`);
                queryClient.invalidateQueries({ queryKey: ['course-detail'] });
                queryClient.invalidateQueries({ queryKey: ['my-course'] });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                setTimeout(() => {
                  navigate('/');
                }, 1500);
              }
            } catch (vErr: any) {
              setErrorMsg(vErr.message || 'Payment verification failed');
            }
          },
          theme: { color: '#090941' },
        };

        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error('Failed to load Razorpay payment gateway. Please check your connection.');
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const TIERS = [
    {
      id: 'basic' as const,
      name: 'Basic',
      icon: <Shield size={22} />,
      tone: '',
      tagline: 'Essential Clinical Anatomy',
      price: basicPrice,
      effectivePrice: getEffectivePrice('basic'),
      isCurrent: currentTier === 'basic',
      isLower: currentTier === 'plus' || currentTier === 'premium',
      features: [
        'All Free & Basic Video Lessons',
        'Clinical Osteology & Bone Landmarks',
        'Topic-wise Practice Questions',
        'Progress & Streak Tracking',
        'Discussion & Doubt Forum Access',
      ],
    },
    {
      id: 'plus' as const,
      name: 'Plus',
      badge: 'Recommended',
      icon: <Zap size={22} />,
      tone: 'is-gold',
      tagline: 'Complete Exam Mastery',
      price: plusPrice,
      effectivePrice: getEffectivePrice('plus'),
      isCurrent: currentTier === 'plus',
      isLower: currentTier === 'premium',
      features: [
        'Everything in Basic Plan',
        'Brachial Plexus & Peripheral Nerves',
        'Complete Test Series & Timed Mocks',
        'Percentile & Negative Marking Stats',
        'Clinical Case Studies & Scenarios',
      ],
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      badge: 'Ultimate',
      icon: <Crown size={22} />,
      tone: 'is-accent',
      tagline: 'Surgical & Deep Specialization',
      price: premiumPrice,
      effectivePrice: getEffectivePrice('premium'),
      isCurrent: currentTier === 'premium',
      isLower: false,
      features: [
        'Everything in Plus Plan',
        'Advanced Surgical Dissection Videos',
        'Thoracic Outlet & Decompression Modules',
        'High-Resolution PDF Notes & Atlases',
        '1-on-1 Mentor Guidance & Priority Support',
      ],
    },
  ];

  if (isLoading) {
    return (
      <StudentPageShell>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="ui-spinner" style={{ margin: '0 auto 16px' }} />
          <p className="ui-muted">Loading pricing plans...</p>
        </div>
      </StudentPageShell>
    );
  }

  return (
    <StudentPageShell style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 64 }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          type="button"
          className="ui-btn is-outline is-sm"
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        {course && (
          <span className="ui-chip is-gold" style={{ fontSize: '0.82rem' }}>
            <Sparkles size={13} /> {course.title}
          </span>
        )}
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
        <h1 className="ui-title-xl" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', marginBottom: 12 }}>
          Choose your learning plan
        </h1>
        <p className="ui-muted" style={{ fontSize: '1rem', lineHeight: 1.55 }}>
          Unlock clinical video lessons, comprehensive test series, and advanced surgical modules tailored for medical excellence.
        </p>

        {currentTier !== 'free' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'var(--tile-muted, rgba(99, 102, 241, 0.08))',
              border: '1px solid var(--border-color)',
              marginTop: 14,
              fontSize: '0.85rem',
            }}
          >
            <ShieldCheck size={16} color="var(--primary)" />
            <span>
              You are currently on the <strong>{currentTier.toUpperCase()}</strong> plan.
              {currentTier !== 'premium' && ' Upgrades only charge the difference!'}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="ui-callout is-danger" role="alert" style={{ maxWidth: 720, margin: '0 auto 24px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="ui-callout is-success" role="status" style={{ maxWidth: 720, margin: '0 auto 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="mdl-plans" style={{ marginTop: 8 }}>
        {TIERS.map((tier, idx) => {
          const isSelected = selectedTier === tier.id;
          const isCurrent = tier.isCurrent;
          const isLower = tier.isLower;
          const isUpgrading = currentTier !== 'free' && !isCurrent && !isLower;
          const isSelectable = !isCurrent && !isLower;
          const isHighlighted = isSelected && isSelectable;

          const tileClass = [
            'ui-tile',
            'mdl-plan',
            isHighlighted ? 'is-inverse' : '',
            isSelectable ? 'is-selectable' : '',
            isCurrent ? 'is-current' : '',
            isLower ? 'is-lower' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={tier.id}
              className={tileClass}
              style={{ ['--i' as string]: idx }}
              onClick={() => {
                if (!isCurrent && !isLower) setSelectedTier(tier.id);
              }}
            >
              {isHighlighted && <div className="ui-sunburst mdl-plan-rays" aria-hidden="true" />}

              <div className="ui-row is-between is-nowrap mdl-plan-head">
                <span
                  className={`ui-icon-box ${isHighlighted ? 'is-gold' : tier.tone}`}
                  style={{ ['--size' as string]: '46px' }}
                >
                  {tier.icon}
                </span>
                {isCurrent ? (
                  <span className="ui-chip is-success">Current plan</span>
                ) : tier.badge ? (
                  <span
                    className={`ui-chip ${tier.id === 'plus' ? 'is-gold' : isHighlighted ? 'is-on-inverse' : 'is-outline'}`}
                  >
                    {tier.id === 'plus' && <Sparkles size={11} />}
                    {tier.badge}
                  </span>
                ) : null}
              </div>

              <h2 className="ui-title mdl-plan-name" style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>{tier.name}</h2>
              <span className="ui-muted mdl-plan-tagline">{tier.tagline}</span>

              <div className="mdl-price">
                <span className="mdl-price-value">
                  <span className="mdl-price-currency">₹</span>
                  {tier.effectivePrice}
                </span>
                {isUpgrading && <span className="mdl-price-was">₹{tier.price}</span>}
              </div>
              <span className={`mdl-price-note${isUpgrading ? ' is-upgrade' : ''}`}>
                {isUpgrading ? 'Tier difference upgrade' : 'One-time payment'}
              </span>

              <ul className="mdl-features" style={{ margin: '20px 0 24px' }}>
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx}>
                    <span className="mdl-feature-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mdl-plan-state is-current" style={{ marginTop: 'auto' }}>
                  <CheckCircle2 size={16} /> Active plan
                </div>
              ) : isLower ? (
                <div className="mdl-plan-state" style={{ marginTop: 'auto' }}>Included in your tier</div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(tier.id);
                  }}
                  disabled={loading}
                  className={`ui-btn is-lg is-block mdl-plan-cta ${isSelected ? 'is-gold' : 'is-outline'}`}
                  style={{ marginTop: 'auto' }}
                >
                  {loading && selectedTier === tier.id
                    ? 'Processing...'
                    : isUpgrading
                    ? `Upgrade for ₹${tier.effectivePrice}`
                    : `Get ${tier.name} access`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Section */}
      <div
        className="ui-tile"
        style={{
          marginTop: 36,
          padding: '24px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          alignItems: 'center',
          background: 'var(--tile-muted, rgba(0,0,0,0.02))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ui-icon-box is-gold" style={{ ['--size' as string]: '38px', flexShrink: 0 }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Secure Checkout</div>
            <div className="ui-muted" style={{ fontSize: '0.78rem' }}>256-bit encrypted via Razorpay</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ui-icon-box" style={{ ['--size' as string]: '38px', flexShrink: 0 }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Instant Activation</div>
            <div className="ui-muted" style={{ fontSize: '0.78rem' }}>Immediate access to all modules</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ui-icon-box" style={{ ['--size' as string]: '38px', flexShrink: 0 }}>
            <HelpCircle size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dedicated Support</div>
            <div className="ui-muted" style={{ fontSize: '0.78rem' }}>Peer and mentor doubt assistance</div>
          </div>
        </div>
      </div>
    </StudentPageShell>
  );
};

export default Pricing;
