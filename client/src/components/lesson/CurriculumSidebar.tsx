import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Edit3, FileQuestion, Lock, Play, Plus, Search, Target, X } from 'lucide-react';

type Tier = 'basic' | 'plus' | 'premium';

interface CurriculumSidebarProps {
  courseTitle?: string;
  topics: any[];
  currentLessonId?: string;
  currentTopicId?: string;
  completedLessonIds?: string[];
  activeSectionIdx?: number;
  sectionCount?: number;
  onOpenLesson: (lessonId: string) => void;
  onOpenPractice?: (topicId: string, setId?: string) => void;
  onLocked?: (tier?: Tier) => void;
  onHome: () => void;
  onClose?: () => void;
  // Admin builder extensions
  isAdmin?: boolean;
  onEditCourse?: () => void;
  onAddTopic?: () => void;
  onEditTopic?: (topicId: string) => void;
  onMoveTopic?: (topicId: string, direction: 'up' | 'down') => void;
  onAddLesson?: (topicId: string) => void;
  onEditLesson?: (lessonId: string, topicId: string) => void;
  onMoveLesson?: (topicId: string, lessonId: string, direction: 'up' | 'down') => void;
  onEditPractice?: (topicId: string, practiceSet?: any) => void;
  tests?: any[];
  currentTestId?: string;
  onSelectTest?: (testId: string) => void;
  onEditTest?: (testId: string) => void;
  onAddTest?: () => void;
}

const getPracticeSets = (topic: any) => {
  if (topic.practiceSets?.length) return topic.practiceSets;
  if (topic.practiceQuestions?.length) {
    return [
      {
        _id: 'default',
        title: 'Topic practice',
        accessTier: topic.isFree ? 'free' : 'basic',
        isLocked: topic.practiceQuestions.some((p: any) => p.isLocked),
        questions: topic.practiceQuestions,
      },
    ];
  }
  return [];
};

const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className="cs-ring" aria-label={`${value}% complete`}>
      <svg viewBox="0 0 56 56" width="56" height="56">
        <circle cx="28" cy="28" r={r} className="cs-ring-track" />
        <circle
          cx="28"
          cy="28"
          r={r}
          className="cs-ring-value"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <span className="cs-ring-label">
        <span className="cs-ring-num">{value}</span>
        <span className="cs-ring-pct">%</span>
      </span>
    </div>
  );
};

