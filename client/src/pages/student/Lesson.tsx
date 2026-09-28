import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  PlayCircle,
  FileText,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  BookOpen,
  PanelLeft,
  CheckCircle2,
  XCircle,
  Flag,
} from 'lucide-react';
import { HtmlContent } from '../../components/RichTextEditor';
import { TierUpgradeModal } from '../../components/TierUpgradeModal';
import { useDrawer } from '../../contexts/DrawerContext';
import { CurriculumSidebar } from '../../components/lesson/CurriculumSidebar';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { EmptyState } from '../../components/ui';
import '../../styles/pages/lesson.css';

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  video: { label: 'Video', icon: <PlayCircle size={14} /> },
  text: { label: 'Reading', icon: <FileText size={14} /> },
  question: { label: 'Quick check', icon: <HelpCircle size={14} /> },
};

const getSectionMeta = (type?: string) => SECTION_META[type || ''] || { label: 'Section', icon: <BookOpen size={14} /> };

export const Lesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDrawerOpen, toggleDrawer, closeDrawer, setHasDrawerContent } = useDrawer();

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<'basic' | 'plus' | 'premium' | undefined>();

  // Register that drawer content exists when in Lesson page
  useEffect(() => {
    setHasDrawerContent(true);
    return () => setHasDrawerContent(false);
  }, [setHasDrawerContent]);

  // Reset section state when lesson id changes
  useEffect(() => {
    setActiveSectionIdx(0);
    setSelectedOpt(null);
    setFeedback(null);
  }, [id]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson-detail', id],
    queryFn: () => api.get(`/lessons/lessons/${id}`),
    enabled: !!id,
  });

  const lesson = data?.data?.data;
  const sections = lesson?.sections || [];
  const currentSection = sections[activeSectionIdx];
  const effectiveCourseId = lesson?.courseId?._id || lesson?.courseId;

  // Fetch course details to populate topics/lessons navigation
  const { data: courseRes } = useQuery({
    queryKey: ['course-detail', effectiveCourseId],
    queryFn: () => api.get(`/courses/${effectiveCourseId}`),
    enabled: !!effectiveCourseId,
  });

  const courseData = courseRes?.data?.data;
  const course = courseData?.course;
  const topics = course?.topics || [];
  const studentTier = courseData?.studentTier || 'free';
  const currentTopic = topics.find((t: any) => t._id === lesson?.topicId);

  const { data: progressRes } = useQuery({
    queryKey: ['course-progress', effectiveCourseId],
    queryFn: () => api.get(`/progress/${effectiveCourseId}`),
    enabled: !!effectiveCourseId,
  });
  const completedLessonIds: string[] = progressRes?.data?.data?.lessonsCompleted || [];

  const openUpgrade = (tier?: 'basic' | 'plus' | 'premium') => {
    setTargetTier(tier);
    setUpgradeModalOpen(true);
  };

  const completeMutation = useMutation({
    mutationFn: (sectionId: string) =>
      api.put('/progress/section', {
        courseId: lesson.courseId,
        lessonId: lesson._id,
        sectionId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-progress', effectiveCourseId] }),
  });

  const handleNextSection = () => {
    if (currentSection) {
      completeMutation.mutate(currentSection._id);
    }
    if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setFeedback(null);
    } else {
      alert('Lesson Completed! +50 XP Earned 🎉');
      navigate('/');
    }
  };

  const handleQuestionSubmit = async () => {
    if (!selectedOpt || !currentSection) return;
    try {
      const res = await api.post('/practice/submit', {
        questionId: currentSection._id,
        selectedOptions: [selectedOpt],
        courseId: lesson.courseId,
      });
      setFeedback(res.data.data);
    } catch (err: any) {
      alert('Error submitting answer');
    }
  };

  if (isLoading) {
    return (
      <StudentPageShell narrow>
        <div className="les-state" aria-busy="true">
          <div className="ui-skeleton les-skel-eyebrow" />
          <div className="ui-skeleton les-skel-title" />
          <div className="ui-skeleton les-skel-bar" />
          <div className="ui-skeleton les-state-media" />
          <p className="ui-faint">Loading your lesson…</p>
        </div>
      </StudentPageShell>
    );
  }

  if (error) {
    return (
      <StudentPageShell narrow>
        <div className="ui-tile les-state-tile">
          <EmptyState
            icon={<Lock size={24} />}
            title="This lesson is locked"
            text="This topic isn’t part of your current plan. Purchase the course to unlock its lessons."
            action={
              <button type="button" className="ui-btn is-primary" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Back to home
              </button>
            }
          />
      </div>
      </StudentPageShell>
    );
  }

  if (!lesson || sections.length === 0) {
    return (
      <StudentPageShell narrow>
        <div className="ui-tile les-state-tile">
          <EmptyState
            icon={<BookOpen size={24} />}
            title="Nothing here yet"
            text="There’s no content in this lesson yet. Check back soon."
            action={
              <button type="button" className="ui-btn is-outline" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Back to home
              </button>
            }
          />
        </div>
      </StudentPageShell>
    );
  }

  const isLastSection = activeSectionIdx >= sections.length - 1;
  const nextSection = sections[activeSectionIdx + 1];
  const currentMeta = getSectionMeta(currentSection?.type);
  const progressPct = Math.round(((activeSectionIdx + 1) / sections.length) * 100);
  const isLessonDone = completedLessonIds.map(String).includes(String(lesson._id));

  return (
    <div className="lesson-page-container">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`lesson-drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ─── LEFT SIDEBAR NAVIGATION DRAWER (Desktop & Mobile) ─────────────── */}
      <aside className={`lesson-sidebar-desktop ${isDrawerOpen ? 'drawer-open' : 'drawer-closed'}`}>
        <CurriculumSidebar
          courseTitle={course?.title}
          topics={topics}
          currentLessonId={id}
          currentTopicId={lesson?.topicId}
          completedLessonIds={completedLessonIds}
          activeSectionIdx={activeSectionIdx}
          sectionCount={sections.length}
          onOpenLesson={(lessonId) => navigate(`/lesson/${lessonId}`)}
          onOpenPractice={(topicId, setId) =>
            navigate(setId ? `/practice/topic/${topicId}/set/${setId}` : `/practice/topic/${topicId}`)
          }
          onLocked={openUpgrade}
          onHome={() => navigate('/')}
          onClose={closeDrawer}
        />
      </aside>

      {/* ─── MAIN LESSON CONTENT PANE ──────────────────────────────────────── */}
      <main className={`lesson-main-pane ${isDrawerOpen ? 'sidebar-open' : ''}`}>
        <div className="les-wrap">
          <header className="les-head ui-rise">
            <div className="les-head-bar">
            <button
                type="button"
                className="ui-icon-btn is-tile"
              onClick={() => navigate('/')}
                title="Back to home"
                aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </button>
              {currentTopic?.title && <span className="ui-label ui-truncate les-eyebrow">{currentTopic.title}</span>}
                </div>

            <h1 className="ui-page-title les-title">{lesson.title}</h1>

            <div className="ui-row les-meta">
              <span className="ui-chip">
                {currentMeta.icon} {currentMeta.label}
              </span>
              <span className="ui-faint">
                Section {activeSectionIdx + 1} of {sections.length}
              </span>
              {isLessonDone && (
                <span className="ui-chip is-success">
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
            </div>
          </header>

          {/* Section stepper (display only) */}
          <div className="les-stepper ui-rise" style={{ ['--i' as string]: 1 }}>
            <ol className="les-steps" aria-label={`Section ${activeSectionIdx + 1} of ${sections.length}`}>
              {sections.map((s: any, i: number) => (
                <li
                  key={s._id || i}
                  className={`les-step${i < activeSectionIdx ? ' is-done' : ''}${i === activeSectionIdx ? ' is-current' : ''}`}
                  title={`${i + 1}. ${s.title || getSectionMeta(s.type).label}`}
                />
              ))}
            </ol>
            <span className="les-stepper-pct">{progressPct}%</span>
        </div>

        {/* Section Content Display */}
        {currentSection && (
            <div className="les-stage ui-rise" key={currentSection._id || activeSectionIdx} style={{ ['--i' as string]: 2 }}>
            {/* VIDEO SECTION */}
            {currentSection.type === 'video' && (
                <section className="ui-tile is-flush les-video-tile">
                  <div className="les-video-frame">
                  <iframe
                    src={`https://player.vimeo.com/video/${currentSection.vimeoVideoId || '76979871'}?badge=0&autopause=0&player_id=0&app_id=58479#t=${currentSection.videoStartTime || 0}s`}
                    allow="autoplay; fullscreen; picture-in-in-picture"
                    title="Anatomy Lesson Video"
                  />
                </div>
                  {currentSection.title && (
                    <div className="les-video-caption">
                      <span className="ui-icon-box is-gold" style={{ ['--size' as string]: '34px' }}>
                        <PlayCircle size={16} />
                      </span>
                      <span className="ui-title ui-truncate">{currentSection.title}</span>
              </div>
                  )}
                </section>
            )}

            {/* TEXT SECTION */}
            {currentSection.type === 'text' && (
                <section className="ui-tile les-reading">
                  {currentSection.title && <h2 className="ui-title-lg les-reading-title">{currentSection.title}</h2>}
                  <div
                    className="les-prose"
                dangerouslySetInnerHTML={{
                  __html: currentSection.text || '<p>Study Notes: Pay close attention to domain structures and anatomical references in the video.</p>',
                }}
              />
                </section>
            )}

            {/* INLINE QUESTION SECTION */}
            {currentSection.type === 'question' && (
                <section className="ui-tile les-question">
                  <div className="ui-tile-head">
                    <span className="ui-chip is-gold">
                      <HelpCircle size={13} /> Quick check
                    </span>
                    {!feedback && <span className="ui-faint">Pick one answer</span>}
                </div>

                  <HtmlContent as="div" html={currentSection.questionText} className="les-question-text" />

                {currentSection.questionImage && (
                    <img src={currentSection.questionImage} alt="Anatomy Diagram" className="les-question-img" />
                  )}

                  <div className="les-options" role="radiogroup">
                    {currentSection.options?.map((opt: any) => {
                      const isSelected = selectedOpt === opt.id;
                      const state = isSelected ? (feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ' is-selected') : '';
                      return (
                    <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                      key={opt.id}
                          className={`ui-option${state}`}
                      onClick={() => setSelectedOpt(opt.id)}
                        >
                          <span className="ui-option-key">{opt.id.toUpperCase()}</span>
                          <HtmlContent html={opt.text} className="ui-grow" />
                    </button>
                      );
                    })}
                </div>

                {!feedback ? (
                  <button
                      type="button"
                      className="ui-btn is-primary is-lg les-submit"
                    onClick={handleQuestionSubmit}
                    disabled={!selectedOpt}
                    >
                      Submit answer
                  </button>
                ) : (
                    <div className={`ui-callout ${feedback.isCorrect ? 'is-success' : 'is-danger'} les-feedback`} role="status">
                      <span className={`les-feedback-icon ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                        {feedback.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </span>
                      <div className="ui-grow">
                        <div className="les-feedback-title">
                          {feedback.isCorrect ? (
                            <>
                              Correct! <span className="les-xp">+10 XP</span>
                            </>
                          ) : (
                            'Not quite'
                          )}
                    </div>
                    {feedback.explanation && (
                          <div className="les-feedback-body">
                            <strong>Explanation:</strong> <HtmlContent as="span" html={feedback.explanation} />
                      </div>
                    )}
                  </div>
                    </div>
                  )}
                </section>
                )}
              </div>
            )}

          {/* Bottom action row */}
          <div className="les-actions">
            <div className="les-actions-inner">
              <div className="ui-grow les-actions-next">
                <span className="ui-label">{isLastSection ? 'Last step' : 'Up next'}</span>
                <span className="ui-truncate les-actions-next-title">
                  {isLastSection
                    ? 'Finish to earn +50 XP'
                    : nextSection?.title || getSectionMeta(nextSection?.type).label}
                </span>
              </div>
              <button
                type="button"
                className={`ui-btn is-lg ${isLastSection ? 'is-gold' : 'is-primary'}`}
                onClick={handleNextSection}
              >
                {isLastSection ? (
                  <>
                    <Flag size={16} /> Finish lesson
                  </>
                ) : (
                  <>
                    Next section <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upgrades Modal for locked lesson items */}
      <TierUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        course={course}
        currentTier={studentTier}
        targetTier={targetTier}
      />
    </div>
  );
};
