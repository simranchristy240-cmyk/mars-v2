import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lock, Play, Search, Target, X } from 'lucide-react';

type Tier = 'basic' | 'plus' | 'premium';

interface CurriculumSidebarProps {
  courseTitle?: string;
  topics: any[];
  currentLessonId?: string;
  currentTopicId?: string;
  completedLessonIds: string[];
  activeSectionIdx: number;
  sectionCount: number;
  onOpenLesson: (lessonId: string) => void;
  onOpenPractice: (topicId: string, setId?: string) => void;
  onLocked: (tier?: Tier) => void;
  onHome: () => void;
  onClose: () => void;
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
        {value}
        <small>%</small>
      </span>
    </div>
  );
};

export const CurriculumSidebar: React.FC<CurriculumSidebarProps> = ({
  courseTitle,
  topics,
  currentLessonId,
  currentTopicId,
  completedLessonIds,
  activeSectionIdx,
  sectionCount,
  onOpenLesson,
  onOpenPractice,
  onLocked,
  onHome,
  onClose,
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
    if (lesson.isLocked) onLocked(lesson.accessTier || 'basic');
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
          <button type="button" className="cs-icon-btn" onClick={onClose} title="Hide curriculum">
            <X size={16} />
          </button>
        </div>

        <div className="cs-hero">
          <ProgressRing value={overall} />
          <div className="cs-hero-text">
            <span className="cs-eyebrow">Your journey</span>
            <h2 title={courseTitle}>{courseTitle || 'Anatomy'}</h2>
            <p>
              <strong>{doneCount}</strong> of {allLessons.length} lessons done
            </p>
          </div>
        </div>

        {upNext && (
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
          const isComplete = topicLessons.length > 0 && topicDone === topicLessons.length;

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
                  <span className="cs-topic-title">{topic.title}</span>
                  <span className="cs-topic-meta">
                    {topicDone}/{topicLessons.length} lessons
                    {topic.isFree && <em className="cs-free">Free</em>}
                  </span>
                  <span className="cs-topic-bar">
                    <span style={{ width: `${topicPct}%` }} />
                  </span>
                </span>
                <ChevronDown size={16} className="cs-chev" />
              </button>

              <div className="cs-topic-body">
                <div className="cs-topic-inner">
                  {lessons.length > 0 && (
                    <ol className="cs-timeline">
                      {lessons.map((l: any) => {
                        const active = l._id === currentLessonId;
                        const done = completed.has(String(l._id));
                        const state = l.isLocked ? 'is-locked' : active ? 'is-active' : done ? 'is-done' : '';
                        return (
                          <li key={l._id} className={`cs-lesson ${state}`}>
                            <button type="button" onClick={() => openLesson(l)}>
                              <span className="cs-node">
                                {l.isLocked ? (
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
                              {l.isLocked && <span className="cs-tier">{l.accessTier || 'basic'}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {practice.length > 0 && (
                    <div className="cs-drills">
                      {practice.map((ps: any) => (
                        <button
                          type="button"
                          key={ps._id}
                          className={`cs-drill${ps.isLocked ? ' is-locked' : ''}`}
                          onClick={() =>
                            ps.isLocked
                              ? onLocked(ps.accessTier || 'basic')
                              : onOpenPractice(topic._id, ps._id !== 'default' ? ps._id : undefined)
                          }
                        >
                          <span className="cs-drill-icon">{ps.isLocked ? <Lock size={14} /> : <Target size={15} />}</span>
                          <span className="cs-drill-text">
                            <span className="cs-drill-title">{ps.title}</span>
                            <span className="cs-drill-meta">{ps.questions?.length || 0} questions</span>
                          </span>
                          <ArrowRight size={14} className="cs-drill-go" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
