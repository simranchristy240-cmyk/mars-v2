import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileQuestion,
  Layers,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import {
  SectionEditor,
  SectionFormValues,
  emptySectionForm,
  formToPayload,
  sectionToForm,
  SectionType,
} from './SectionEditor';
import { RichTextEditor, stripHtml } from '../../components/RichTextEditor';

type Selection =
  | { kind: 'course' }
  | { kind: 'topic'; id: string }
  | { kind: 'lesson'; id: string; topicId: string }
  | { kind: 'section'; id: string; parentKind: 'lesson' | 'practice' | 'test'; parentId: string }
  | { kind: 'practice-root'; topicId: string }
  | { kind: 'test'; id: string }
  | { kind: 'new-section'; parentKind: 'lesson' | 'practice' | 'test'; parentId: string; type?: SectionType }
  | { kind: 'new-topic' }
  | { kind: 'new-lesson'; topicId: string }
  | { kind: 'new-test' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

const primaryBtn: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent)',
  color: 'var(--on-accent)',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  ...primaryBtn,
  background: 'var(--danger, #c0392b)',
};

const ghostBtn: React.CSSProperties = {
  ...primaryBtn,
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
};

const confirmDelete = (label: string) =>
  window.confirm(
    `Remove ${label}? Contents under this item may be permanently lost and cannot be recovered.`
  );

