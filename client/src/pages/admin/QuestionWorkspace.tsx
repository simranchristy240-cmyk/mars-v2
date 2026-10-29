import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Edit3, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { correctAnswerIds, isAnswerCorrect } from '@mars/shared';
import api from '../../services/api';
import { QuestionAnswer } from '../../components/QuestionAnswer';
import { HtmlContent, stripHtml } from '../../components/RichTextEditor';
import { emptySectionForm, formToPayload, SectionEditor, sectionToForm, SectionFormValues } from './SectionEditor';
import '../../styles/pages/question-workspace.css';

const TYPE_LABELS: Record<string, string> = {
  'single-mcq': 'Single answer', 'multi-mcq': 'Multiple answers', 'true-false': 'True / false',
  match: 'Matching', 'image-based': 'Image question',
};

interface Props {
  title: string;
  parentKind: 'practice' | 'test';
  parentId: string;
  practiceSetId?: string;
  questions: any[];
  initialId?: string;
  initiallyNew?: boolean;
  usage: Record<string, string[]>;
  onRefresh: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onSettings?: () => void;
}

export const QuestionWorkspace: React.FC<Props> = ({ title, parentKind, parentId, practiceSetId, questions,
  initialId, initiallyNew, usage, onRefresh, onDirtyChange, onSettings }) => {
  const [items, setItems] = useState<any[]>(questions);
  const initial = !initiallyNew && (questions.find(q => q._id === initialId) || questions[0]);
  const [selectedId, setSelectedId] = useState<string | null>(initial?._id || null);
  const [form, setForm] = useState<SectionFormValues>(() => initial ? sectionToForm(initial) : emptySectionForm('question'));
  const baseline = useRef(JSON.stringify(form));
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const dirty = JSON.stringify(form) !== baseline.current;
  const current = items.find(q => q._id === selectedId);
  const index = items.findIndex(q => q._id === selectedId);

  useEffect(() => { setItems(questions); }, [questions]);
  useEffect(() => { onDirtyChange(dirty || saving); return () => onDirtyChange(false); }, [dirty, saving, onDirtyChange]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const loadQuestion = (question?: any) => {
    const next = question ? sectionToForm(question) : emptySectionForm('question');
    baseline.current = JSON.stringify(next);
    setForm(next);
    setSelectedId(question?._id || null);
    setPreview(false); setPreviewAnswer([]); setChecked(false); setError('');
    onDirtyChange(false);
  };
  const canLeave = () => !saving && (!dirty || window.confirm('Discard your unsaved question changes?'));
  const openQuestion = (question?: any) => {
    if (question?._id === selectedId && selectedId) return;
    if (canLeave()) { loadQuestion(question); setMessage(''); }
  };

  const save = async (action: 'stay' | 'next' | 'new' = 'stay') => {
    if (saving) return;
    setSaving(true); setError(''); setMessage('');
    let saved: any;
    try {
      const payload = formToPayload(form, parentId, parentKind, items.length + 1);
      if (selectedId) {
        delete payload.parentId; delete payload.parentType; delete payload.order;
        saved = (await api.put(`/lessons/sections/${selectedId}`, payload)).data.data;
      } else {
        if (practiceSetId) payload.practiceSetId = practiceSetId;
        saved = (await api.post('/lessons/sections', payload)).data.data;
      }
      const nextItems = selectedId ? items.map(q => q._id === selectedId ? { ...q, ...saved } : q) : [...items, saved];
      setItems(nextItems);
      loadQuestion(action === 'new' ? undefined : action === 'next' && index >= 0 && items[index + 1] ? items[index + 1] : saved);
      setMessage(action === 'new' ? 'Question saved. Ready for the next question.' : 'Question saved.');
      try { await onRefresh(); }
      catch { setMessage('Question saved. Refresh the course outline to see the latest version.'); }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Could not save. Your changes are still here.');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!current || !canLeave()) return;
    const shared = parentKind === 'test';
    if (!window.confirm(shared ? 'Remove this question from this test? Other uses of this question will remain available.' : 'Delete this question? It will also be removed from every place that uses it.')) return;
    setSaving(true); setError('');
    try {
      await api.delete(`/lessons/sections/${current._id}${parentKind === 'test' ? `?fromTest=true&testId=${parentId}` : ''}`);
      const remaining = items.filter(q => q._id !== current._id);
      setItems(remaining); loadQuestion(remaining[Math.min(index, remaining.length - 1)]);
      setMessage(shared ? 'Question removed from this test.' : 'Question deleted.');
      await onRefresh();
    } catch (err: any) { setError(err.response?.data?.error || 'Unable to remove the question.'); }
    finally { setSaving(false); }
  };

  const previewQuestion = {
    questionType: form.questionType, questionText: form.questionText, questionImage: form.questionImage,
    options: form.questionType === 'true-false' ? [
      { id: 'true', text: 'True', isCorrect: form.options.find(o => o.id === 'true')?.isCorrect ?? true },
      { id: 'false', text: 'False', isCorrect: form.options.find(o => o.id === 'false')?.isCorrect ?? false },
    ] : form.options,
    matchPairs: form.matchPairs,
  };
  const filtered = items.filter(q => `${stripHtml(q.questionText || '')} ${q.title || ''} ${TYPE_LABELS[q.questionType]} ${q.isPublished === false ? 'draft' : 'published'} ${q.groupLabel || ''}`.toLowerCase().includes(query.toLowerCase()));
  const usedIn = selectedId ? usage[selectedId] || [] : [];
  const shared = current && ((parentKind === 'test' && current.parentType !== 'test') || usedIn.some(name => name !== title));

  return <div className="qw-workspace">
    <header className="qw-header">
      <div><div className="ui-label">{parentKind === 'test' ? 'Test questions' : 'Question bank'}</div><h1>{title}</h1><p className="ui-muted">Choose a question to edit. Changes stay here until you save.</p></div>
      {onSettings && <button className="ui-btn is-outline" onClick={onSettings}>Test settings</button>}
    </header>
    <div className="qw-layout">
      <aside className="qw-list" aria-label="Question list">
        <div className="qw-list-tools">
          <button className="ui-btn is-primary is-block" disabled={saving} onClick={() => openQuestion()}><Plus size={16} /> Add question</button>
          <label className="qw-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions..." aria-label="Search questions" /></label>
          <span className="ui-muted">{query ? `${filtered.length} of ` : ''}{items.length} questions</span>
        </div>
        <div className="qw-question-list">
          {filtered.map(q => <button key={q._id} disabled={saving} className={`qw-question${selectedId === q._id ? ' is-active' : ''}`} onClick={() => openQuestion(q)} aria-current={selectedId === q._id ? 'true' : undefined}>
            <span className="ui-label">Question {items.indexOf(q) + 1}{q.groupLabel ? ` / ${q.groupLabel}` : ''}</span>
            <span className="qw-prompt">{stripHtml(q.questionText || '') || q.title || 'Untitled question'}</span>
            <span className="qw-meta">{TYPE_LABELS[q.questionType] || 'Single answer'} / {q.marks ?? 1} marks / {q.isPublished === false ? 'Draft' : 'Published'}</span>
          </button>)}
          {!filtered.length && <p className="qw-empty">{query ? 'No matching questions. Try a different search.' : 'No questions yet. Create your first question on the right.'}</p>}
        </div>
      </aside>
      <form className="qw-editor" onSubmit={e => { e.preventDefault(); void save(); }}>
        <div className="qw-editor-heading"><div><h2>{selectedId ? `Question ${index + 1}` : 'New question'}</h2><span className="ui-muted" role="status">{saving ? 'Saving...' : dirty ? 'Unsaved changes' : selectedId ? 'Saved' : 'Not saved yet'}</span></div>
          <div className="ui-row"><button type="button" className={`ui-btn is-sm ${!preview ? 'is-primary' : 'is-outline'}`} onClick={() => setPreview(false)}><Edit3 size={14} /> Edit</button><button type="button" className={`ui-btn is-sm ${preview ? 'is-primary' : 'is-outline'}`} onClick={() => { setPreview(true); setPreviewAnswer([]); setChecked(false); }}><Eye size={14} /> Student preview</button></div>
        </div>
        {shared && <div className="ui-callout">Shared question{usedIn.length ? ` / Used in: ${usedIn.join(', ')}` : ''}. Saving updates the source and every test using it.</div>}
        {error && <div className="ui-callout is-danger" role="alert">{error}</div>}
        {message && <div className="ui-callout is-success" role="status"><Check size={16} /> {message}</div>}
        <div className="qw-editor-body">
          {preview ? <section className="qw-preview" aria-label="Student question preview">
            <p className="ui-muted">Preview of your current edits. This does not save or publish the question.</p>
            <HtmlContent as="div" html={form.questionText || '<p>Your question text will appear here.</p>'} />
            {form.questionImage && <img src={form.questionImage} alt="Question diagram" className="qw-preview-image" />}
            <QuestionAnswer question={previewQuestion} value={previewAnswer} onChange={setPreviewAnswer} correctIds={checked ? correctAnswerIds(previewQuestion) : undefined} />
            <button type="button" className="ui-btn is-outline" disabled={!previewAnswer.length} onClick={() => checked ? (setChecked(false), setPreviewAnswer([])) : setChecked(true)}>{checked ? 'Try again' : 'Check answer'}</button>
            {checked && <div className="ui-callout" role="status"><strong>{isAnswerCorrect(previewQuestion, previewAnswer) ? 'Correct answer' : 'Incorrect answer'}</strong><HtmlContent as="div" html={form.explanation} /></div>}
          </section> : <fieldset disabled={saving} className="qw-fields"><SectionEditor key={selectedId || 'new'} disabled={saving} value={form} onChange={next => { setForm(next); setMessage(''); }} forceType="question" /></fieldset>}
        </div>
        <footer className="qw-actions">
          <div className="ui-row"><button type="submit" className="ui-btn is-primary" disabled={saving}>{saving ? 'Saving...' : 'Save question'}</button>
            {index >= 0 && index < items.length - 1 && <button type="button" className="ui-btn is-outline" disabled={saving} onClick={() => void save('next')}>Save & next <ArrowRight size={14} /></button>}
            <button type="button" className="ui-btn is-outline" disabled={saving} onClick={() => void save('new')}>Save & add another</button>
          </div>
          <div className="ui-row">
            {dirty && <button type="button" className="ui-btn is-ghost" disabled={saving} onClick={() => { if (canLeave()) loadQuestion(current); }}>Discard changes</button>}
            {current && <button type="button" className="ui-btn is-ghost" disabled={saving} onClick={() => void remove()}><Trash2 size={14} /> {parentKind === 'test' ? 'Remove from test' : 'Delete'}</button>}
          </div>
        </footer>
        {items.length > 1 && <nav className="qw-neighbours" aria-label="Question navigation"><button type="button" className="ui-btn is-ghost" disabled={index <= 0 || saving} onClick={() => openQuestion(items[index - 1])}><ArrowLeft size={14} /> Previous question</button><button type="button" className="ui-btn is-ghost" disabled={index < 0 || index >= items.length - 1 || saving} onClick={() => openQuestion(items[index + 1])}>Next question <ArrowRight size={14} /></button></nav>}
      </form>
    </div>
  </div>;
};
