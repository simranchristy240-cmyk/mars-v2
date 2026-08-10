import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { openRazorpayModal } from '../../services/razorpay';
import {
  BookOpen,
  Lock,
  Unlock,
  PlayCircle,
  HelpCircle,
  FileText,
  CheckCircle,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountMsg, setDiscountMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['course-detail', id],
    queryFn: () => api.get(`/courses/${id}`),
    enabled: !!id,
  });

  const courseData = data?.data?.data;
  const course = courseData?.course;
  const isEnrolled = courseData?.isEnrolled;

  const handleEnrollOrPay = async () => {
    if (!user) return navigate('/login');

    try {
      // 1. Create Order
      const res = await api.post('/payments/create-order', {
        courseId: course._id,
        couponCode: couponCode || undefined,
      });

      if (res.data.data?.isFree) {
        alert('Course enrolled successfully for FREE!');
        queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
        queryClient.invalidateQueries({ queryKey: ['courses-all'] });
        queryClient.invalidateQueries({ queryKey: ['continue-learning'] });
        return;
      }

      const { orderId, amount, currency, keyId, paymentId } = res.data.data;

      // 2. Open Razorpay Modal
      await openRazorpayModal({
        keyId,
        orderId,
        amount,
        currency,
        name: course.title,
        description: 'Full course access unlock',
        userEmail: user.email,
        userPhone: user.phone,
        onSuccess: async (rzpRes) => {
          await api.post('/payments/verify', {
            razorpayOrderId: rzpRes.razorpay_order_id,
            razorpayPaymentId: rzpRes.razorpay_payment_id,
            razorpaySignature: rzpRes.razorpay_signature,
            paymentId,
          });
          alert('Payment successful! Course unlocked.');
          queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['courses-all'] });
          queryClient.invalidateQueries({ queryKey: ['continue-learning'] });
        },
        onFailure: (err) => {
          alert('Payment failed: ' + (err.message || 'Cancelled'));
        },
      });
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Payment initiation failed');
    }
  };

  const handleApplyCoupon = async () => {
    try {
      const res = await api.post('/payments/apply-coupon', {
        code: couponCode,
        courseId: course._id,
      });
      const coupon = res.data.data;
      setDiscountMsg(
        `Applied! ${coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value / 100} OFF`}`
      );
    } catch (err: any) {
      setDiscountMsg(err.response?.data?.error || 'Invalid coupon');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading course details...</div>;
  }

  if (!course) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Course not found</div>;
  }

  return (
    <StudentPageShell>
      {/* Course Banner */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: isEnrolled ? 'var(--success-light)' : 'var(--accent-light)',
              color: isEnrolled ? 'var(--success)' : 'var(--accent)',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {isEnrolled ? 'UNLOCKED / ENROLLED' : 'PER-COURSE PURCHASE'}
          </span>
        </div>

        <h1 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{course.title}</h1>
        {course.description ? (
          <HtmlContent html={course.description} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }} />
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Master this anatomy module with video lectures, practice question banks, and timed test series.
          </p>
        )}

        {!isEnrolled && (
          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Access Price:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {course.price === 0 ? 'FREE' : `₹${course.price / 100}`}
                </div>
              </div>

              <button
                onClick={handleEnrollOrPay}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                Enroll & Unlock All Topics
              </button>
            </div>

            {/* Coupon input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Coupon code (optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
              <button
                onClick={handleApplyCoupon}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Apply
              </button>
            </div>
            {discountMsg && <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>{discountMsg}</div>}
          </div>
        )}
      </div>

      {/* Test Series Navigation Banner */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>Course Test Series</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Timed exams with instant reports & rank</p>
        </div>
        <Link
          to={`/tests/course/${course._id}`}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          View Tests
        </Link>
      </div>

      {/* Topics Accordion */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '14px' }}>Course Topics & Lessons</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {course.topics?.map((topic: any, index: number) => {
          const isExpanded = expandedTopicId === topic._id || index === 0;
          const canAccess = isEnrolled || topic.isFree;

          return (
            <div
              key={topic._id}
              className="glass-card"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Topic Header */}
              <div
                onClick={() => setExpandedTopicId(isExpanded ? null : topic._id)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {canAccess ? (
                    <Unlock size={20} color="var(--success)" />
                  ) : (
                    <Lock size={20} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      Topic {index + 1}: {topic.title}
                    </div>
                    {topic.isFree && !isEnrolled && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                        FREE PREVIEW TOPIC
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {/* Topic Content (Lessons & Practice) */}
              {isExpanded && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                  {topic.description ? (
                    <HtmlContent html={topic.description} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }} />
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Watch video lessons and attempt practice questions.
                    </p>
                  )}

                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Lessons ({topic.lessons?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {topic.lessons?.map((lesson: any) => (
                      <div
                        key={lesson._id}
                        onClick={() => {
                          if (canAccess) navigate(`/lesson/${lesson._id}`);
                          else alert('Topic locked. Purchase full course to unlock.');
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: canAccess ? 'pointer' : 'not-allowed',
                          opacity: canAccess ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <PlayCircle size={18} color="var(--accent)" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{lesson.title}</span>
                        </div>

                        {canAccess ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Start</span>
                        ) : (
                          <Lock size={16} color="var(--text-muted)" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Practice Questions Button */}
                  <button
                    onClick={() => {
                      if (canAccess) navigate(`/practice/topic/${topic._id}`);
                      else alert('Topic locked. Purchase full course to unlock.');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <HelpCircle size={18} /> Practice Question Bank ({topic.practiceQuestions?.length || 0})
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StudentPageShell>
  );
};
