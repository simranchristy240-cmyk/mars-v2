import { QuestionAnswer } from '../../components/QuestionAnswer';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Columns,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HtmlContent } from '../../components/RichTextEditor';
import { TierUpgradeModal } from '../../components/TierUpgradeModal';
import { useDrawer } from '../../contexts/DrawerContext';
import { CurriculumSidebar } from '../../components/lesson/CurriculumSidebar';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { PdfNotesViewer } from '../../components/lesson/PdfNotesViewer';
import { VimeoPlayer, formatTime } from '../../components/lesson/VimeoPlayer';
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { isDrawerOpen, toggleDrawer, closeDrawer, setHasDrawerContent } = useDrawer();

  const targetSectionId = new URLSearchParams(location.search).get('sectionId');

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string; correctOptions?: string[] } | null>(null);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<'basic' | 'plus' | 'premium' | undefined>();
  const [splitMode, setSplitMode] = useState<'split' | 'video' | 'notes'>('split');
  const [mobileTab, setMobileTab] = useState<'video' | 'notes'>('video');
  const videoTileRef = useRef<HTMLDivElement | null>(null);
  const [videoTileHeight, setVideoTileHeight] = useState<number | undefined>(undefined);

  // Register that drawer content exists when in Lesson page
  useEffect(() => {
    setHasDrawerContent(true);
    return () => setHasDrawerContent(false);
  }, [setHasDrawerContent]);

  // Reset section state when lesson id changes
  useEffect(() => {
    setActiveSectionIdx(0);
    setSelectedOpt([]);
    setFeedback(null);
    setSplitMode('split');
    setMobileTab('video');
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

  // Jump to specific section if sectionId is passed in URL query
  useEffect(() => {
    if (!sections || sections.length === 0) return;
    if (targetSectionId) {
      const idx = sections.findIndex((s: any) => String(s._id) === String(targetSectionId));
      if (idx !== -1) {
        setActiveSectionIdx(idx);
        setSelectedOpt([]);
        setFeedback(null);
      }
    }
  }, [sections, targetSectionId]);

  // Synchronize notes pane height to match video tile exactly when side-by-side
  useEffect(() => {
    const el = videoTileRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const syncHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 120) {
        setVideoTileHeight(h);
      }
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [currentSection, splitMode]);

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
      setSelectedOpt([]);
      setFeedback(null);
    } else {
      alert('Lesson Completed! +50 XP Earned 🎉');
      navigate('/');
    }
  };

  const handlePrevSection = () => {
    if (activeSectionIdx > 0) {
      setActiveSectionIdx((prev) => prev - 1);
      setSelectedOpt([]);
      setFeedback(null);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!selectedOpt.length || !currentSection) return;
    try {
      const res = await api.post('/practice/submit', {
        questionId: currentSection._id,
        selectedOptions: selectedOpt,
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
              <button
                type="button"
                className="ui-btn is-primary"
                onClick={() => navigate(isAdmin ? (effectiveCourseId ? `/admin/builder/${effectiveCourseId}` : '/admin/builder') : '/')}
              >
                <ArrowLeft size={16} /> {isAdmin ? 'Return to Course Builder' : 'Back to home'}
              </button>
            }
          />
      </div>
      </StudentPageShell>
    );
  }

  const adminReturnUrl = effectiveCourseId ? `/admin/builder/${effectiveCourseId}` : '/admin/builder';

  if (!lesson || sections.length === 0) {
    return (
      <StudentPageShell narrow>
        <div className="ui-tile les-state-tile">
          <EmptyState
            icon={<BookOpen size={24} />}
            title="Nothing here yet"
            text={isAdmin ? "This lesson has no sections yet. Add videos or questions in the Course Builder." : "There’s no content in this lesson yet. Check back soon."}
            action={
              <button
                type="button"
                className="ui-btn is-outline"
                onClick={() => navigate(isAdmin ? adminReturnUrl : '/')}
              >
                <ArrowLeft size={16} /> {isAdmin ? 'Return to Course Builder' : 'Back to home'}
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
          onHome={() => navigate(isAdmin ? adminReturnUrl : '/')}
          onClose={closeDrawer}
        />
      </aside>

      {/* ─── MAIN LESSON CONTENT PANE ──────────────────────────────────────── */}
      <main className={`lesson-main-pane ${isDrawerOpen ? 'sidebar-open' : ''}`}>
        <div className={`les-wrap ${lesson?.notesFile?.filename && currentSection?.type === 'video' ? 'is-wide' : ''}`}>
          <header className="les-compact-head ui-rise">
            <div className="les-head-left">
              <button
                type="button"
                className="ui-icon-btn is-tile les-back-btn"
                onClick={() => navigate(isAdmin ? adminReturnUrl : '/')}
                title={isAdmin ? "Return to Course Builder" : "Back to home"}
                aria-label={isAdmin ? "Return to Course Builder" : "Back to home"}
              >
                <ArrowLeft size={16} />
              </button>

              <span className="les-counter-pill" title={`Section ${activeSectionIdx + 1} of ${sections.length}`}>
                {activeSectionIdx + 1}/{sections.length}
              </span>

              <h1 className="les-single-title" title={lesson.title}>{lesson.title}</h1>

              {isAdmin && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                  title="You are previewing this lesson in Administrator mode"
                >
                  <Eye size={12} /> Admin Preview
                </span>
              )}

              {isLessonDone && (
                <span className="ui-chip is-success is-sm">
                  <CheckCircle2 size={11} /> Done
                </span>
              )}
            </div>

            {lesson?.notesFile?.filename && currentSection?.type === 'video' && (
              <div className="lesson-segmented-control" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={splitMode === 'split'}
                  className={`lesson-segment-btn ${splitMode === 'split' ? 'is-active' : ''}`}
                  onClick={() => setSplitMode('split')}
                  title="Side-by-side video and notes"
                >
                  <Columns size={13} /> Split View
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={splitMode === 'video'}
                  className={`lesson-segment-btn ${splitMode === 'video' ? 'is-active' : ''}`}
                  onClick={() => setSplitMode('video')}
                  title="Focus on video"
                >
                  <PlayCircle size={13} /> Video Only
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={splitMode === 'notes'}
                  className={`lesson-segment-btn ${splitMode === 'notes' ? 'is-active' : ''}`}
                  onClick={() => setSplitMode('notes')}
                  title="Focus on notes"
                >
                  <FileText size={13} /> Notes Only
                </button>
              </div>
            )}
          </header>

          {/* Slim section stepper */}
          <div className="les-slim-stepper ui-rise" style={{ ['--i' as string]: 1 }}>
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
              lesson?.notesFile?.filename ? (
                <div className="les-video-notes-wrapper">
                  {/* Mobile switcher tabs */}
                  <div className="lesson-mobile-tabs">
                    <button
                      type="button"
                      className={`lesson-mobile-tab ${mobileTab === 'video' ? 'is-active' : ''}`}
                      onClick={() => setMobileTab('video')}
                    >
                      <PlayCircle size={15} /> Video
                    </button>
                    <button
                      type="button"
                      className={`lesson-mobile-tab ${mobileTab === 'notes' ? 'is-active' : ''}`}
                      onClick={() => setMobileTab('notes')}
                    >
                      <FileText size={15} /> Notes
                    </button>
                  </div>

                  {/* Dual Pane container */}
                  <div className={`lesson-dual-layout focus-${splitMode} mobile-show-${mobileTab}`}>
                    <div className="lesson-video-pane">
                      <section ref={videoTileRef} className="ui-tile is-flush les-video-tile">
                        <div className="les-video-frame">
                          <VimeoPlayer
                            vimeoVideoId={currentSection.vimeoVideoId || '76979871'}
                            startTime={currentSection.videoStartTime || 0}
                            endTime={currentSection.videoEndTime}
                            title={currentSection.title || 'Anatomy Lesson Video'}
                            onEnded={() => completeMutation.mutate(currentSection._id)}
                          />
                        </div>
                        <div className="les-video-bottom-bar">
                          <div className="les-nav-left">
                            {activeSectionIdx > 0 && (
                              <button
                                type="button"
                                className="ui-btn is-outline is-sm les-nav-btn"
                                onClick={handlePrevSection}
                                title="Previous section"
                              >
                                <ArrowLeft size={14} /> Previous
                              </button>
                            )}
                            <span className="les-video-caption-text" title={currentSection.title || 'Video Lesson'}>
                              {currentSection.title || 'Video Lesson'}
                            </span>
                            {currentSection.videoEndTime && (
                              <span className="les-clip-time-pill" title="Section duration">
                                {formatTime(currentSection.videoStartTime || 0)} – {formatTime(currentSection.videoEndTime)}
                              </span>
                            )}
                          </div>

                          <div className="les-nav-right">
                            <button
                              type="button"
                              className={`ui-btn is-sm les-nav-btn ${isLastSection ? 'is-gold' : 'is-primary'}`}
                              onClick={handleNextSection}
                            >
                              {isLastSection ? (
                                <>
                                  <Flag size={14} /> Finish lesson (+50 XP)
                                </>
                              ) : (
                                <>
                                  Next section <ArrowRight size={14} />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div
                      className="lesson-notes-pane"
                      style={splitMode === 'split' && videoTileHeight ? { height: `${videoTileHeight}px` } : undefined}
                    >
                      <PdfNotesViewer
                        lessonId={lesson._id}
                        notesTitle={lesson.notesFile?.originalName || 'Lesson Notes'}
                        isMaximized={splitMode === 'notes'}
                        onToggleMaximize={() => setSplitMode(splitMode === 'notes' ? 'split' : 'notes')}
                        matchedHeight={splitMode === 'split' ? videoTileHeight : undefined}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <section className="ui-tile is-flush les-video-tile">
                  <div className="les-video-frame">
                    <VimeoPlayer
                      vimeoVideoId={currentSection.vimeoVideoId || '76979871'}
                      startTime={currentSection.videoStartTime || 0}
                      endTime={currentSection.videoEndTime}
                      title={currentSection.title || 'Anatomy Lesson Video'}
                      onEnded={() => completeMutation.mutate(currentSection._id)}
                    />
                  </div>
                  <div className="les-video-bottom-bar">
                    <div className="les-nav-left">
                      {activeSectionIdx > 0 && (
                        <button
                          type="button"
                          className="ui-btn is-outline is-sm les-nav-btn"
                          onClick={handlePrevSection}
                          title="Previous section"
                        >
                          <ArrowLeft size={14} /> Previous
                        </button>
                      )}
                      <span className="les-video-caption-text" title={currentSection.title || 'Video Lesson'}>
                        {currentSection.title || 'Video Lesson'}
                      </span>
                      {currentSection.videoEndTime && (
                        <span className="les-clip-time-pill" title="Section duration">
                          {formatTime(currentSection.videoStartTime || 0)} – {formatTime(currentSection.videoEndTime)}
                        </span>
                      )}
                    </div>

                    <div className="les-nav-right">
                      <button
                        type="button"
                        className={`ui-btn is-sm les-nav-btn ${isLastSection ? 'is-gold' : 'is-primary'}`}
                        onClick={handleNextSection}
                      >
                        {isLastSection ? (
                          <>
                            <Flag size={14} /> Finish lesson (+50 XP)
                          </>
                        ) : (
                          <>
                            Next section <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              )
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
                <div className="les-section-nav">
                  <div>
                    {activeSectionIdx > 0 && (
                      <button
                        type="button"
                        className="ui-btn is-outline is-sm les-nav-btn"
                        onClick={handlePrevSection}
                        title="Previous section"
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`ui-btn is-sm les-nav-btn ${isLastSection ? 'is-gold' : 'is-primary'}`}
                    onClick={handleNextSection}
                  >
                    {isLastSection ? (
                      <>
                        <Flag size={14} /> Finish lesson (+50 XP)
                      </>
                    ) : (
                      <>
                        Next section <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* INLINE QUESTION SECTION */}
            {currentSection.type === 'question' && (
                <section className="ui-tile les-question">
                  <div className="ui-tile-head">
                    <span className="ui-chip is-gold">
                      <HelpCircle size={13} /> Quick check
                    </span>
                    {!feedback && <span className="ui-faint">Answer the question below</span>}
                </div>

                  <HtmlContent as="div" html={currentSection.questionText} className="les-question-text" />

                {currentSection.questionImage && (
                    <img src={currentSection.questionImage} alt="Anatomy Diagram" className="les-question-img" />
                  )}

                  <QuestionAnswer question={currentSection} value={selectedOpt} onChange={setSelectedOpt} correctIds={feedback?.correctOptions} disabled={!!feedback} />

                {!feedback ? (
                  <button
                      type="button"
                      className="ui-btn is-primary is-lg les-submit"
                    onClick={handleQuestionSubmit}
                    disabled={!selectedOpt.length}
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

                  <div className="les-section-nav">
                    <div>
                      {activeSectionIdx > 0 && (
                        <button
                          type="button"
                          className="ui-btn is-outline is-sm les-nav-btn"
                          onClick={handlePrevSection}
                          title="Previous section"
                        >
                          <ArrowLeft size={14} /> Previous
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`ui-btn is-sm les-nav-btn ${isLastSection ? 'is-gold' : 'is-primary'}`}
                      onClick={handleNextSection}
                    >
                      {isLastSection ? (
                        <>
                          <Flag size={14} /> Finish lesson (+50 XP)
                        </>
                      ) : (
                        <>
                          Next section <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
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