export const CourseBuilder: React.FC = () => {
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!routeCourseId;

  const [selection, setSelection] = useState<Selection>({ kind: 'course' });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ course: true, tests: true });
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Course form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState('999');
  const [coursePublished, setCoursePublished] = useState(true);

  // Topic form
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicFree, setTopicFree] = useState(false);
  const [topicPublished, setTopicPublished] = useState(true);

  // Lesson form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonPublished, setLessonPublished] = useState(true);

  // Test form
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testDuration, setTestDuration] = useState('30');
  const [testStart, setTestStart] = useState('');
  const [testEnd, setTestEnd] = useState('');
  const [testTotalMarks, setTestTotalMarks] = useState('10');
  const [testPassing, setTestPassing] = useState('6');
  const [testNegative, setTestNegative] = useState(false);
  const [testPublished, setTestPublished] = useState(false);

  // Section form
  const [sectionForm, setSectionForm] = useState<SectionFormValues>(emptySectionForm('video'));

  const courseId = routeCourseId || null;

  const { data: treeRes, isLoading } = useQuery({
    queryKey: ['admin-course-tree', courseId],
    queryFn: () => api.get(`/courses/admin/${courseId}`),
    enabled: !!courseId,
  });

  const course = treeRes?.data?.data?.course;
  const topics = course?.topics || [];
  const tests = course?.tests || course?.testSeries || [];

  const findTopic = (id: string) => topics.find((t: any) => t._id === id);
  const findLesson = (id: string) => {
    for (const t of topics) {
      const l = (t.lessons || []).find((x: any) => x._id === id);
      if (l) return { lesson: l, topic: t };
    }
    return null;
  };
  const findSection = (id: string) => {
    for (const t of topics) {
      for (const l of t.lessons || []) {
        const s = (l.sections || []).find((x: any) => x._id === id);
        if (s) return { section: s, parentKind: 'lesson' as const, parentId: l._id };
      }
      const p = (t.practiceQuestions || []).find((x: any) => x._id === id);
      if (p) return { section: p, parentKind: 'practice' as const, parentId: t._id };
    }
    for (const test of tests) {
      for (const sec of test.sections || []) {
        const q = (sec.questions || []).find((x: any) => x._id === id || x === id);
        if (q && typeof q === 'object') {
          return { section: q, parentKind: 'test' as const, parentId: test._id };
        }
      }
    }
    return null;
  };
  const findTest = (id: string) => tests.find((t: any) => t._id === id);

  useEffect(() => {
    if (!course) return;
    setCourseTitle(course.title || '');
    setCourseDesc(course.description || '');
    setCoursePrice(String((course.price || 0) / 100));
    setCoursePublished(!!course.isPublished);
  }, [course?._id]);

  useEffect(() => {
    if (selection.kind === 'topic') {
      const t = findTopic(selection.id);
      if (t) {
        setTopicTitle(t.title || '');
        setTopicDesc(t.description || '');
        setTopicFree(!!t.isFree);
        setTopicPublished(t.isPublished !== false);
      }
    } else if (selection.kind === 'new-topic') {
      setTopicTitle('');
      setTopicDesc('');
      setTopicFree(false);
      setTopicPublished(true);
    } else if (selection.kind === 'lesson') {
      const found = findLesson(selection.id);
      if (found) {
        setLessonTitle(found.lesson.title || '');
        setLessonPublished(found.lesson.isPublished !== false);
      }
    } else if (selection.kind === 'new-lesson') {
      setLessonTitle('');
      setLessonPublished(true);
    } else if (selection.kind === 'test') {
      const t = findTest(selection.id);
      if (t) {
        setTestTitle(t.title || '');
        setTestDesc(t.description || '');
        setTestDuration(String(t.duration || 30));
        setTestStart(t.startTime ? new Date(t.startTime).toISOString().slice(0, 16) : '');
        setTestEnd(t.endTime ? new Date(t.endTime).toISOString().slice(0, 16) : '');
        setTestTotalMarks(String(t.totalMarks || 0));
        setTestPassing(String(t.passingMarks || 0));
        setTestNegative(!!t.negativeMarkingEnabled);
        setTestPublished(!!t.isPublished);
      }
    } else if (selection.kind === 'new-test') {
      const now = new Date();
      const later = new Date(Date.now() + 7 * 86400000);
      setTestTitle('');
      setTestDesc('');
      setTestDuration('30');
      setTestStart(now.toISOString().slice(0, 16));
      setTestEnd(later.toISOString().slice(0, 16));
      setTestTotalMarks('10');
      setTestPassing('6');
      setTestNegative(false);
      setTestPublished(false);
    } else if (selection.kind === 'section') {
      const found = findSection(selection.id);
      if (found) setSectionForm(sectionToForm(found.section));
    } else if (selection.kind === 'new-section') {
      setSectionForm(emptySectionForm(selection.type || (selection.parentKind === 'lesson' ? 'video' : 'question')));
    }
  }, [selection, course]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-course-tree', courseId] });
    await queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const publishBadge = (published: boolean) =>
    published ? null : (
      <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 700 }}>HIDDEN</span>
    );

  // --- Create course (no id yet) ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await api.post('/courses', {
        title: courseTitle,
        description: courseDesc,
        price: parseInt(coursePrice, 10) * 100,
        isPublished: coursePublished,
      });
      const id = res.data.data._id;
      setStatusMsg('Course created.');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      navigate(`/admin/builder/${id}`, { replace: true });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return handleCreateCourse(e);
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}`, {
        title: courseTitle,
        description: courseDesc,
        price: parseInt(coursePrice, 10) * 100,
        isPublished: coursePublished,
      });
      setStatusMsg('Course details saved.');
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    try {
      if (selection.kind === 'new-topic') {
        const res = await api.post('/lessons/topics', {
          courseId,
          title: topicTitle,
          description: topicDesc,
          isFree: topicFree,
          isPublished: topicPublished,
          order: topics.length + 1,
        });
        setStatusMsg('Topic added.');
        setExpanded((p) => ({ ...p, [`topic-${res.data.data._id}`]: true }));
        setSelection({ kind: 'topic', id: res.data.data._id });
      } else if (selection.kind === 'topic') {
        await api.put(`/lessons/topics/${selection.id}`, {
          title: topicTitle,
          description: topicDesc,
          isFree: topicFree,
          isPublished: topicPublished,
        });
        setStatusMsg('Topic saved.');
      }
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirmDelete('this topic and all its lessons, practice questions, and content')) return;
    try {
      await api.delete(`/lessons/topics/${id}`);
      setSelection({ kind: 'course' });
      setStatusMsg('Topic removed.');
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete topic');
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    try {
      if (selection.kind === 'new-lesson') {
        const topic = findTopic(selection.topicId);
        const res = await api.post('/lessons/lessons', {
          topicId: selection.topicId,
          courseId,
          title: lessonTitle,
          isPublished: lessonPublished,
          order: (topic?.lessons?.length || 0) + 1,
        });
        setStatusMsg('Lesson added.');
        setExpanded((p) => ({ ...p, [`lesson-${res.data.data._id}`]: true }));
        setSelection({ kind: 'lesson', id: res.data.data._id, topicId: selection.topicId });
      } else if (selection.kind === 'lesson') {
        await api.put(`/lessons/lessons/${selection.id}`, {
          title: lessonTitle,
          isPublished: lessonPublished,
        });
        setStatusMsg('Lesson saved.');
      }
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirmDelete('this lesson and all its videos/questions')) return;
    try {
      await api.delete(`/lessons/lessons/${id}`);
      setSelection({ kind: 'course' });
      setStatusMsg('Lesson removed.');
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete lesson');
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selection.kind === 'new-section') {
        let order = 1;
        if (selection.parentKind === 'lesson') {
          const found = findLesson(selection.parentId);
          order = (found?.lesson.sections?.length || 0) + 1;
        } else if (selection.parentKind === 'practice') {
          const t = findTopic(selection.parentId);
          order = (t?.practiceQuestions?.length || 0) + 1;
        } else {
          const t = findTest(selection.parentId);
          order =
            (t?.sections || []).reduce(
              (n: number, s: any) => n + (s.questions?.length || 0),
              0
            ) + 1;
        }
        const payload = formToPayload(sectionForm, selection.parentId, selection.parentKind, order);
        const res = await api.post('/lessons/sections', payload);
        setStatusMsg('Content added.');
        setSelection({
          kind: 'section',
          id: res.data.data._id,
          parentKind: selection.parentKind,
          parentId: selection.parentId,
        });
      } else if (selection.kind === 'section') {
        const payload = formToPayload(sectionForm, selection.parentId, selection.parentKind, 1);
        delete payload.parentId;
        delete payload.parentType;
        delete payload.order;
        await api.put(`/lessons/sections/${selection.id}`, payload);
        setStatusMsg('Content saved.');
      }
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string, fromTest = false) => {
    if (!confirmDelete('this item')) return;
    try {
      await api.delete(`/lessons/sections/${id}${fromTest ? '?fromTest=true' : ''}`);
      setSelection({ kind: 'course' });
      setStatusMsg('Item removed.');
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    try {
      const payload = {
        courseId,
        title: testTitle,
        description: testDesc,
        duration: parseInt(testDuration, 10) || 30,
        startTime: testStart ? new Date(testStart).toISOString() : new Date().toISOString(),
        endTime: testEnd ? new Date(testEnd).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        totalMarks: parseInt(testTotalMarks, 10) || 0,
        passingMarks: parseInt(testPassing, 10) || 0,
        negativeMarkingEnabled: testNegative,
        isPublished: testPublished,
      };
      if (selection.kind === 'new-test') {
        const res = await api.post('/tests', payload);
        setStatusMsg('Test added.');
        setExpanded((p) => ({ ...p, [`test-${res.data.data._id}`]: true }));
        setSelection({ kind: 'test', id: res.data.data._id });
      } else if (selection.kind === 'test') {
        await api.put(`/tests/${selection.id}`, payload);
        setStatusMsg('Test saved.');
      }
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirmDelete('this test and its owned questions')) return;
    try {
      await api.delete(`/tests/${id}`);
      setSelection({ kind: 'course' });
      setStatusMsg('Test removed.');
      await invalidate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete test');
    }
  };

  const sectionLabel = (s: any) => {
    if (s.title) return s.title;
    if (s.type === 'video') return `Video ${s.vimeoVideoId || ''}`.trim();
    if (s.type === 'question') return stripHtml(s.questionText || '').slice(0, 40) || 'Question';
    return stripHtml(s.text || '').slice(0, 40) || 'Text section';
  };

  const treeNodeStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    textAlign: 'left',
    padding: '6px 8px',
    borderRadius: 8,
    border: 'none',
    background: active ? 'var(--accent-light, rgba(0,0,0,0.06))' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-primary)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.82rem',
    cursor: 'pointer',
  });

  // Create-only mode (no course yet)
  if (!isEditMode) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 640 }}>
        <button
          onClick={() => navigate('/admin')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', marginBottom: 16 }}
        >
          <ArrowLeft size={18} /> Admin Dashboard
        </button>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Create New Course</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
          Set course details, then manage topics, lessons, banks, and tests in the tree editor.
        </p>
        <form onSubmit={handleCreateCourse} className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
          <CourseFields
            title={courseTitle}
            setTitle={setCourseTitle}
            desc={courseDesc}
            setDesc={setCourseDesc}
            price={coursePrice}
            setPrice={setCoursePrice}
            published={coursePublished}
            setPublished={setCoursePublished}
          />
          <button type="submit" style={{ ...primaryBtn, width: '100%', marginTop: 8 }} disabled={saving}>
            {saving ? 'Creating…' : 'Create Course & Open Editor'}
          </button>
        </form>
      </div>
    );
  }

  if (isLoading || !course) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading course editor…</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
      {/* LEFT OUTLINE */}
      <aside className="glass-card" style={{ padding: 16, borderRadius: 'var(--radius-md)', position: 'sticky', top: 88, maxHeight: 'calc(100vh - 110px)', overflow: 'auto' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} /> Dashboard
        </button>

        <h3 style={{ fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="var(--accent)" /> Course Outline
        </h3>

        <button type="button" style={treeNodeStyle(selection.kind === 'course')} onClick={() => setSelection({ kind: 'course' })}>
          <BookOpen size={14} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</span>
          {publishBadge(!!course.isPublished)}
        </button>

        <div style={{ marginTop: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topics</span>
          <button
            type="button"
            onClick={() => setSelection({ kind: 'new-topic' })}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 2 }}
            title="Add topic"
          >
            <Plus size={14} />
          </button>
        </div>

        {topics.map((t: any) => (
          <div key={t._id} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => toggleExpand(`topic-${t._id}`)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>
                {expanded[`topic-${t._id}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                type="button"
                style={treeNodeStyle(selection.kind === 'topic' && selection.id === t._id)}
                onClick={() => {
                  setExpanded((p) => ({ ...p, [`topic-${t._id}`]: true }));
                  setSelection({ kind: 'topic', id: t._id });
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                {t.isFree && <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>FREE</span>}
                {publishBadge(t.isPublished !== false)}
              </button>
            </div>

            {expanded[`topic-${t._id}`] && (
              <div style={{ paddingLeft: 18 }}>
                {(t.lessons || []).map((l: any) => (
                  <div key={l._id}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button type="button" onClick={() => toggleExpand(`lesson-${l._id}`)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {expanded[`lesson-${l._id}`] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <button
                        type="button"
                        style={treeNodeStyle(selection.kind === 'lesson' && selection.id === l._id)}
                        onClick={() => setSelection({ kind: 'lesson', id: l._id, topicId: t._id })}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                        {publishBadge(l.isPublished !== false)}
                      </button>
                    </div>
                    {expanded[`lesson-${l._id}`] && (
                      <div style={{ paddingLeft: 16 }}>
                        {(l.sections || []).map((s: any) => (
                          <button
                            key={s._id}
                            type="button"
                            style={treeNodeStyle(selection.kind === 'section' && selection.id === s._id)}
                            onClick={() => setSelection({ kind: 'section', id: s._id, parentKind: 'lesson', parentId: l._id })}
                          >
                            {s.type === 'video' ? <Video size={12} /> : <FileQuestion size={12} />}
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sectionLabel(s)}</span>
                            {publishBadge(s.isPublished !== false)}
                          </button>
                        ))}
                        <button
                          type="button"
                          style={{ ...treeNodeStyle(false), color: 'var(--accent)', fontSize: '0.75rem' }}
                          onClick={() => setSelection({ kind: 'new-section', parentKind: 'lesson', parentId: l._id })}
                        >
                          <Plus size={12} /> Add content
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  style={{ ...treeNodeStyle(selection.kind === 'new-lesson' && selection.topicId === t._id), color: 'var(--accent)', fontSize: '0.75rem' }}
                  onClick={() => setSelection({ kind: 'new-lesson', topicId: t._id })}
                >
                  <Plus size={12} /> Add lesson
                </button>

                <button
                  type="button"
                  style={treeNodeStyle(selection.kind === 'practice-root' && selection.topicId === t._id)}
                  onClick={() => {
                    setExpanded((p) => ({ ...p, [`practice-${t._id}`]: true, [`topic-${t._id}`]: true }));
                    setSelection({ kind: 'practice-root', topicId: t._id });
                  }}
                >
                  <FileQuestion size={12} />
                  Practice bank ({(t.practiceQuestions || []).length})
                </button>
                {expanded[`practice-${t._id}`] || selection.kind === 'practice-root' || (selection.kind === 'section' && selection.parentKind === 'practice' && selection.parentId === t._id) || (selection.kind === 'new-section' && selection.parentKind === 'practice' && selection.parentId === t._id) ? (
                  <div style={{ paddingLeft: 16 }}>
                    {(t.practiceQuestions || []).map((q: any) => (
                      <button
                        key={q._id}
                        type="button"
                        style={treeNodeStyle(selection.kind === 'section' && selection.id === q._id)}
                        onClick={() => setSelection({ kind: 'section', id: q._id, parentKind: 'practice', parentId: t._id })}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sectionLabel(q)}</span>
                        {publishBadge(q.isPublished !== false)}
                      </button>
                    ))}
                    <button
                      type="button"
                      style={{ ...treeNodeStyle(false), color: 'var(--accent)', fontSize: '0.75rem' }}
                      onClick={() => setSelection({ kind: 'new-section', parentKind: 'practice', parentId: t._id, type: 'question' })}
                    >
                      <Plus size={12} /> Add practice question
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 14, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tests</span>
          <button
            type="button"
            onClick={() => setSelection({ kind: 'new-test' })}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 2 }}
            title="Add test"
          >
            <Plus size={14} />
          </button>
        </div>

        {tests.map((test: any) => (
          <div key={test._id} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => toggleExpand(`test-${test._id}`)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>
                {expanded[`test-${test._id}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                type="button"
                style={treeNodeStyle(selection.kind === 'test' && selection.id === test._id)}
                onClick={() => setSelection({ kind: 'test', id: test._id })}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{test.title}</span>
                {publishBadge(!!test.isPublished)}
              </button>
            </div>
            {expanded[`test-${test._id}`] && (
              <div style={{ paddingLeft: 18 }}>
                {(test.sections || []).flatMap((sec: any) =>
                  (sec.questions || []).map((q: any) =>
                    typeof q === 'object' ? (
                      <button
                        key={q._id}
                        type="button"
                        style={treeNodeStyle(selection.kind === 'section' && selection.id === q._id)}
                        onClick={() => setSelection({ kind: 'section', id: q._id, parentKind: 'test', parentId: test._id })}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sectionLabel(q)}</span>
                        {publishBadge(q.isPublished !== false)}
                      </button>
                    ) : null
                  )
                )}
                <button
                  type="button"
                  style={{ ...treeNodeStyle(false), color: 'var(--accent)', fontSize: '0.75rem' }}
                  onClick={() => setSelection({ kind: 'new-section', parentKind: 'test', parentId: test._id, type: 'question' })}
                >
                  <Plus size={12} /> Add question
                </button>
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* RIGHT PANEL */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Edit Course</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          Select an item in the outline to edit, hide, or add nested content.
        </p>

        {statusMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--success-light)',
              color: 'var(--success)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {statusMsg}
          </div>
        )}

        <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
          {selection.kind === 'course' && (
            <form onSubmit={handleSaveCourse}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 16 }}>Course Details</h2>
              <CourseFields
                title={courseTitle}
                setTitle={setCourseTitle}
                desc={courseDesc}
                setDesc={setCourseDesc}
                price={coursePrice}
                setPrice={setCoursePrice}
                published={coursePublished}
                setPublished={setCoursePublished}
              />
              <button type="submit" style={primaryBtn} disabled={saving}>
                {saving ? 'Saving…' : 'Save Course'}
              </button>
            </form>
          )}

          {(selection.kind === 'topic' || selection.kind === 'new-topic') && (
            <form onSubmit={handleSaveTopic}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 16 }}>
                {selection.kind === 'new-topic' ? 'Add Topic' : 'Edit Topic'}
              </h2>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Title</label>
                <input type="text" required value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Description</label>
                <RichTextEditor
                  variant="compact"
                  value={topicDesc}
                  onChange={setTopicDesc}
                  placeholder="Topic overview…"
                />
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={topicFree} onChange={(e) => setTopicFree(e.target.checked)} style={{ width: 18, height: 18 }} />
                  Free preview
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={topicPublished} onChange={(e) => setTopicPublished(e.target.checked)} style={{ width: 18, height: 18 }} />
                  Published
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" style={primaryBtn} disabled={saving}>
                  {saving ? 'Saving…' : selection.kind === 'new-topic' ? 'Add Topic' : 'Save Topic'}
                </button>
                {selection.kind === 'topic' && (
                  <>
                    <button type="button" style={ghostBtn} onClick={() => setSelection({ kind: 'new-lesson', topicId: selection.id })}>
                      <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Add Lesson
                    </button>
                    <button
                      type="button"
                      style={ghostBtn}
                      onClick={() => setSelection({ kind: 'new-section', parentKind: 'practice', parentId: selection.id, type: 'question' })}
                    >
                      Add Practice Q
                    </button>
                    <button type="button" style={dangerBtn} onClick={() => handleDeleteTopic(selection.id)}>
                      <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Remove
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {(selection.kind === 'lesson' || selection.kind === 'new-lesson') && (
            <form onSubmit={handleSaveLesson}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 16 }}>
                {selection.kind === 'new-lesson' ? 'Add Lesson' : 'Edit Lesson'}
              </h2>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Title</label>
                <input type="text" required value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} style={inputStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer', marginBottom: 18 }}>
                <input type="checkbox" checked={lessonPublished} onChange={(e) => setLessonPublished(e.target.checked)} style={{ width: 18, height: 18 }} />
                Published
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" style={primaryBtn} disabled={saving}>
                  {saving ? 'Saving…' : selection.kind === 'new-lesson' ? 'Add Lesson' : 'Save Lesson'}
                </button>
                {selection.kind === 'lesson' && (
                  <>
                    <button
                      type="button"
                      style={ghostBtn}
                      onClick={() => setSelection({ kind: 'new-section', parentKind: 'lesson', parentId: selection.id })}
                    >
                      Add Video / Question
                    </button>
                    <button type="button" style={dangerBtn} onClick={() => handleDeleteLesson(selection.id)}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {selection.kind === 'practice-root' && (
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 8 }}>Practice Question Bank</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                Topic: {findTopic(selection.topicId)?.title}
              </p>
              <button
                type="button"
                style={primaryBtn}
                onClick={() =>
                  setSelection({
                    kind: 'new-section',
                    parentKind: 'practice',
                    parentId: selection.topicId,
                    type: 'question',
                  })
                }
              >
                Add Practice Question
              </button>
            </div>
          )}

          {(selection.kind === 'section' || selection.kind === 'new-section') && (
            <form onSubmit={handleSaveSection}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 16 }}>
                {selection.kind === 'new-section'
                  ? selection.parentKind === 'practice'
                    ? 'Add Practice Question'
                    : selection.parentKind === 'test'
                      ? 'Add Test Question'
                      : 'Add Lesson Content'
                  : 'Edit Content'}
              </h2>
              <SectionEditor
                value={sectionForm}
                onChange={setSectionForm}
                allowTypeChange={selection.kind === 'new-section' && selection.parentKind === 'lesson'}
                forceType={
                  selection.kind === 'new-section' && selection.parentKind !== 'lesson'
                    ? 'question'
                    : selection.kind === 'section' && selection.parentKind !== 'lesson'
                      ? 'question'
                      : undefined
                }
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button type="submit" style={primaryBtn} disabled={saving}>
                  {saving ? 'Saving…' : selection.kind === 'new-section' ? 'Add' : 'Save'}
                </button>
                {selection.kind === 'section' && (
                  <button
                    type="button"
                    style={dangerBtn}
                    onClick={() => handleDeleteSection(selection.id, selection.parentKind === 'test')}
                  >
                    Remove
                  </button>
                )}
              </div>
            </form>
          )}

          {(selection.kind === 'test' || selection.kind === 'new-test') && (
            <form onSubmit={handleSaveTest}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: 16 }}>
                {selection.kind === 'new-test' ? 'Add Test' : 'Edit Test'}
              </h2>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Title</label>
                <input type="text" required value={testTitle} onChange={(e) => setTestTitle(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Description</label>
                <RichTextEditor
                  variant="compact"
                  value={testDesc}
                  onChange={setTestDesc}
                  placeholder="Test instructions or description…"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Duration (min)</label>
                  <input type="number" value={testDuration} onChange={(e) => setTestDuration(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Total Marks</label>
                  <input type="number" value={testTotalMarks} onChange={(e) => setTestTotalMarks(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Passing Marks</label>
                  <input type="number" value={testPassing} onChange={(e) => setTestPassing(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Start</label>
                  <input type="datetime-local" value={testStart} onChange={(e) => setTestStart(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>End</label>
                  <input type="datetime-local" value={testEnd} onChange={(e) => setTestEnd(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={testNegative} onChange={(e) => setTestNegative(e.target.checked)} style={{ width: 18, height: 18 }} />
                  Negative marking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={testPublished} onChange={(e) => setTestPublished(e.target.checked)} style={{ width: 18, height: 18 }} />
                  Published
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" style={primaryBtn} disabled={saving}>
                  {saving ? 'Saving…' : selection.kind === 'new-test' ? 'Add Test' : 'Save Test'}
                </button>
                {selection.kind === 'test' && (
                  <>
                    <button
                      type="button"
                      style={ghostBtn}
                      onClick={() => setSelection({ kind: 'new-section', parentKind: 'test', parentId: selection.id, type: 'question' })}
                    >
                      Add Question
                    </button>
                    <button type="button" style={dangerBtn} onClick={() => handleDeleteTest(selection.id)}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseFields: React.FC<{
  title: string;
  setTitle: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  published: boolean;
  setPublished: (v: boolean) => void;
}> = ({ title, setTitle, desc, setDesc, price, setPrice, published, setPublished }) => (
  <>
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Course Title</label>
      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
    </div>
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Description</label>
      <RichTextEditor
        variant="compact"
        value={desc}
        onChange={setDesc}
        placeholder="Course description…"
      />
    </div>
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Price (₹ INR)</label>
      <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
    </div>
    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="checkbox"
        id="course-published"
        checked={published}
        onChange={(e) => setPublished(e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      <label htmlFor="course-published" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
        Published (visible to students)
      </label>
    </div>
  </>
);
