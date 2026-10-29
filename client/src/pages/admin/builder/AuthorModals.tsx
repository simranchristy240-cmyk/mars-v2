import React, { useRef, useState } from 'react';
import { X, UploadCloud, Trash2, FileText, Check, AlertCircle } from 'lucide-react';
import { AccessTier } from '@mars/shared';
import api from '../../../services/api';
import {
  SectionEditor,
  SectionFormValues,
  emptySectionForm,
  sectionToForm,
  formToPayload,
} from '../SectionEditor';

/* ─── Lesson Settings Modal (Title, Access Tier, PDF Notes) ──────────────── */
interface LessonModalProps {
  lesson: any;
  onClose: () => void;
  onSave: (data: { title: string; accessTier: AccessTier; isPublished: boolean }) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const LessonSettingsModal: React.FC<LessonModalProps> = ({
  lesson,
  onClose,
  onSave,
  onRefresh,
}) => {
  const [title, setTitle] = useState(lesson.title || '');
  const [accessTier, setAccessTier] = useState<AccessTier>(lesson.accessTier || 'free');
  const [isPublished, setIsPublished] = useState(lesson.isPublished !== false);
  const [saving, setSaving] = useState(false);
  const [notesUploading, setNotesUploading] = useState(false);
  const [notesDeleting, setNotesDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a lesson title.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), accessTier, isPublished });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save lesson settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lesson._id) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }
    const formData = new FormData();
    formData.append('notes', file);
    setNotesUploading(true);
    try {
      await api.post(`/lessons/lessons/${lesson._id}/notes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload PDF notes');
    } finally {
      setNotesUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNotesDelete = async () => {
    if (!window.confirm('Remove attached PDF notes from this lesson?')) return;
    setNotesDeleting(true);
    try {
      await api.delete(`/lessons/lessons/${lesson._id}/notes`);
      await onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove notes');
    } finally {
      setNotesDeleting(false);
    }
  };

  return (
    <div className="cb-modal-backdrop" onClick={onClose}>
      <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cb-modal-head">
          <h2 className="cb-modal-title">Edit Lesson Details</h2>
          <button type="button" className="ui-icon-btn is-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cb-modal-body">
            {error && (
              <div className="ui-callout is-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Lesson Title
              </label>
              <input
                type="text"
                className="ui-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Femoral Triangle & Sheath"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Access Tier
                </label>
                <select
                  className="ui-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value as AccessTier)}
                >
                  <option value="free">Free (All students)</option>
                  <option value="basic">Basic Tier</option>
                  <option value="plus">Plus Tier</option>
                  <option value="premium">Premium Tier</option>
                </select>
              </div>

              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Publish Status
                </label>
                <select
                  className="ui-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={isPublished ? 'true' : 'false'}
                  onChange={(e) => setIsPublished(e.target.value === 'true')}
                >
                  <option value="true">Published (Visible to students)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Attached PDF Notes */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <label className="ui-label" style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>
                High-Yield PDF Notes (Split-View Reader)
              </label>

              {lesson.notesFile?.filename ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {lesson.notesFile.originalName || 'Attached Lesson Notes'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {lesson.notesFile.fileSize
                          ? `${Math.round(lesson.notesFile.fileSize / 1024)} KB`
                          : 'PDF Document'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="ui-btn is-outline is-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={notesUploading}
                    >
                      {notesUploading ? 'Uploading…' : 'Replace PDF'}
                    </button>
                    <button
                      type="button"
                      className="ui-btn is-danger is-sm"
                      onClick={handleNotesDelete}
                      disabled={notesDeleting}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cb-notes-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={28} color="var(--primary)" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {notesUploading ? 'Uploading PDF notes…' : 'Upload PDF Notes for this Lesson'}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Students can study notes side-by-side with video clips.
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleNotesUpload}
              />
            </div>
          </div>

          <div className="cb-modal-footer">
            <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ui-btn is-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Section Editor Modal (Video, Text Reading, Quick Check Question) ───── */
interface SectionModalProps {
  section?: any;
  parentId: string;
  parentType: 'lesson' | 'practice' | 'test';
  order: number;
  initialType?: 'video' | 'text' | 'question';
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  section,
  parentId,
  parentType,
  order,
  initialType = 'video',
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<SectionFormValues>(() =>
    section ? sectionToForm(section) : emptySectionForm(initialType)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = formToPayload(form, parentId, parentType, order);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cb-modal-backdrop" onClick={onClose}>
      <div className="cb-modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div className="cb-modal-head">
          <h2 className="cb-modal-title">
            {section ? `Edit ${form.type === 'video' ? 'Video Section' : form.type === 'text' ? 'Reading Section' : 'Question'}` : `Add New ${form.type === 'video' ? 'Video Section' : form.type === 'text' ? 'Reading' : 'Question'}`}
          </h2>
          <button type="button" className="ui-icon-btn is-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cb-modal-body">
            {error && (
              <div className="ui-callout is-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <SectionEditor
              value={form}
              onChange={setForm}
              allowTypeChange={!section && parentType === 'lesson'}
              forceType={parentType !== 'lesson' ? 'question' : undefined}
            />
          </div>

          <div className="cb-modal-footer">
            <div>
              {section && onDelete && (
                <button
                  type="button"
                  className="ui-btn is-danger is-sm"
                  onClick={async () => {
                    if (window.confirm('Delete this section? This cannot be undone.')) {
                      await onDelete();
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={13} style={{ marginRight: 5 }} /> Delete Section
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="ui-btn is-primary" disabled={saving}>
                {saving ? 'Saving…' : section ? 'Save Changes' : 'Add Section'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Chapter / Topic Settings Modal ─────────────────────────────────────── */
interface ChapterModalProps {
  topic?: any;
  onClose: () => void;
  onSave: (data: { title: string; description: string; isFree: boolean; isPublished: boolean }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const ChapterModal: React.FC<ChapterModalProps> = ({
  topic,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(topic?.title || '');
  const [description, setDescription] = useState(topic?.description || '');
  const [isFree, setIsFree] = useState(!!topic?.isFree);
  const [isPublished, setIsPublished] = useState(topic?.isPublished !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a chapter title.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), isFree, isPublished });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save chapter.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cb-modal-backdrop" onClick={onClose}>
      <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cb-modal-head">
          <h2 className="cb-modal-title">{topic ? 'Edit Chapter Details' : 'Add New Chapter'}</h2>
          <button type="button" className="ui-icon-btn is-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cb-modal-body">
            {error && (
              <div className="ui-callout is-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Chapter Title
              </label>
              <input
                type="text"
                className="ui-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Upper Limb & Pectoral Girdle"
                required
              />
            </div>

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Chapter Description
              </label>
              <textarea
                className="ui-textarea"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', minHeight: 90 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key anatomical structures, clinical correlates, and dissection milestones covered in this chapter."
              />
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                />
                <span>Free Trial / Preview Chapter</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span>Published (Visible to students)</span>
              </label>
            </div>
          </div>

          <div className="cb-modal-footer">
            <div>
              {topic && onDelete && (
                <button
                  type="button"
                  className="ui-btn is-danger is-sm"
                  onClick={async () => {
                    if (window.confirm('Delete this chapter and all its lessons? This cannot be undone.')) {
                      await onDelete();
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={13} style={{ marginRight: 5 }} /> Delete Chapter
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="ui-btn is-primary" disabled={saving}>
                {saving ? 'Saving…' : topic ? 'Save Chapter' : 'Add Chapter'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Test Settings Modal ────────────────────────────────────────────────── */
interface TestModalProps {
  test?: any;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const TestSettingsModal: React.FC<TestModalProps> = ({
  test,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(test?.title || '');
  const [description, setDescription] = useState(test?.description || '');
  const [duration, setDuration] = useState(String(test?.duration || 30));
  const [totalMarks, setTotalMarks] = useState(String(test?.totalMarks || 10));
  const [passingMarks, setPassingMarks] = useState(String(test?.passingMarks || 6));
  const [negativeMarking, setNegativeMarking] = useState(!!test?.negativeMarking);
  const [accessTier, setAccessTier] = useState<AccessTier>(test?.accessTier || 'free');
  const [isPublished, setIsPublished] = useState(!!test?.isPublished);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a test title.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        duration: parseInt(duration, 10) || 30,
        totalMarks: parseInt(totalMarks, 10) || 10,
        passingMarks: parseInt(passingMarks, 10) || 6,
        negativeMarkingEnabled: negativeMarking,
        negativeMarking,
        accessTier,
        isPublished,
        startTime: test?.startTime || now.toISOString(),
        endTime: test?.endTime || nextYear.toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cb-modal-backdrop" onClick={onClose}>
      <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cb-modal-head">
          <h2 className="cb-modal-title">{test ? 'Edit Assessment Test' : 'Add Assessment Test'}</h2>
          <button type="button" className="ui-icon-btn is-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cb-modal-body">
            {error && (
              <div className="ui-callout is-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Test Title
              </label>
              <input
                type="text"
                className="ui-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Upper Limb Milestone Exam"
                required
              />
            </div>

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Instructions / Description
              </label>
              <textarea
                className="ui-textarea"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', minHeight: 80 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test guidelines, negative marking rules, and clinical topics assessed."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Duration (mins)
                </label>
                <input
                  type="number"
                  className="ui-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Total Marks
                </label>
                <input
                  type="number"
                  className="ui-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Pass Marks
                </label>
                <input
                  type="number"
                  className="ui-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Access Tier
                </label>
                <select
                  className="ui-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value as AccessTier)}
                >
                  <option value="free">Free (All students)</option>
                  <option value="basic">Basic Tier</option>
                  <option value="plus">Plus Tier</option>
                  <option value="premium">Premium Tier</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                  />
                  <span>Negative Marking (-0.25)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Published (Visible to students)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="cb-modal-footer">
            <div>
              {test && onDelete && (
                <button
                  type="button"
                  className="ui-btn is-danger is-sm"
                  onClick={async () => {
                    if (window.confirm('Delete this test? This cannot be undone.')) {
                      await onDelete();
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={13} style={{ marginRight: 5 }} /> Delete Test
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="ui-btn is-primary" disabled={saving}>
                {saving ? 'Saving…' : test ? 'Save Test' : 'Add Test'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Practice Settings Modal (Title, Access Tier) ──────────────────────── */
interface PracticeModalProps {
  title: string;
  accessTier?: AccessTier;
  onClose: () => void;
  onSave: (data: { title: string; accessTier?: AccessTier }) => Promise<void>;
}

export const PracticeSettingsModal: React.FC<PracticeModalProps> = ({
  title: initialTitle,
  accessTier: initialTier = 'free',
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [accessTier, setAccessTier] = useState<AccessTier>(initialTier);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a practice set title.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), accessTier });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save practice settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cb-modal-backdrop" onClick={onClose}>
      <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cb-modal-head">
          <h2 className="cb-modal-title">Edit Practice Name</h2>
          <button type="button" className="ui-icon-btn is-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="cb-modal-body">
            {error && (
              <div className="ui-callout is-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Practice Set Title
              </label>
              <input
                type="text"
                className="ui-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter Practice Drills"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="ui-label" style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                Access Tier
              </label>
              <select
                className="ui-select"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
                value={accessTier}
                onChange={(e) => setAccessTier(e.target.value as AccessTier)}
              >
                <option value="free">Free (All students)</option>
                <option value="basic">Basic Tier</option>
                <option value="plus">Plus Tier</option>
                <option value="premium">Premium Tier</option>
              </select>
            </div>
          </div>

          <div className="cb-modal-footer">
            <div />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="ui-btn is-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

