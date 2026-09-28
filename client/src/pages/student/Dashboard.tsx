import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Flame,
  Play,
  PlayCircle,
  FileText,
  HelpCircle,
  BookOpen,
  ClipboardList,
  Clock,
  Calendar,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Check,
  Target,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { TierUpgradeModal } from '../../components/TierUpgradeModal';
import { GoalSelectionModal } from '../../components/GoalSelectionModal';
import { EmptyState, ProgressBar, ProgressRing, TierChip } from '../../components/ui';
import '../../styles/pages/dashboard.css';

const XP_PER_LEVEL = 500;
const WEEK_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getTrackEmoji = (title?: string) => {
  if (!title) return '🎓';
  const lower = title.toLowerCase();
  if (lower.includes('mbbs')) return '🩺';
  if (lower.includes('bds')) return '🦷';
  if (lower.includes('ayush')) return '🌿';
  return '🔬';
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getPracticeSets = (topic: any) => {
  if (topic.practiceSets?.length) return topic.practiceSets;
  if (topic.practiceQuestions?.length) {
    return [
      {
        _id: 'default',
        title: 'Practice question bank',
        description: '',
        accessTier: topic.isFree ? 'free' : 'basic',
        isLocked: topic.practiceQuestions.some((p: any) => p.isLocked),
        questions: topic.practiceQuestions,
      },
    ];
  }
  return [];
};

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [curriculumTab, setCurriculumTab] = useState<'learn' | 'tests'>('learn');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradeTier, setTargetUpgradeTier] = useState<'basic' | 'plus' | 'premium' | undefined>();
  const [showGoalModal, setShowGoalModal] = useState(false);

  const { data: gamificationRes } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats'),
    enabled: !!user,
  });

  const { data: continueRes } = useQuery({
    queryKey: ['continue-learning'],
    queryFn: () => api.get('/progress/continue'),
    enabled: !!user,
  });

  const { data: myCourseRes, isLoading: courseLoading } = useQuery({
    queryKey: ['my-course', user?.selectedCourseId],
    queryFn: () => api.get('/courses/my/active'),
    enabled: !!user,
  });

  const stats = gamificationRes?.data?.data;
  const recentProgress = continueRes?.data?.data || [];
  const myCourseData = myCourseRes?.data?.data;
  const activeCourse = myCourseData?.course;
  const activeStudentTier: 'free' | 'basic' | 'plus' | 'premium' = myCourseData?.studentTier || 'free';
  const isCourseLocked = myCourseData?.isCourseLocked !== undefined ? myCourseData.isCourseLocked : user?.isCourseLocked;

  const { data: testsRes, isLoading: testsLoading } = useQuery({
    queryKey: ['course-tests', activeCourse?._id],
    queryFn: () => api.get(`/tests/course/${activeCourse._id}`),
    enabled: !!activeCourse?._id,
  });

  const { data: progressRes } = useQuery({
    queryKey: ['course-progress', activeCourse?._id],
    queryFn: () => api.get(`/progress/${activeCourse._id}`),
    enabled: !!activeCourse?._id,
  });

  const courseTests = testsRes?.data?.data || activeCourse?.tests || [];
  const topics: any[] = activeCourse?.topics || [];
  const completed = useMemo(
    () => new Set<string>((progressRes?.data?.data?.lessonsCompleted || []).map(String)),
    [progressRes]
  );

  const allLessons = useMemo(() => topics.flatMap((t: any) => t.lessons || []), [topics]);
  const doneLessons = allLessons.filter((l: any) => completed.has(String(l._id))).length;
  const coursePct = allLessons.length ? Math.round((doneLessons / allLessons.length) * 100) : 0;

  const resume = recentProgress[0];
  const resumeLessonId = resume?.lastActivity?.lessonId?._id || resume?.lastActivity?.lessonId;
  const firstOpenLesson = allLessons.find((l: any) => !l.isLocked && !completed.has(String(l._id)));

  const defaultTopicId =
    topics.find((t: any) => (t.lessons || []).some((l: any) => String(l._id) === String(resumeLessonId)))?._id ||
    topics.find((t: any) => (t.lessons || []).some((l: any) => !completed.has(String(l._id))))?._id ||
    topics[0]?._id;
  const selectedTopic = topics.find((t: any) => t._id === (selectedTopicId || defaultTopicId));

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const levelXp = xp % XP_PER_LEVEL;
  const levelPct = Math.round((levelXp / XP_PER_LEVEL) * 100);
  const streak = stats?.currentStreak ?? 0;
  const today = new Date().getDay();
  const week = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    return { letter: WEEK_LETTERS[dayIndex], active: 6 - i < streak, isToday: i === 6 };
  });

  const openUpgrade = (tier?: 'basic' | 'plus' | 'premium') => {
    setTargetUpgradeTier(tier);
    setShowUpgradeModal(true);
  };

  const openLesson = (lesson: any) => {
    if (lesson.isLocked) openUpgrade(lesson.accessTier || 'basic');
    else navigate(`/lesson/${lesson._id}`);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <StudentPageShell>
      <div className="ui-bento">
        {/* Hero */}
        <section className="ui-tile is-inverse span-8 dash-hero ui-rise" style={{ ['--i' as string]: 0 }}>
          <div className="ui-sunburst" aria-hidden="true" />
          <div className="dash-hero-top">
            <span className="ui-label">
              {getGreeting()} · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
            <h1 className="dash-hero-title">
              Hi {firstName}, <span>let’s keep going.</span>
            </h1>
          </div>

          {resume ? (
            <div className="dash-resume">
              <div className="ui-grow">
                <div className="ui-label">Continue where you left off</div>
                <div className="dash-resume-title ui-truncate">
                  {resume.lastActivity?.lessonId?.title || resume.courseId?.title || 'Your latest lesson'}
                </div>
                <div className="dash-resume-progress">
                  <ProgressBar value={resume.overallPercentage || 0} height={5} />
                  <span>{resume.overallPercentage || 0}%</span>
                </div>
              </div>
              <button
                type="button"
                className="ui-btn is-gold is-lg"
                onClick={() => (resumeLessonId ? navigate(`/lesson/${resumeLessonId}`) : navigate('/'))}
              >
                <Play size={16} fill="currentColor" /> Resume
              </button>
            </div>
          ) : firstOpenLesson ? (
            <div className="dash-resume">
              <div className="ui-grow">
                <div className="ui-label">Start here</div>
                <div className="dash-resume-title ui-truncate">{firstOpenLesson.title}</div>
              </div>
              <button type="button" className="ui-btn is-gold is-lg" onClick={() => openLesson(firstOpenLesson)}>
                <Play size={16} fill="currentColor" /> Start
              </button>
            </div>
          ) : !activeCourse && !courseLoading ? (
            <div className="dash-resume">
              <div className="ui-grow">
                <div className="ui-label">First step</div>
                <div className="dash-resume-title">Pick your preparation track</div>
              </div>
              <button type="button" className="ui-btn is-gold is-lg" onClick={() => setShowGoalModal(true)}>
                Choose track <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </section>

        {/* Streak */}
        <Link to="/achievements" className="ui-tile is-gold span-4 md-span-3 dash-streak ui-rise" style={{ ['--i' as string]: 1 }}>
          <div className="ui-row is-between">
            <span className="ui-label">Daily streak</span>
            <span className="dash-flame">
              <Flame size={18} fill="currentColor" />
            </span>
          </div>
          <div className="ui-metric">
            {streak}
            <small>{streak === 1 ? 'day' : 'days'}</small>
          </div>
          <div className="dash-week">
            {week.map((d, i) => (
              <div key={i} className={`dash-week-day${d.active ? ' is-active' : ''}${d.isToday ? ' is-today' : ''}`}>
                <span className="dash-week-dot">{d.active && <Check size={11} strokeWidth={3} />}</span>
                <span>{d.letter}</span>
              </div>
            ))}
          </div>
          {stats?.longestStreak ? <div className="ui-faint">Best run · {stats.longestStreak} days</div> : null}
        </Link>

        {/* Level */}
        <Link to="/achievements" className="ui-tile span-4 md-span-3 dash-level ui-rise" style={{ ['--i' as string]: 2 }}>
          <div className="ui-row is-nowrap" style={{ ['--gap' as string]: '18px' }}>
            <ProgressRing value={levelPct} size={84} stroke={8} color="var(--ui-gold)">
              <div className="dash-level-ring">
                <span>Lv</span>
                {level}
              </div>
            </ProgressRing>
            <div className="ui-grow">
              <div className="ui-label">Experience</div>
              <div className="ui-metric" style={{ fontSize: '2rem' }}>
                {xp.toLocaleString()}
                <small>XP</small>
              </div>
              <div className="ui-faint">
                {XP_PER_LEVEL - levelXp} XP to level {level + 1}
              </div>
            </div>
          </div>
          <ArrowUpRight size={18} className="dash-corner-arrow" />
        </Link>

        {/* Course progress */}
        <div className="ui-tile span-4 md-span-3 ui-rise" style={{ ['--i' as string]: 3 }}>
          <div className="ui-row is-between" style={{ marginBottom: 14 }}>
            <span className="ui-label">Course progress</span>
            <span className="ui-chip">{doneLessons}/{allLessons.length} lessons</span>
          </div>
          <div className="ui-metric">
            {coursePct}
            <small>%</small>
          </div>
          <div style={{ marginTop: 16 }}>
            <ProgressBar value={coursePct} height={8} />
          </div>
        </div>

        {/* Track */}
        <div className="ui-tile is-muted span-4 md-span-3 dash-track ui-rise" style={{ ['--i' as string]: 4 }}>
          {activeCourse ? (
            <>
              <div className="ui-row is-nowrap">
                <div className="ui-icon-box" style={{ ['--size' as string]: '46px', background: 'var(--ui-tile-bg)', fontSize: '1.35rem' }}>
                  {getTrackEmoji(activeCourse.title)}
                </div>
                <div className="ui-grow">
                  <div className="ui-label">Your track</div>
                  <div className="ui-title ui-truncate">{activeCourse.title}</div>
                </div>
              </div>
              <div className="ui-row" style={{ marginTop: 14 }}>
                <TierChip tier={activeStudentTier} />
                <span className="ui-faint">
                  {topics.length} modules · {courseTests.length} tests
                </span>
              </div>
              <div className="ui-row" style={{ marginTop: 16 }}>
                {activeStudentTier !== 'premium' && (
                  <button type="button" className="ui-btn is-primary is-sm" onClick={() => openUpgrade()}>
                    <Sparkles size={14} /> Upgrade
                  </button>
                )}
                {isCourseLocked ? (
                  <span className="ui-faint ui-row" style={{ ['--gap' as string]: '4px' }}>
                    <Lock size={12} /> Enrolled
                  </span>
                ) : (
                  <button type="button" className="ui-btn is-ghost is-sm" onClick={() => setShowGoalModal(true)}>
                    <RefreshCw size={13} /> Switch
                  </button>
                )}
              </div>
            </>
          ) : courseLoading ? (
            <div className="ui-skeleton" style={{ ['--h' as string]: '120px' }} />
          ) : (
            <EmptyState
              icon={<BookOpen size={24} />}
              title="No track yet"
              action={
                <button type="button" className="ui-btn is-primary is-sm" onClick={() => setShowGoalModal(true)}>
                  Choose track
                </button>
              }
            />
          )}
        </div>

        {/* Curriculum */}
        {activeCourse && (
          <section className="ui-tile span-12 dash-curriculum-tile ui-rise" style={{ ['--i' as string]: 5 }}>
            <div className="ui-tile-head" style={{ flexWrap: 'wrap' }}>
              <div>
                <h2 className="ui-section-title">Your curriculum</h2>
                <p className="ui-faint" style={{ marginTop: 2 }}>
                  Learn module by module, then test yourself.
                </p>
              </div>
              <div className="ui-segmented" role="tablist">
                <button
                  type="button"
                  className={curriculumTab === 'learn' ? 'is-active' : ''}
                  onClick={() => setCurriculumTab('learn')}
                >
                  <BookOpen size={15} /> Learn <span className="ui-count">{topics.length}</span>
                </button>
                <button
                  type="button"
                  className={curriculumTab === 'tests' ? 'is-active' : ''}
                  onClick={() => setCurriculumTab('tests')}
                >
                  <ClipboardList size={15} /> Tests <span className="ui-count">{courseTests.length}</span>
                </button>
              </div>
            </div>

            {curriculumTab === 'learn' &&
              (topics.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={24} />}
                  title="Modules are on the way"
                  text="The curriculum for this track is being prepared."
                />
              ) : (
                <div className="dash-curriculum">
                  <div className="dash-modules" role="tablist">
                    {topics.map((topic: any, index: number) => {
                      const lessons = topic.lessons || [];
                      const done = lessons.filter((l: any) => completed.has(String(l._id))).length;
                      const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
                      const isSelected = selectedTopic?._id === topic._id;
                      const isComplete = lessons.length > 0 && done === lessons.length;
                      return (
                        <button
                          type="button"
                          key={topic._id || index}
                          className={`dash-module${isSelected ? ' is-selected' : ''}${isComplete ? ' is-complete' : ''}`}
                          onClick={() => setSelectedTopicId(topic._id)}
                        >
                          <span className="dash-module-index">
                            {isComplete ? <Check size={15} strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="ui-grow">
                            <span className="dash-module-title ui-clamp-2">{topic.title}</span>
                            <span className="dash-module-meta">
                              {done}/{lessons.length} lessons
                              {topic.isFree && activeStudentTier === 'free' && <em>Free</em>}
                            </span>
                            <ProgressBar value={pct} height={3} tone={isComplete ? 'success' : undefined} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTopic && (
                    <div className="dash-module-detail" key={selectedTopic._id}>
                      <div className="ui-label">
                        Module {String(topics.findIndex((t: any) => t._id === selectedTopic._id) + 1).padStart(2, '0')}
                      </div>
                      <h3 className="ui-title-lg" style={{ marginTop: 6 }}>
                        {selectedTopic.title}
                      </h3>
                      {selectedTopic.description && (
                        <p className="ui-muted" style={{ marginTop: 8, maxWidth: 640 }}>
                          {selectedTopic.description.replace(/<[^>]+>/g, '')}
                        </p>
                      )}

                      <div className="ui-list" style={{ marginTop: 18 }}>
                        {(selectedTopic.lessons || []).length === 0 && (
                          <p className="ui-faint">No lessons in this module yet.</p>
                        )}
                        {(selectedTopic.lessons || []).map((lesson: any) => {
                          const isLocked = !!lesson.isLocked;
                          const isDone = completed.has(String(lesson._id));
                          const icon = isLocked ? (
                            <Lock size={16} />
                          ) : isDone ? (
                            <Check size={17} strokeWidth={3} />
                          ) : lesson.type === 'notes' ? (
                            <FileText size={17} />
                          ) : lesson.type === 'quiz' ? (
                            <HelpCircle size={17} />
                          ) : (
                            <PlayCircle size={17} />
                          );
                          return (
                            <button
                              type="button"
                              key={lesson._id}
                              className={`ui-list-item is-interactive dash-lesson${isLocked ? ' is-locked' : ''}`}
                              onClick={() => openLesson(lesson)}
                            >
                              <span className={`ui-icon-box${isDone ? ' is-success' : ''}`} style={{ ['--size' as string]: '40px' }}>
                                {icon}
                              </span>
                              <span className="ui-grow">
                                <span className="ui-list-title ui-truncate" style={{ display: 'block' }}>
                                  {lesson.title}
                                </span>
                                <span className="ui-list-meta" style={{ display: 'block' }}>
                                  {isDone ? 'Completed' : lesson.duration ? `${Math.round(lesson.duration / 60)} min` : 'Lesson'}
                                </span>
                              </span>
                              {isLocked ? (
                                <TierChip tier={lesson.accessTier || 'basic'} />
                              ) : (
                                <span className="dash-lesson-go">
                                  <ArrowRight size={16} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {getPracticeSets(selectedTopic).length > 0 && (
                        <>
                          <div className="ui-label" style={{ margin: '22px 0 12px' }}>
                            Practice
                          </div>
                          <div className="ui-grid" style={{ ['--min' as string]: '220px', ['--gap' as string]: '10px' }}>
                            {getPracticeSets(selectedTopic).map((ps: any, psIdx: number) => {
                              const isLocked = !!ps.isLocked;
                              const qCount = ps.questions?.length || 0;
                              return (
                                <button
                                  type="button"
                                  key={ps._id || psIdx}
                                  className="ui-tile is-muted is-compact is-interactive dash-drill"
                                  onClick={() => {
                                    if (isLocked) openUpgrade(ps.accessTier || 'basic');
                                    else
                                      navigate(
                                        ps._id && ps._id !== 'default'
                                          ? `/practice/topic/${selectedTopic._id}/set/${ps._id}`
                                          : `/practice/topic/${selectedTopic._id}`
                                      );
                                  }}
                                >
                                  <div className="ui-row is-between is-nowrap">
                                    <span className={`ui-icon-box ${isLocked ? '' : 'is-gold'}`} style={{ ['--size' as string]: '36px', background: isLocked ? 'var(--ui-tile-bg)' : undefined }}>
                                      {isLocked ? <Lock size={15} /> : <Target size={17} />}
                                    </span>
                                    {isLocked ? <TierChip tier={ps.accessTier || 'basic'} /> : <ArrowUpRight size={16} className="dash-drill-go" />}
                                  </div>
                                  <div className="ui-list-title ui-truncate" style={{ marginTop: 12 }}>
                                    {ps.title}
                                  </div>
                                  <div className="ui-list-meta">{qCount > 0 ? `${qCount} questions` : 'Practice drill'}</div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {curriculumTab === 'tests' &&
              (testsLoading ? (
                <div className="ui-grid" style={{ ['--min' as string]: '280px' }}>
                  <div className="ui-skeleton" />
                  <div className="ui-skeleton" />
                </div>
              ) : courseTests.length === 0 ? (
                <EmptyState
                  icon={<FileSpreadsheet size={24} />}
                  title="No tests scheduled yet"
                  text="Timed test series for this course will show up here."
                />
              ) : (
                <div className="ui-grid" style={{ ['--min' as string]: '300px' }}>
                  {courseTests.map((test: any) => {
                    const now = new Date();
                    const start = test.startTime ? new Date(test.startTime) : null;
                    const end = test.endTime ? new Date(test.endTime) : null;
                    const isUpcoming = start ? now < start : false;
                    const isOpen = (!start || now >= start) && (!end || now <= end);
                    const isLocked = !!test.isLocked;

                    const status = test.hasAttempted
                      ? { label: 'Completed', tone: 'is-success' }
                      : isOpen
                      ? { label: 'Live now', tone: 'is-gold' }
                      : isUpcoming
                      ? { label: 'Upcoming', tone: '' }
                      : { label: 'Ended', tone: 'is-outline' };

                    return (
                      <div key={test._id} className="ui-tile is-muted dash-test">
                        <div className="ui-row is-between">
                          <span className={`ui-chip ${status.tone}`}>
                            {isOpen && !test.hasAttempted && <span className="ui-dot" />}
                            {status.label}
                          </span>
                          <TierChip tier={test.accessTier || 'free'} />
                        </div>
                        <h3 className="ui-title" style={{ marginTop: 14 }}>
                          {test.title}
                        </h3>
                        <p className="ui-faint ui-clamp-2" style={{ marginTop: 4 }}>
                          {test.description || 'Timed exam with negative marking and instant analysis.'}
                        </p>
                        <div className="dash-test-meta">
                          <span>
                            <Clock size={13} /> {test.duration || 60} min
                          </span>
                          {test.totalMarks && (
                            <span>
                              <CheckCircle2 size={13} /> {test.totalMarks} marks
                            </span>
                          )}
                          {start && (
                            <span>
                              <Calendar size={13} /> {start.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 18 }}>
                          {test.hasAttempted ? (
                            <button type="button" className="ui-btn is-outline is-block" onClick={() => navigate(`/tests/${test._id}/report`)}>
                              View report &amp; rank
                            </button>
                          ) : isLocked ? (
                            <button type="button" className="ui-btn is-block" onClick={() => openUpgrade(test.accessTier || 'basic')}>
                              <Lock size={14} /> Unlock test
                            </button>
                          ) : isOpen ? (
                            <button type="button" className="ui-btn is-primary is-block" onClick={() => navigate(`/tests/${test._id}/attempt`)}>
                              Start test <ArrowRight size={15} />
                            </button>
                          ) : (
                            <button type="button" className="ui-btn is-block" disabled>
                              {isUpcoming ? 'Opens soon' : 'Test ended'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </section>
        )}
      </div>

      <TierUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        course={activeCourse}
        currentTier={activeStudentTier}
        targetTier={targetUpgradeTier}
      />
      <GoalSelectionModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />
    </StudentPageShell>
  );
};
