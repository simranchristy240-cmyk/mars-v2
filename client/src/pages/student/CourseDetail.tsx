import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Lock,
  Unlock,
  PlayCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Crown,
} from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';
import { TierUpgradeModal } from '../../components/TierUpgradeModal';
import { GoalSelectionModal } from '../../components/GoalSelectionModal';

export const CourseDetail: React.FC = () => {
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // If no routeId or routeId is invalid, fallback to user's selectedCourseId
  const isInvalidId = !routeId || routeId === 'active' || routeId === 'undefined' || routeId === 'null';
  const effectiveId = !isInvalidId ? routeId : user?.selectedCourseId;

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [targetUpgradeTier, setTargetUpgradeTier] = useState<'basic' | 'plus' | 'premium' | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['course-detail', effectiveId || 'my-active'],
    queryFn: () => (effectiveId ? api.get(`/courses/${effectiveId}`) : api.get('/courses/my/active')),
    enabled: !!user,
  });

  const courseData = data?.data?.data;
  const course = courseData?.course || (courseData?.title ? courseData : null);
  const studentTier: 'free' | 'basic' | 'plus' | 'premium' = courseData?.studentTier || 'free';
  const isCourseLocked = !!courseData?.isCourseLocked;
  const isEnrolled = courseData?.isEnrolled;

  const openUpgrade = (tier?: 'basic' | 'plus' | 'premium') => {
    setTargetUpgradeTier(tier);
    setTierModalOpen(true);
  };

  const getTierBadge = (tier: string = 'free') => {
    switch (tier) {
      case 'free':
        return (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            FREE
          </span>
        );
      case 'basic':
        return (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            BASIC
          </span>
        );
      case 'plus':
        return (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            PLUS
          </span>
        );
      case 'premium':
        return (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            PREMIUM
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading course curriculum...</div>;
  }

  if (!course) {
    return (
      <StudentPageShell>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }}>No Track Selected</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Please select your target preparation track to start learning.
          </p>
          <button
            onClick={() => setGoalModalOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Choose Preparation Track
          </button>
          <GoalSelectionModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
        </div>
      </StudentPageShell>
    );
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: studentTier !== 'free' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: studentTier !== 'free' ? '#10b981' : 'var(--accent)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              {studentTier === 'free' ? 'FREE PREVIEW' : `${studentTier.toUpperCase()} PLAN ACTIVE`}
            </span>

            {isCourseLocked ? (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Lock size={12} color="#10b981" /> Track Locked
              </span>
            ) : (
              <button
                onClick={() => setGoalModalOpen(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} /> Switch Track
              </button>
            )}
          </div>

          {studentTier !== 'premium' && (
            <button
              onClick={() => openUpgrade()}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'var(--on-accent, #ffffff)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Sparkles size={14} />
              {studentTier === 'free' ? 'Upgrade Plan' : 'Upgrade to Plus / Premium'}
            </button>
          )}
        </div>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
          {course.title}
        </h1>

        {course.description ? (
          <HtmlContent html={course.description} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }} />
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Comprehensive anatomical curriculum designed for clinical mastery, osteology landmarks, and high-yield exams.
          </p>
        )}

        {/* Plan Upgrade Banner Card */}
        {studentTier !== 'premium' && (
          <div
            style={{
              background: 'var(--bg-primary, #0f172a)',
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Shield size={16} color="var(--accent)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Unlock Full Course Access
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Choose between Basic, Plus, and Premium tiers to unlock all lessons, test series, and surgical modules.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {studentTier === 'free' && (
                <button
                  onClick={() => openUpgrade('basic')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Basic (₹{Math.round((course.pricing?.basic?.price || 49900) / 100)})
                </button>
              )}

              {studentTier !== 'plus' && (
                <button
                  onClick={() => openUpgrade('plus')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Plus (₹{Math.round((course.pricing?.plus?.price || 99900) / 100)})
                </button>
              )}

              <button
                onClick={() => openUpgrade('premium')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  border: 'none',
                  color: 'var(--on-accent, #ffffff)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Premium (₹{Math.round((course.pricing?.premium?.price || 149900) / 100)})
              </button>
            </div>
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
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 2px' }}>Course Test Series</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Timed exams with instant reports, negative marking & rank</p>
        </div>
        <Link
          to={`/tests/course/${course._id}`}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          View Tests ({course.tests?.length || course.testSeries?.length || 0})
        </Link>
      </div>

      {/* Topics Accordion */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '14px' }}>Course Topics & Lessons</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {course.topics?.map((topic: any, index: number) => {
          const isExpanded = expandedTopicId === topic._id || index === 0;

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
                  <BookOpen size={20} color="var(--accent)" />
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Topic {index + 1}: {topic.title}
                    </div>
                    {topic.isFree && studentTier === 'free' && (
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                        FREE PREVIEW MODULE
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

                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lessons ({topic.lessons?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {topic.lessons?.map((lesson: any) => {
                      const isLocked = !!lesson.isLocked;

                      return (
                        <div
                          key={lesson._id}
                          onClick={() => {
                            if (isLocked) {
                              openUpgrade(lesson.accessTier || 'basic');
                            } else {
                              navigate(`/lesson/${lesson._id}`);
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            opacity: isLocked ? 0.75 : 1,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isLocked ? (
                              <Lock size={18} color="var(--text-muted)" />
                            ) : (
                              <PlayCircle size={18} color="var(--accent)" />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {lesson.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getTierBadge(lesson.accessTier || 'free')}

                            {isLocked ? (
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--accent)',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                Unlock
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Start</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Practice Questions Button */}
                  <button
                    onClick={() => {
                      const hasPracticeLocked = (topic.practiceQuestions || []).some((p: any) => p.isLocked);
                      if (hasPracticeLocked && studentTier === 'free') {
                        openUpgrade('basic');
                      } else {
                        navigate(`/practice/topic/${topic._id}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'var(--accent-light)',
                      border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
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

      {/* Modals */}
      {tierModalOpen && (
        <TierUpgradeModal
          isOpen={true}
          onClose={() => setTierModalOpen(false)}
          course={course}
          currentTier={studentTier}
          targetTier={targetUpgradeTier}
        />
      )}

      {goalModalOpen && (
        <GoalSelectionModal
          isOpen={true}
          onClose={() => setGoalModalOpen(false)}
          mandatory={false}
        />
      )}
    </StudentPageShell>
  );
};