export const CurriculumSidebar: React.FC<CurriculumSidebarProps> = ({
  courseTitle,
  topics,
  currentLessonId,
  currentTopicId,
  completedLessonIds = [],
  activeSectionIdx = 0,
  sectionCount = 0,
  onOpenLesson,
  onOpenPractice,
  onLocked,
  onHome,
  onClose,
  isAdmin = false,
  onEditCourse,
  onAddTopic,
  onEditTopic,
  onMoveTopic,
  onAddLesson,
  onEditLesson,
  onMoveLesson,
  onEditPractice,
  tests,
  currentTestId,
  onSelectTest,
  onEditTest,
  onAddTest,
}) => {
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (currentTopicId) setOpenTopics((prev) => ({ ...prev, [currentTopicId]: true }));
  }, [currentTopicId]);

  const completed = useMemo(() => new Set(completedLessonIds.map(String)), [completedLessonIds]);

  const allLessons = useMemo(
    () => topics.flatMap((t: any) => (t.lessons || []).map((l: any) => ({ ...l, topicTitle: t.title }))),
    [topics]
  );
  const doneCount = allLessons.filter((l: any) => completed.has(String(l._id))).length;
  const overall = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  const upNext = useMemo(() => {
    const idx = allLessons.findIndex((l: any) => l._id === currentLessonId);
    return idx >= 0 ? allLessons[idx + 1] : undefined;
  }, [allLessons, currentLessonId]);

  const q = query.trim().toLowerCase();
  const visibleTopics = topics
    .map((topic: any, index: number) => {
      const lessons = topic.lessons || [];
      const practice = getPracticeSets(topic);
      if (!q) return { topic, index, lessons, practice };
      const topicMatch = topic.title?.toLowerCase().includes(q);
      return {
        topic,
        index,
        lessons: topicMatch ? lessons : lessons.filter((l: any) => l.title?.toLowerCase().includes(q)),
        practice: topicMatch ? practice : practice.filter((p: any) => p.title?.toLowerCase().includes(q)),
      };
    })
    .filter((t) => !q || t.lessons.length > 0 || t.practice.length > 0);

  const openLesson = (lesson: any) => {
    if (!isAdmin && lesson.isLocked && onLocked) onLocked(lesson.accessTier || 'basic');
    else onOpenLesson(lesson._id);
  };

  const sectionPct = sectionCount ? Math.round(((activeSectionIdx + 1) / sectionCount) * 100) : 0;

  return (
    <div className="cs">
      <header className="cs-head">
        <div className="cs-topbar">
          <button type="button" className="cs-ghost" onClick={onHome}>
            <ArrowLeft size={14} /> Home
          </button>
          {onClose && (
            <button type="button" className="cs-icon-btn" onClick={onClose} title="Hide curriculum">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="cs-hero">
          <ProgressRing value={overall} />
          <div className="cs-hero-text">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span className="cs-eyebrow">Your journey</span>
              {isAdmin && onEditCourse && (
                <button
                  type="button"
                  className="cs-hero-edit-btn"
                  onClick={onEditCourse}
                  title="Edit Course details"
                >
                  <Edit3 size={11} /> Edit Course
                </button>
              )}
            </div>
            <h2 title={courseTitle}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {courseTitle || 'Anatomy'}
              </span>
            </h2>
            <p>
              <strong>{doneCount}</strong> of {allLessons.length} lessons done
            </p>
          </div>
        </div>

        {!isAdmin && upNext && (
          <button type="button" className="cs-upnext" onClick={() => openLesson(upNext)}>
            <span className="cs-upnext-text">
              <span className="cs-upnext-label">Up next</span>
              <span className="cs-upnext-title">{upNext.title}</span>
            </span>
            <span className="cs-upnext-go">{upNext.isLocked ? <Lock size={14} /> : <ArrowRight size={16} />}</span>
          </button>
        )}

        <label className="cs-search">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a lesson" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </label>
      </header>

      <div className="cs-scroll curriculum-drawer-scroll">
        {visibleTopics.length === 0 && <div className="cs-empty">Nothing matches “{query}”.</div>}

        {visibleTopics.map(({ topic, index, lessons, practice }) => {
          const isCurrent = topic._id === currentTopicId;
          const isOpen = !!q || !!openTopics[topic._id];
          const topicLessons = topic.lessons || [];
          const topicDone = topicLessons.filter((l: any) => completed.has(String(l._id))).length;
          const topicPct = topicLessons.length ? Math.round((topicDone / topicLessons.length) * 100) : 0;
          const isComplete = !isAdmin && topicLessons.length > 0 && topicDone === topicLessons.length;

          return (
            <section
              key={topic._id || index}
              className={`cs-topic${isCurrent ? ' is-current' : ''}${isOpen ? ' is-open' : ''}${isComplete ? ' is-complete' : ''}`}
            >
              <button
                type="button"
                className="cs-topic-head"
                onClick={() => setOpenTopics((prev) => ({ ...prev, [topic._id]: !prev[topic._id] }))}
                aria-expanded={isOpen}
              >
                <span className="cs-topic-index">
                  {isComplete ? <Check size={15} strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
                </span>
                <span className="cs-topic-text">
                  <span className="cs-topic-title">
                    {topic.title}
                  </span>
                  <span className="cs-topic-meta">
                    {topicDone}/{topicLessons.length} lessons
                    {topic.isFree && <em className="cs-free">Free</em>}
                  </span>
                  <span className="cs-topic-bar">
                    <span style={{ width: `${topicPct || (topicLessons.length > 0 ? 100 : 0)}%` }} />
                  </span>
                </span>
                {isAdmin && (onEditTopic || onMoveTopic) && (
                  <span className="cs-topic-actions" onClick={(e) => e.stopPropagation()}>
                    {onMoveTopic && index > 0 && (
                      <button
                        type="button"
                        className="cs-icon-edit-btn"
                        onClick={() => onMoveTopic(topic._id, 'up')}
                        title="Move Chapter Up"
                        aria-label="Move Chapter Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                    )}
                    {onMoveTopic && index < visibleTopics.length - 1 && (
                      <button
                        type="button"
                        className="cs-icon-edit-btn"
                        onClick={() => onMoveTopic(topic._id, 'down')}
                        title="Move Chapter Down"
                        aria-label="Move Chapter Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    )}
                    {onEditTopic && (
                      <button
                        type="button"
                        className="cs-icon-edit-btn"
                        onClick={() => onEditTopic(topic._id)}
                        title="Edit Chapter / Topic"
                        aria-label="Edit Chapter / Topic"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    {onAddLesson && (
                      <button
                        type="button"
                        className="cs-icon-edit-btn is-add"
                        onClick={() => onAddLesson(topic._id)}
                        title="Add Lesson to this chapter"
                        aria-label="Add Lesson to this chapter"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </span>
                )}
                <ChevronDown size={16} className="cs-chev" />
              </button>

              <div className="cs-topic-body">
                <div className="cs-topic-inner">
                  {lessons.length > 0 && (
                    <ol className="cs-timeline">
                      {lessons.map((l: any, lIdx: number) => {
                        const active = l._id === currentLessonId;
                        const done = completed.has(String(l._id));
                        const state = !isAdmin && l.isLocked ? 'is-locked' : active ? 'is-active' : done ? 'is-done' : '';
                        return (
                          <li key={l._id} className={`cs-lesson ${state}`}>
                            <button type="button" onClick={() => openLesson(l)} className="cs-lesson-btn">
                              <span className="cs-node">
                                {!isAdmin && l.isLocked ? (
                                  <Lock size={11} />
                                ) : active ? (
                                  <Play size={10} fill="currentColor" />
                                ) : done ? (
                                  <Check size={12} strokeWidth={3} />
                                ) : null}
                              </span>
                              <span className="cs-lesson-text">
                                <span className="cs-lesson-title">{l.title}</span>
                                {active && (
                                  <span className="cs-now">
                                    <span className="cs-now-label">
                                      Part {activeSectionIdx + 1} of {sectionCount}
                                    </span>
                                    <span className="cs-now-bar">
                                      <span style={{ width: `${sectionPct}%` }} />
                                    </span>
                                  </span>
                                )}
                              </span>
                              {!isAdmin && l.isLocked && <span className="cs-tier">{l.accessTier || 'basic'}</span>}
                            </button>
                            {isAdmin && (onEditLesson || onMoveLesson) && (
                              <span className="cs-row-actions" onClick={(e) => e.stopPropagation()}>
                                {onMoveLesson && lIdx > 0 && (
                                  <button
                                    type="button"
                                    className="cs-row-act-btn"
                                    onClick={() => onMoveLesson(topic._id, l._id, 'up')}
                                    title="Move lesson up"
                                    aria-label="Move lesson up"
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                )}
                                {onMoveLesson && lIdx < lessons.length - 1 && (
                                  <button
                                    type="button"
                                    className="cs-row-act-btn"
                                    onClick={() => onMoveLesson(topic._id, l._id, 'down')}
                                    title="Move lesson down"
                                    aria-label="Move lesson down"
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                )}
                                {onEditLesson && (
                                  <button
                                    type="button"
                                    className="cs-row-act-btn is-edit"
                                    onClick={() => onEditLesson(l._id, topic._id)}
                                    title="Edit lesson details"
                                    aria-label="Edit lesson details"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                )}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {practice.length > 0 ? (
                    <div className="cs-drills">
                      {practice.map((ps: any) => (
                        <div key={ps._id} className="cs-lesson-row">
                          <button
                            type="button"
                            className={`cs-drill${!isAdmin && ps.isLocked ? ' is-locked' : ''}`}
                            onClick={() =>
                              !isAdmin && ps.isLocked
                                ? onLocked?.(ps.accessTier || 'basic')
                                : onOpenPractice?.(topic._id, ps._id !== 'default' ? ps._id : undefined)
                            }
                          >
                            <span className="cs-drill-icon">{!isAdmin && ps.isLocked ? <Lock size={14} /> : <Target size={15} />}</span>
                            <span className="cs-drill-text">
                              <span className="cs-drill-title">{ps.title}</span>
                              <span className="cs-drill-meta">{ps.questions?.length || 0} questions</span>
                            </span>
                            {!isAdmin && <ArrowRight size={14} className="cs-drill-go" />}
                          </button>
                          {isAdmin && (onEditPractice || onOpenPractice) && (
                            <button
                              type="button"
                              className="cs-row-edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditPractice) {
                                  onEditPractice(topic._id, ps);
                                } else if (onOpenPractice) {
                                  onOpenPractice(topic._id, ps._id !== 'default' ? ps._id : undefined);
                                }
                              }}
                              title="Edit practice name & settings"
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isAdmin && onOpenPractice ? (
                    <div style={{ padding: '6px 0 2px' }}>
                      <button
                        type="button"
                        className="cs-drill"
                        onClick={() => onOpenPractice(topic._id)}
                        style={{ borderStyle: 'dashed', opacity: 0.75 }}
                        title="Add practice questions to this chapter"
                      >
                        <span className="cs-drill-icon"><Plus size={14} /></span>
                        <span className="cs-drill-text">
                          <span className="cs-drill-title">Add Practice Questions</span>
                          <span className="cs-drill-meta">0 questions</span>
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}

        {isAdmin && tests && tests.length > 0 && (
          <div className="cs-tests-section">
            <div className="cs-tests-title">
              Assessments & Tests
            </div>
            {tests.map((test: any) => (
              <div key={test._id} className="cs-lesson-row">
                <button
                  type="button"
                  onClick={() => onSelectTest?.(test._id)}
                  className={`cs-lesson-btn cs-test-btn ${test._id === currentTestId ? 'is-active' : ''}`}
                >
                  <span className="cs-node" style={{ width: 22, height: 22 }}>
                    <FileQuestion size={12} />
                  </span>
                  <span className="cs-lesson-text">
                    <span className="cs-lesson-title">{test.title}</span>
                  </span>
                </button>
                {isAdmin && (onEditTest || onSelectTest) && (
                  <button
                    type="button"
                    className="cs-row-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditTest) {
                        onEditTest(test._id);
                      } else if (onSelectTest) {
                        onSelectTest(test._id);
                      }
                    }}
                    title="Edit test title & settings"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (onAddTopic || onAddTest) && (
        <div className="cs-admin-footer">
          {onAddTopic && (
            <button type="button" className="cs-admin-add-btn" onClick={onAddTopic} title="Add Chapter / Topic">
              <Plus size={13} /> Add Chapter
            </button>
          )}
          {onAddTest && (
            <button type="button" className="cs-admin-add-btn" onClick={onAddTest} title="Add Test">
              <Plus size={13} /> Add Test
            </button>
          )}
        </div>
      )}
    </div>
  );
};
