import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AccessTier } from '@mars/shared';
import api from '../../services/api';
import { CurriculumSidebar } from '../../components/lesson/CurriculumSidebar';
import { AuthorLessonView } from './builder/AuthorLessonView';
import { AuthorPracticeView } from './builder/AuthorPracticeView';
import { AuthorTestView } from './builder/AuthorTestView';
import { AuthorChapterView } from './builder/AuthorChapterView';
import { AuthorCourseOverview } from './builder/AuthorCourseOverview';
import {
  LessonSettingsModal,
  SectionModal,
  ChapterModal,
  TestSettingsModal,
  PracticeSettingsModal,
} from './builder/AuthorModals';
import { ArrowLeft, ExternalLink, Sparkles, X } from 'lucide-react';
import '../../styles/pages/lesson.css';
import '../../styles/pages/course-builder.css';

type BuilderSelection =
  | { kind: 'course' }
  | { kind: 'topic'; id: string }
  | { kind: 'lesson'; id: string; topicId: string; sectionIdx?: number }
  | { kind: 'practice'; topicId: string; setId?: string; questionIdx?: number }
  | { kind: 'test'; id: string; questionIdx?: number };

type ModalState =
  | null
  | { type: 'lesson-settings'; lesson: any }
  | { type: 'section-edit'; section: any; parentId: string; parentType: 'lesson' | 'practice' | 'test'; order: number }
  | { type: 'section-new'; parentId: string; parentType: 'lesson' | 'practice' | 'test'; order: number; initialType?: 'video' | 'text' | 'question' }
  | { type: 'topic-settings'; topic?: any }
  | { type: 'practice-settings'; topicId: string; setId?: string; title: string; accessTier?: AccessTier }
  | { type: 'test-settings'; test?: any };

