import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Check, Sparkles, X, Shield, Zap, Crown, CheckCircle2, ShieldCheck } from 'lucide-react';
import '../styles/pages/modals.css';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  currentTier?: 'free' | 'basic' | 'plus' | 'premium';
  targetTier?: 'basic' | 'plus' | 'premium';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  onClose,
  course,
  currentTier = 'free',
  targetTier,
}) => {
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'plus' | 'premium'>(
    targetTier || (currentTier === 'basic' ? 'plus' : 'basic')
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !course) return null;

  const pricing = course.pricing || {
    basic: { price: 49900 },
    plus: { price: 99900 },
    premium: { price: 149900 },
  };

  const basicPrice = Math.round((pricing.basic?.price || 49900) / 100);
  const plusPrice = Math.round((pricing.plus?.price || 99900) / 100);
  const premiumPrice = Math.round((pricing.premium?.price || 149900) / 100);

  const getEffectivePrice = (tier: 'basic' | 'plus' | 'premium') => {
    let fullPrice = tier === 'basic' ? basicPrice : tier === 'plus' ? plusPrice : premiumPrice;
    if (currentTier === 'basic') {
      if (tier === 'plus') return Math.max(0, plusPrice - basicPrice);
      if (tier === 'premium') return Math.max(0, premiumPrice - basicPrice);
    } else if (currentTier === 'plus') {
      if (tier === 'premium') return Math.max(0, premiumPrice - plusPrice);
    }
    return fullPrice;
  };

  const handleCheckout = async (tier: 'basic' | 'plus' | 'premium') => {
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
          onClose();
        }, 1500);
        return;
      }

      // Check if mock / test key mode
      const isMock = !orderData.keyId || orderData.keyId.startsWith('rzp_test_mock');

      if (isMock) {
        // Automatic mock verification in development mode
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
            onClose();
          }, 1500);
        } else {
          setErrorMsg(verifyRes.data.error || 'Verification failed');
        }
      } else {
        // Real Razorpay popup
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
                  onClose();
                }, 1500);
              }
            } catch (vErr: any) {
              setErrorMsg(vErr.message || 'Payment verification failed');
            }
          },
          theme: { color: '#090941' },
        };

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
      icon: <Shield size={20} />,
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
      icon: <Zap size={20} />,
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
      icon: <Crown size={20} />,
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

  return (
    <div className="ui-modal-backdrop mdl-backdrop">
      <div
        className="ui-modal mdl-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdl-tier-title"
        style={{ ['--w' as string]: '1000px' }}
      >
        <button type="button" className="ui-icon-btn ui-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="ui-modal-head mdl-head">
          <span className="ui-chip is-gold mdl-course-chip">
            <Sparkles size={12} /> <span className="ui-truncate">{course.title}</span>
          </span>
          <h2 id="mdl-tier-title" className="ui-title-lg mdl-title">
            Choose your learning plan
          </h2>
          <p className="ui-muted mdl-sub">
            Unlock structured video lessons, comprehensive test series, and advanced surgical modules.
          </p>
        </div>

        <div className="ui-modal-body">
          {errorMsg && (
            <div className="ui-callout is-danger mdl-error" role="alert">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="ui-callout is-success mdl-success" role="status">
              <CheckCircle2 size={18} />
              {successMsg}
            </div>
          )}

          <div className="mdl-plans">
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
                      style={{ ['--size' as string]: '42px' }}
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

                  <h3 className="ui-title mdl-plan-name">{tier.name}</h3>
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

                  <ul className="mdl-features">
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
                    <div className="mdl-plan-state is-current">
                      <CheckCircle2 size={15} /> Active plan
                    </div>
                  ) : isLower ? (
                    <div className="mdl-plan-state">Included in your tier</div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout(tier.id);
                      }}
                      disabled={loading}
                      className={`ui-btn is-lg is-block mdl-plan-cta ${isSelected ? 'is-gold' : 'is-outline'}`}
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

          <div className="ui-faint mdl-trust">
            <ShieldCheck size={14} /> Secure checkout · One-time payment
          </div>
        </div>
      </div>
    </div>
  );
};