export const CourseBuilder: React.FC = () => {
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // If no courseId in params, get all courses and pick the first
  const { data: coursesListRes } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => api.get('/courses'),
    enabled: !routeCourseId,
  });

  const firstCourseId = coursesListRes?.data?.data?.[0]?._id;
  const courseId = routeCourseId || firstCourseId;

  useEffect(() => {
    if (!routeCourseId && firstCourseId) {
      navigate(`/admin/builder/${firstCourseId}`, { replace: true });
    }
  }, [routeCourseId, firstCourseId, navigate]);

  const { data: treeRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-course-tree', courseId],
    queryFn: () => api.get(`/courses/admin/${courseId}`),
    enabled: !!courseId,
  });

  const course = treeRes?.data?.data?.course;
  const topics = course?.topics || [];
  const tests = course?.tests || course?.testSeries || [];

  const [selection, setSelection] = useState<BuilderSelection>({ kind: 'course' });
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [outlineOpen, setOutlineOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Initialize selection to first lesson of first topic
  useEffect(() => {
    if (hasInitialized.current || !course) return;
    for (const t of topics) {
      if (t.lessons && t.lessons.length > 0) {
        setSelection({ kind: 'lesson', id: t.lessons[0]._id, topicId: t._id, sectionIdx: 0 });
        hasInitialized.current = true;
        return;
      }
    }
    if (topics.length > 0) {
      setSelection({ kind: 'topic', id: topics[0]._id });
      hasInitialized.current = true;
    }
  }, [course, topics]);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-course-tree', courseId] });
    await refetch();
  };

  // Helper finders
  const findTopic = (id: string) => topics.find((t: any) => t._id === id);
  const findLesson = (id: string) => {
    for (const t of topics) {
      const l = (t.lessons || []).find((x: any) => x._id === id);
      if (l) return { lesson: l, topic: t };
    }
    return null;
  };
  const findTest = (id: string) => tests.find((t: any) => t._id === id);

  /* ─── Handlers for Lessons ─────────────────────────────────────────────── */
  const handleSaveLesson = async (data: { title: string; accessTier: AccessTier; isPublished: boolean }) => {
    if (!modalState || modalState.type !== 'lesson-settings') return;
    const lesson = modalState.lesson;
    if (lesson._id) {
      await api.put(`/lessons/lessons/${lesson._id}`, data);
      showToast('Lesson updated.');
    } else {
      const res = await api.post('/lessons/lessons', { ...data, topicId: lesson.topicId, order: 99 });
      const newLesson = res.data?.data;
      if (newLesson) {
        setSelection({ kind: 'lesson', id: newLesson._id, topicId: lesson.topicId, sectionIdx: 0 });
      }
      showToast('Lesson created.');
    }
    await invalidate();
  };

  /* ─── Handlers for Sections ────────────────────────────────────────────── */
  const handleSaveSection = async (payload: any) => {
    if (!modalState) return;
    if (modalState.type === 'section-edit' && modalState.section?._id) {
      await api.put(`/lessons/sections/${modalState.section._id}`, payload);
      showToast('Section saved.');
    } else if (modalState.type === 'section-new') {
      await api.post('/lessons/sections', payload);
      showToast('Section added.');
    }
    await invalidate();
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    try {
      await api.delete(`/lessons/sections/${sectionId}`);
      showToast('Section removed.');
      setActiveSectionIdx(0);
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete section');
    }
  };

  /* ─── Handlers for Chapters (Topics) ──────────────────────────────────── */
  const handleSaveTopic = async (data: { title: string; description: string; isFree: boolean; isPublished: boolean }) => {
    if (!modalState || modalState.type !== 'topic-settings') return;
    const topic = modalState.topic;
    if (topic?._id) {
      await api.put(`/lessons/topics/${topic._id}`, data);
      showToast('Chapter updated.');
    } else {
      const res = await api.post('/lessons/topics', { ...data, courseId, order: topics.length });
      const newTopic = res.data?.data;
      if (newTopic) {
        setSelection({ kind: 'topic', id: newTopic._id });
      }
      showToast('Chapter created.');
    }
    await invalidate();
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await api.delete(`/lessons/topics/${topicId}`);
      showToast('Chapter removed.');
      setSelection({ kind: 'course' });
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete chapter');
    }
  };

  /* ─── Handlers for Moving Chapters & Lessons ──────────────────────────── */
  const handleMoveTopic = async (topicId: string, direction: 'up' | 'down') => {
    const idx = topics.findIndex((t: any) => t._id === topicId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= topics.length) return;

    const newTopics = [...topics];
    const [moved] = newTopics.splice(idx, 1);
    newTopics.splice(targetIdx, 0, moved);

    try {
      await api.post('/lessons/topics/reorder', {
        courseId,
        topicIds: newTopics.map((t: any) => t._id),
      });
      showToast('Chapter moved.');
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to move chapter');
    }
  };

  const handleMoveLesson = async (topicId: string, lessonId: string, direction: 'up' | 'down') => {
    const topic = findTopic(topicId);
    if (!topic) return;
    const lessons = [...(topic.lessons || [])];
    const idx = lessons.findIndex((l: any) => l._id === lessonId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const [moved] = lessons.splice(idx, 1);
    lessons.splice(targetIdx, 0, moved);

    try {
      await api.post('/lessons/lessons/reorder', {
        topicId,
        lessonIds: lessons.map((l: any) => l._id),
      });
      showToast('Lesson moved.');
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to move lesson');
    }
  };

  /* ─── Handlers for Practice Sets ───────────────────────────────────────── */
  const handleSavePractice = async (data: { title: string; accessTier?: AccessTier }) => {
    if (!modalState || modalState.type !== 'practice-settings') return;
    const { topicId, setId } = modalState;
    const topic = findTopic(topicId);
    if (!topic) return;

    let updatedPracticeSets = [...(topic.practiceSets || [])];
    if (updatedPracticeSets.length > 0) {
      if (setId && setId !== 'default') {
        updatedPracticeSets = updatedPracticeSets.map((ps: any) =>
          ps._id === setId ? { ...ps, title: data.title, accessTier: data.accessTier || ps.accessTier } : ps
        );
      } else {
        updatedPracticeSets[0] = {
          ...updatedPracticeSets[0],
          title: data.title,
          accessTier: data.accessTier || updatedPracticeSets[0].accessTier,
        };
      }
    } else {
      const questionIds = (topic.practiceQuestions || []).map((q: any) => q._id || q);
      updatedPracticeSets = [
        {
          title: data.title,
          description: 'Topic interactive question bank',
          accessTier: data.accessTier || (topic.isFree ? 'free' : 'basic'),
          isPublished: true,
          order: 1,
          questions: questionIds,
        },
      ];
    }

    await api.put(`/lessons/topics/${topicId}`, { practiceSets: updatedPracticeSets });
    showToast('Practice set updated.');
    await invalidate();
  };

  /* ─── Handlers for Tests ───────────────────────────────────────────────── */
  const handleSaveTest = async (payload: any) => {
    if (!modalState || modalState.type !== 'test-settings') return;
    const test = modalState.test;
    if (test?._id) {
      await api.put(`/tests/${test._id}`, payload);
      showToast('Test settings updated.');
    } else {
      const res = await api.post('/tests', { ...payload, courseId });
      const newTest = res.data?.data;
      if (newTest) {
        setSelection({ kind: 'test', id: newTest._id, questionIdx: 0 });
      }
      showToast('Test created.');
    }
    await invalidate();
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await api.delete(`/tests/${testId}`);
      showToast('Test removed.');
      setSelection({ kind: 'course' });
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete test');
    }
  };

  /* ─── Handlers for Practice Questions ─────────────────────────────────── */
  const handleDeletePracticeQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question from practice set?')) return;
    try {
      await api.delete(`/lessons/sections/${questionId}`);
      showToast('Question deleted.');
      setActiveQuestionIdx(0);
      await invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete question');
    }
  };

  if (isLoading || !course) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading course builder…</p>
      </div>
    );
  }

  // Active item resolution
  const activeCurLesson = selection.kind === 'lesson' ? findLesson(selection.id)?.lesson : null;
  const activeCurTopic =
    selection.kind === 'lesson'
      ? findLesson(selection.id)?.topic
      : selection.kind === 'topic'
        ? findTopic(selection.id)
        : selection.kind === 'practice'
          ? findTopic(selection.topicId)
          : null;
  const activeCurTest = selection.kind === 'test' ? findTest(selection.id) : null;

  return (
    <div className="lesson-page-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* ─── LEFT CURRICULUM SIDEBAR (STUDENT PARITY + ADMIN CONTROLS) ───── */}
      <aside
        className={`lesson-sidebar-desktop ${outlineOpen ? 'drawer-open' : 'admin-outline-closed'}`}
        style={{ height: '100%', padding: '12px 0 12px 14px' }}
      >
        <CurriculumSidebar
          courseTitle={course.title}
          topics={topics}
          currentLessonId={activeCurLesson?._id}
          currentTopicId={activeCurTopic?._id}
          completedLessonIds={[]}
          activeSectionIdx={activeSectionIdx}
          sectionCount={activeCurLesson?.sections?.length || 0}
          onOpenLesson={(lessonId) => {
            const found = findLesson(lessonId);
            if (found) {
              setSelection({ kind: 'lesson', id: found.lesson._id, topicId: found.topic._id });
              setActiveSectionIdx(0);
            }
          }}
          onOpenPractice={(topicId, setId) => {
            setSelection({ kind: 'practice', topicId, setId, questionIdx: 0 });
            setActiveQuestionIdx(0);
          }}
          onEditPractice={(topicId, ps) => {
            setModalState({
              type: 'practice-settings',
              topicId,
              setId: ps?._id !== 'default' ? ps?._id : undefined,
              title: ps?.title || 'Topic practice',
              accessTier: ps?.accessTier || 'free',
            });
          }}
          onHome={() => navigate('/admin')}
          isAdmin={true}
          onEditCourse={() => setSelection({ kind: 'course' })}
          onAddTopic={() => setModalState({ type: 'topic-settings' })}
          onEditTopic={(topicId) => {
            const t = findTopic(topicId);
            if (t) setModalState({ type: 'topic-settings', topic: t });
          }}
          onMoveTopic={handleMoveTopic}
          onAddLesson={(topicId) => {
            setModalState({ type: 'lesson-settings', lesson: { topicId, isPublished: true, accessTier: 'free' } });
          }}
          onEditLesson={(lessonId) => {
            const found = findLesson(lessonId);
            if (found) setModalState({ type: 'lesson-settings', lesson: found.lesson });
          }}
          onMoveLesson={handleMoveLesson}
          tests={tests}
          currentTestId={activeCurTest?._id}
          onSelectTest={(testId) => {
            setSelection({ kind: 'test', id: testId, questionIdx: 0 });
            setActiveQuestionIdx(0);
          }}
          onEditTest={(testId) => {
            const t = findTest(testId);
            if (t) setModalState({ type: 'test-settings', test: t });
          }}
          onAddTest={() => setModalState({ type: 'test-settings' })}
        />
      </aside>

      {/* ─── MAIN CONTENT PANE ──────────────────────────────────────────── */}
      <main className="lesson-main-pane sidebar-open" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Floating Toast Notification */}
        {statusMsg && (
          <div
            style={{
              position: 'fixed',
              top: 54,
              right: 24,
              zIndex: 9999,
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              background: '#16a34a',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{statusMsg}</span>
            <button
              type="button"
              onClick={() => setStatusMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── RENDER EXACT STUDENT VIEW ACCORDING TO SELECTION ─────────── */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {selection.kind === 'lesson' && activeCurLesson && (
            <AuthorLessonView
              lesson={activeCurLesson}
              topicTitle={activeCurTopic?.title}
              activeSectionIdx={activeSectionIdx}
              onSelectSectionIdx={setActiveSectionIdx}
              onEditLesson={() => setModalState({ type: 'lesson-settings', lesson: activeCurLesson })}
              onEditSection={(section) =>
                setModalState({
                  type: 'section-edit',
                  section,
                  parentId: activeCurLesson._id,
                  parentType: 'lesson',
                  order: activeSectionIdx,
                })
              }
              onAddSection={(initialType) =>
                setModalState({
                  type: 'section-new',
                  parentId: activeCurLesson._id,
                  parentType: 'lesson',
                  order: (activeCurLesson.sections?.length || 0),
                  initialType,
                })
              }
              onDeleteSection={handleDeleteSection}
              onBackToOverview={() => {
                if (activeCurTopic) setSelection({ kind: 'topic', id: activeCurTopic._id });
                else setSelection({ kind: 'course' });
              }}
            />
          )}

          {selection.kind === 'practice' && activeCurTopic && (() => {
            const activePracticeSet =
              (activeCurTopic.practiceSets || []).find((ps: any) => ps._id === selection.setId) ||
              (activeCurTopic.practiceSets || [])[0];
            const practiceTitle = activePracticeSet?.title || (activeCurTopic.practiceQuestions?.length ? 'Topic practice' : undefined);
            const practiceQuestions =
              activePracticeSet?.questions && activePracticeSet.questions.length > 0
                ? activePracticeSet.questions
                : activeCurTopic.practiceQuestions || [];

            return (
              <AuthorPracticeView
                topicTitle={activeCurTopic.title}
                practiceTitle={practiceTitle}
                questions={practiceQuestions}
                activeIdx={activeQuestionIdx}
                onSelectIdx={setActiveQuestionIdx}
                onEditPractice={() =>
                  setModalState({
                    type: 'practice-settings',
                    topicId: activeCurTopic._id,
                    setId: activePracticeSet?._id !== 'default' ? activePracticeSet?._id : undefined,
                    title: activePracticeSet?.title || 'Topic practice',
                    accessTier: activePracticeSet?.accessTier || 'free',
                  })
                }
                onAddQuestion={() =>
                  setModalState({
                    type: 'section-new',
                    parentId: activeCurTopic._id,
                    parentType: 'practice',
                    order: practiceQuestions.length,
                    initialType: 'question',
                  })
                }
                onEditQuestion={(question) =>
                  setModalState({
                    type: 'section-edit',
                    section: question,
                    parentId: activeCurTopic._id,
                    parentType: 'practice',
                    order: activeQuestionIdx,
                  })
                }
                onDeleteQuestion={handleDeletePracticeQuestion}
                onBackToOverview={() => setSelection({ kind: 'topic', id: activeCurTopic._id })}
              />
            );
          })()}

          {selection.kind === 'test' && activeCurTest && (
            <AuthorTestView
              test={activeCurTest}
              questions={
                activeCurTest.sections?.flatMap((s: any) =>
                  (s.questions || []).map((q: any) => (typeof q === 'object' ? { ...q, sectionName: s.name } : q))
                ) || []
              }
              activeIdx={activeQuestionIdx}
              onSelectIdx={setActiveQuestionIdx}
              onEditSettings={() => setModalState({ type: 'test-settings', test: activeCurTest })}
              onAddQuestion={() => {
                const targetSec = activeCurTest.sections?.[0];
                setModalState({
                  type: 'section-new',
                  parentId: targetSec?._id || activeCurTest._id,
                  parentType: 'test',
                  order: (targetSec?.questions?.length || 0),
                  initialType: 'question',
                });
              }}
              onEditQuestion={(question) =>
                setModalState({
                  type: 'section-edit',
                  section: question,
                  parentId: activeCurTest._id,
                  parentType: 'test',
                  order: activeQuestionIdx,
                })
              }
              onDeleteQuestion={async (questionId) => {
                if (!window.confirm('Delete question from this test?')) return;
                await api.delete(`/lessons/sections/${questionId}`);
                showToast('Question deleted.');
                setActiveQuestionIdx(0);
                await invalidate();
              }}
              onBackToOverview={() => setSelection({ kind: 'course' })}
            />
          )}

          {selection.kind === 'topic' && activeCurTopic && (
            <AuthorChapterView
              topic={activeCurTopic}
              onEditTopic={() => setModalState({ type: 'topic-settings', topic: activeCurTopic })}
              onAddLesson={() =>
                setModalState({
                  type: 'lesson-settings',
                  lesson: { topicId: activeCurTopic._id, isPublished: true, accessTier: 'free' },
                })
              }
              onSelectLesson={(lessonId) => {
                setSelection({ kind: 'lesson', id: lessonId, topicId: activeCurTopic._id });
                setActiveSectionIdx(0);
              }}
              onMoveLesson={(lessonId, direction) => handleMoveLesson(activeCurTopic._id, lessonId, direction)}
              onSelectPractice={() => {
                setSelection({ kind: 'practice', topicId: activeCurTopic._id });
                setActiveQuestionIdx(0);
              }}
              onAddPracticeQuestion={() =>
                setModalState({
                  type: 'section-new',
                  parentId: activeCurTopic._id,
                  parentType: 'practice',
                  order: (activeCurTopic.practiceQuestions?.length || 0),
                  initialType: 'question',
                })
              }
              onSelectTest={(testId) => {
                setSelection({ kind: 'test', id: testId });
                setActiveQuestionIdx(0);
              }}
              onAddTest={() => setModalState({ type: 'test-settings' })}
            />
          )}

          {selection.kind === 'course' && (
            <AuthorCourseOverview
              course={course}
              onEditCourse={() => {
                const title = prompt('Edit Course Title:', course.title);
                if (title && title.trim()) {
                  api.put(`/courses/${course._id}`, { title: title.trim() }).then(() => {
                    showToast('Course updated.');
                    invalidate();
                  });
                }
              }}
              onAddTopic={() => setModalState({ type: 'topic-settings' })}
              onSelectTopic={(topicId) => setSelection({ kind: 'topic', id: topicId })}
              onMoveTopic={handleMoveTopic}
            />
          )}
        </div>
      </main>

      {/* ─── AUTHORING MODALS (CLEAN & NON-INTRUSIVE) ───────────────────── */}
      {modalState?.type === 'lesson-settings' && (
        <LessonSettingsModal
          lesson={modalState.lesson}
          onClose={() => setModalState(null)}
          onSave={handleSaveLesson}
          onRefresh={invalidate}
        />
      )}

      {(modalState?.type === 'section-edit' || modalState?.type === 'section-new') && (
        <SectionModal
          section={modalState.type === 'section-edit' ? modalState.section : undefined}
          parentId={modalState.parentId}
          parentType={modalState.parentType}
          order={modalState.order}
          initialType={modalState.type === 'section-new' ? modalState.initialType : undefined}
          onClose={() => setModalState(null)}
          onSave={handleSaveSection}
          onDelete={
            modalState.type === 'section-edit' && modalState.section?._id
              ? () => handleDeleteSection(modalState.section._id)
              : undefined
          }
        />
      )}

      {modalState?.type === 'topic-settings' && (
        <ChapterModal
          topic={modalState.topic}
          onClose={() => setModalState(null)}
          onSave={handleSaveTopic}
          onDelete={
            modalState.topic?._id ? () => handleDeleteTopic(modalState.topic._id) : undefined
          }
        />
      )}

      {modalState?.type === 'practice-settings' && (
        <PracticeSettingsModal
          title={modalState.title}
          accessTier={modalState.accessTier}
          onClose={() => setModalState(null)}
          onSave={handleSavePractice}
        />
      )}

      {modalState?.type === 'test-settings' && (
        <TestSettingsModal
          test={modalState.test}
          onClose={() => setModalState(null)}
          onSave={handleSaveTest}
          onDelete={
            modalState.test?._id ? () => handleDeleteTest(modalState.test._id) : undefined
          }
        />
      )}
    </div>
  );
};
