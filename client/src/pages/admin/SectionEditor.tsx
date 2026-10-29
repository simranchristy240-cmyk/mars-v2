import { questionValidationError } from '@mars/shared';
import React, { useEffect, useState } from 'react';
import { RichTextEditor, isHtmlEmpty, stripHtml } from '../../components/RichTextEditor';
import {
  Video,
  FileText,
  FileQuestion,
  Check,
  Plus,
  Trash2,
  Type,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export type QuestionType = 'single-mcq' | 'multi-mcq' | 'true-false' | 'match' | 'image-based';
export type SectionType = 'video' | 'text' | 'question';

export interface SectionFormValues {
  type: SectionType;
  title: string;
  isPublished: boolean;
  accessTier: 'free' | 'basic' | 'plus' | 'premium';
  vimeoVideoId: string;
  videoStartTime: string;
  videoEndTime: string;
  text: string;
  questionType: QuestionType;
  questionText: string;
  questionImage: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  matchPairs: Array<{ left: string; right: string }>;
  hints: string;
  explanation: string;
  marks: string;
  negativeMarks: string;
}

export const emptySectionForm = (type: SectionType = 'video'): SectionFormValues => ({
  type,
  title: '',
  isPublished: true,
  accessTier: 'free',
  vimeoVideoId: '76979871',
  videoStartTime: '0',
  videoEndTime: '300',
  text: '',
  questionType: 'single-mcq',
  questionText: '',
  questionImage: '',
  options: [
    { id: 'a', text: '', isCorrect: true },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
  matchPairs: [
    { left: '', right: '' },
    { left: '', right: '' },
  ],
  hints: '',
  explanation: '',
  marks: '1',
  negativeMarks: '0',
});

export const sectionToForm = (section: any): SectionFormValues => {
  const base = emptySectionForm(section.type || 'video');
  return {
    ...base,
    type: section.type || 'video',
    title: section.title || '',
    isPublished: section.isPublished !== false,
    accessTier: section.accessTier || 'free',
    vimeoVideoId: section.vimeoVideoId || '',
    videoStartTime: String(section.videoStartTime ?? 0),
    videoEndTime: String(section.videoEndTime ?? 300),
    text: section.text || '',
    questionType: section.questionType || 'single-mcq',
    questionText: section.questionText || '',
    questionImage: section.questionImage || '',
    options:
      section.options?.length > 0
        ? section.options.map((o: any) => ({
            id: o.id,
            text: o.text || '',
            isCorrect: !!o.isCorrect,
          }))
        : base.options,
    matchPairs:
      section.matchPairs?.length > 0
        ? section.matchPairs.map((p: any) => ({ left: p.left || '', right: p.right || '' }))
        : base.matchPairs,
    hints: (section.hints || []).join('\n'),
    explanation: section.explanation || '',
    marks: String(section.marks ?? 1),
    negativeMarks: String(section.negativeMarks ?? 0),
  };
};

export const formToPayload = (form: SectionFormValues, parentId: string, parentType: string, order: number) => {
  const payload: any = {
    type: form.type,
    title: form.title,
    isPublished: form.isPublished,
    accessTier: form.accessTier || 'free',
    parentId,
    parentType,
    order,
  };

  if (form.type === 'video') {
    payload.vimeoVideoId = form.vimeoVideoId;
    payload.videoStartTime = parseInt(form.videoStartTime, 10) || 0;
    payload.videoEndTime = parseInt(form.videoEndTime, 10) || undefined;
  } else if (form.type === 'text') {
    payload.text = form.text;
  } else {
    payload.questionType = form.questionType;
    payload.questionText = form.questionText;
    payload.questionImage = form.questionImage || undefined;
    payload.hints = form.hints
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);
    payload.explanation = form.explanation;
    payload.marks = Number(form.marks);
    payload.negativeMarks = Number(form.negativeMarks);

    if (form.questionType === 'match') {
      payload.matchPairs = form.matchPairs.filter((p) => stripHtml(p.left) && stripHtml(p.right));
      payload.options = [];
    } else if (form.questionType === 'true-false') {
      payload.options = [
        { id: 'true', text: 'True', isCorrect: form.options.find((o) => o.id === 'true')?.isCorrect ?? true },
        { id: 'false', text: 'False', isCorrect: form.options.find((o) => o.id === 'false')?.isCorrect ?? false },
      ];
    } else {
      payload.options = form.options
        .filter((o) => !isHtmlEmpty(o.text))
        .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }));
    }
  }

  if (form.type === 'question' && form.isPublished) {
    const error = questionValidationError(payload);
    if (error) throw new Error(error);
  }
  return payload;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '0.88rem',
  transition: 'border-color 0.15s ease',
};

interface TimeInputRowProps {
  label: string;
  totalSeconds: string;
  onChange: (totalSeconds: string) => void;
  inputStyle: React.CSSProperties;
}

const TimeInputRow: React.FC<TimeInputRowProps> = ({ label, totalSeconds, onChange, inputStyle }) => {
  const total = Math.max(0, parseInt(totalSeconds, 10) || 0);
  const [h, setH] = useState(() => {
    const hours = Math.floor(total / 3600);
    return hours > 0 ? String(hours) : '';
  });
  const [m, setM] = useState(() => {
    const mins = Math.floor((total % 3600) / 60);
    return mins > 0 ? String(mins) : '';
  });
  const [s, setS] = useState(() => {
    const secs = total % 60;
    return secs > 0 ? String(secs) : '';
  });

  useEffect(() => {
    const t = Math.max(0, parseInt(totalSeconds, 10) || 0);
    const hours = Math.floor(t / 3600);
    const mins = Math.floor((t % 3600) / 60);
    const secs = t % 60;
    setH(hours > 0 ? String(hours) : '');
    setM(mins > 0 ? String(mins) : '');
    setS(secs > 0 ? String(secs) : '');
  }, [totalSeconds]);

  const commit = (nextH: string, nextM: string, nextS: string) => {
    const parsedH = Math.max(0, parseInt(nextH, 10) || 0);
    const parsedM = Math.max(0, parseInt(nextM, 10) || 0);
    const parsedS = Math.max(0, parseInt(nextS, 10) || 0);
    onChange(String(parsedH * 3600 + parsedM * 60 + parsedS));
  };

  const handleInput = (val: string, setter: (v: string) => void, part: 'h' | 'm' | 's') => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setter(cleaned);
    if (part === 'h') commit(cleaned, m, s);
    if (part === 'm') commit(h, cleaned, s);
    if (part === 's') commit(h, m, cleaned);
  };

  const parsedH = Math.max(0, parseInt(h, 10) || 0);
  const parsedM = Math.max(0, parseInt(m, 10) || 0);
  const parsedS = Math.max(0, parseInt(s, 10) || 0);
  const badgeText = parsedH > 0
    ? `${parsedH}h ${parsedM}m ${parsedS.toString().padStart(2, '0')}s`
    : `${parsedM}m ${parsedS.toString().padStart(2, '0')}s`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--primary, #6366f1)', fontWeight: 700 }}>
          {badgeText}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={h}
          placeholder="hh"
          onChange={(e) => handleInput(e.target.value, setH, 'h')}
          style={{ ...inputStyle, textAlign: 'center', background: 'var(--bg-primary)' }}
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={m}
          placeholder="mm"
          onChange={(e) => handleInput(e.target.value, setM, 'm')}
          style={{ ...inputStyle, textAlign: 'center', background: 'var(--bg-primary)' }}
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={s}
          placeholder="ss"
          onChange={(e) => handleInput(e.target.value, setS, 's')}
          style={{ ...inputStyle, textAlign: 'center', background: 'var(--bg-primary)' }}
        />
      </div>
    </div>
  );
};

interface SectionEditorProps {
  value: SectionFormValues;
  onChange: (next: SectionFormValues) => void;
  allowTypeChange?: boolean;
  forceType?: SectionType;
  disabled?: boolean;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  value,
  onChange,
  allowTypeChange = true,
  forceType,
  disabled = false,
}) => {
  const type = forceType || value.type;
  const [richOptionIds, setRichOptionIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (forceType && value.type !== forceType) {
      onChange({ ...value, type: forceType });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceType]);

  const set = <K extends keyof SectionFormValues>(key: K, v: SectionFormValues[K]) => {
    onChange({ ...value, [key]: v });
  };

  const setQuestionType = (qt: QuestionType) => {
    let options = value.options;
    if (qt === 'true-false') {
      options = [
        { id: 'true', text: 'True', isCorrect: true },
        { id: 'false', text: 'False', isCorrect: false },
      ];
    } else if (value.questionType === 'true-false') {
      options = emptySectionForm('question').options;
    }
    onChange({ ...value, questionType: qt, options });
  };

  const updateOption = (idx: number, patch: Partial<{ text: string; isCorrect: boolean }>) => {
    const options = value.options.map((o, i) => {
      if (i !== idx) {
        if (patch.isCorrect && (value.questionType === 'single-mcq' || value.questionType === 'true-false' || value.questionType === 'image-based')) {
          return { ...o, isCorrect: false };
        }
        return o;
      }
      return { ...o, ...patch };
    });
    set('options', options);
  };


  const formatSeconds = (secStr: string) => {
    const s = parseInt(secStr, 10);
    if (isNaN(s)) return '0m 00s';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (h > 0) {
      return `${h}h ${m}m ${rem.toString().padStart(2, '0')}s`;
    }
    return `${m}m ${rem.toString().padStart(2, '0')}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Type Switcher */}
      {allowTypeChange && !forceType && (
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            gap: 4,
          }}
        >
          {[
            { id: 'video' as SectionType, label: 'Video Lecture', icon: Video },
            { id: 'text' as SectionType, label: 'Study Notes', icon: FileText },
            { id: 'question' as SectionType, label: 'Practice Question', icon: FileQuestion },
          ].map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => set('type', id)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                background: type === id ? 'var(--accent)' : 'transparent',
                color: type === id ? 'var(--on-accent)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Row 1: Title and Question Format side-by-side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: type === 'question' ? '1.5fr 1fr' : '1fr',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Title / Name
          </label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set('title', e.target.value)}
            style={inputStyle}
            placeholder={
              type === 'video'
                ? 'e.g. Scapula Overview'
                : type === 'question'
                  ? 'e.g. Surgical Neck Nerve Injury'
                  : 'e.g. Clinical Landmarks of the Scapula'
            }
          />
        </div>

        {type === 'question' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Question Format
            </label>
            <select
              value={value.questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="single-mcq">Single MCQ (1 correct)</option>
              <option value="multi-mcq">Multi MCQ (Multiple correct)</option>
              <option value="true-false">True / False</option>
              <option value="match">Match the following</option>
              <option value="image-based">Image-based Question</option>
            </select>
          </div>
        )}
      </div>

      {/* VIDEO SECTION INPUTS */}
      {type === 'video' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1fr',
            gap: 14,
            padding: 16,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Vimeo Video ID
            </label>
            <input
              type="text"
              required
              value={value.vimeoVideoId}
              onChange={(e) => set('vimeoVideoId', e.target.value)}
              style={{ ...inputStyle, background: 'var(--bg-primary)' }}
              placeholder="e.g. 76979871"
            />
          </div>
          {/* Start Time */}
          <TimeInputRow
            label="Start Time"
            totalSeconds={value.videoStartTime}
            onChange={(val) => set('videoStartTime', val)}
            inputStyle={inputStyle}
          />

          {/* End Time */}
          <TimeInputRow
            label="End Time"
            totalSeconds={value.videoEndTime}
            onChange={(val) => set('videoEndTime', val)}
            inputStyle={inputStyle}
          />
        </div>
      )}

      {/* STUDY NOTES TEXT SECTION */}
      {type === 'text' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Study Notes & Key Clinical Pearls
          </label>
          <RichTextEditor
              disabled={disabled}
            variant="full"
            value={value.text}
            onChange={(html) => set('text', html)}
            placeholder="Write lesson notes, clinical pearls, key points…"
          />
        </div>
      )}

      {/* QUESTION FIELDS */}
      {type === 'question' && (
        <>
          {/* Question Stem */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Question Text / Stem
            </label>
            <RichTextEditor
              disabled={disabled}
              variant="compact"
              value={value.questionText}
              onChange={(html) => set('questionText', html)}
              placeholder="Enter the question stem or clinical vignette…"
            />
          </div>

          {value.questionType === 'image-based' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Question Image URL
              </label>
              <input
                type="text"
                value={value.questionImage}
                onChange={(e) => set('questionImage', e.target.value)}
                style={inputStyle}
                placeholder="https://example.com/anatomy-diagram.jpg"
              />
            </div>
          )}

          {/* MATCH PAIRS */}
          {value.questionType === 'match' ? (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Match Pairs
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Students match left items to corresponding right items
                </span>
              </div>

              {value.matchPairs.map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr auto',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="text"
                    value={stripHtml(pair.left)}
                    onChange={(e) => {
                      const matchPairs = value.matchPairs.map((p, i) => (i === idx ? { ...p, left: e.target.value } : p));
                      set('matchPairs', matchPairs);
                    }}
                    placeholder={`Item ${idx + 1}`}
                    style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-primary)' }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>→</span>
                  <input
                    type="text"
                    value={stripHtml(pair.right)}
                    onChange={(e) => {
                      const matchPairs = value.matchPairs.map((p, i) => (i === idx ? { ...p, right: e.target.value } : p));
                      set('matchPairs', matchPairs);
                    }}
                    placeholder={`Match ${idx + 1}`}
                    style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-primary)' }}
                  />
                  {value.matchPairs.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => set('matchPairs', value.matchPairs.filter((_, i) => i !== idx))}
                      title="Remove pair"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <div style={{ width: 23 }} />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => set('matchPairs', [...value.matchPairs, { left: '', right: '' }])}
                style={{
                  marginTop: 6,
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={14} /> Add pair
              </button>
            </div>
          ) : value.questionType === 'true-false' ? (
            /* TRUE / FALSE OPTIONS */
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 10 }}>
                Select Correct Answer:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { id: 'true', label: 'True' },
                  { id: 'false', label: 'False' },
                ].map(({ id, label }) => {
                  const isCorrect = value.options.find((o) => o.id === id)?.isCorrect ?? (id === 'true');
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        const opts = [
                          { id: 'true', text: 'True', isCorrect: id === 'true' },
                          { id: 'false', text: 'False', isCorrect: id === 'false' },
                        ];
                        set('options', opts);
                      }}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-sm)',
                        border: isCorrect ? '2px solid #16a34a' : '1px solid var(--border-color)',
                        background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isCorrect ? '#16a34a' : 'var(--text-primary)' }}>
                        {label}
                      </span>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: isCorrect ? '2px solid #16a34a' : '2px solid var(--border-color)',
                          background: isCorrect ? '#16a34a' : 'transparent',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isCorrect && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MCQ OPTIONS (SINGLE & MULTI & IMAGE) - CLEAN, COMPACT UI */
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Options
                  </label>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6',
                    }}
                  >
                    {value.questionType === 'multi-mcq' ? 'Select all correct answers' : 'Select 1 correct answer'}
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Click indicator to mark correct
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {value.options.map((opt, idx) => {
                  const isRich = richOptionIds[opt.id] || (/<[a-z][\s\S]*>/i.test(opt.text) && !isHtmlEmpty(opt.text));
                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 'var(--radius-sm)',
                        border: opt.isCorrect ? '1.5px solid rgba(34, 197, 94, 0.5)' : '1px solid var(--border-color)',
                        background: opt.isCorrect ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-primary)',
                        padding: '6px 10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Radio / Check indicator */}
                        <button
                          type="button"
                          onClick={() =>
                            updateOption(
                              idx,
                              value.questionType === 'multi-mcq'
                                ? { isCorrect: !opt.isCorrect }
                                : { isCorrect: true }
                            )
                          }
                          title={opt.isCorrect ? 'Correct option' : 'Mark as correct'}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: value.questionType === 'multi-mcq' ? 5 : '50%',
                            border: opt.isCorrect ? '2px solid #16a34a' : '2px solid var(--border-color)',
                            background: opt.isCorrect ? '#16a34a' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {opt.isCorrect && <Check size={13} strokeWidth={3} />}
                        </button>

                        {/* Letter badge */}
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 5,
                            background: opt.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
                            color: opt.isCorrect ? '#16a34a' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {opt.id.toUpperCase()}
                        </span>

                        {/* Input or Rich editor toggle */}
                        {!isRich ? (
                          <input
                            type="text"
                            value={stripHtml(opt.text)}
                            onChange={(e) => updateOption(idx, { text: e.target.value })}
                            placeholder={`Option ${opt.id.toUpperCase()}`}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '0.88rem',
                              fontWeight: opt.isCorrect ? 600 : 400,
                            }}
                          />
                        ) : (
                          <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Rich text editor active below
                          </span>
                        )}

                        {/* Rich format toggle */}
                        <button
                          type="button"
                          onClick={() => setRichOptionIds((p) => ({ ...p, [opt.id]: !isRich }))}
                          title={isRich ? 'Switch to simple text' : 'Format with rich text'}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 4,
                            color: isRich ? 'var(--accent)' : 'var(--text-muted)',
                            background: isRich ? 'var(--accent-light, rgba(0,0,0,0.06))' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Type size={14} />
                        </button>

                        {/* Delete option if > 2 */}
                        {value.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextOptions = value.options.filter((_, i) => i !== idx);
                              set('options', nextOptions);
                            }}
                            title="Delete option"
                            style={{
                              padding: '4px',
                              borderRadius: 4,
                              color: 'var(--text-muted)',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Expanded Rich Text Editor if toggled */}
                      {isRich && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                          <RichTextEditor
              disabled={disabled}
                            variant="inline"
                            value={opt.text}
                            onChange={(html) => updateOption(idx, { text: html })}
                            placeholder={`Option ${opt.id.toUpperCase()} text…`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {value.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextId = ['a', 'b', 'c', 'd', 'e', 'f'].find(id => !value.options.some(option => option.id === id))!;
                    set('options', [...value.options, { id: nextId, text: '', isCorrect: false }]);
                  }}
                  style={{
                    marginTop: 10,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: 0,
                  }}
                >
                  <Plus size={14} /> Add option ({String.fromCharCode(65 + value.options.length)})
                </button>
              )}
            </div>
          )}

          {/* Explanation & Solution */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Solution & Clinical Explanation (shown after submission)
            </label>
            <RichTextEditor
              disabled={disabled}
              variant="compact"
              value={value.explanation}
              onChange={(html) => set('explanation', html)}
              placeholder="Explain the correct answer, anatomical basis, and why other options are incorrect…"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Hints (optional, one per line)
            </label>
            <textarea
              rows={2}
              value={value.hints}
              onChange={(e) => set('hints', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="e.g. Look at the anatomic relationship near the surgical neck"
            />
          </div>
        </>
      )}

      {/* COMPACT SETTINGS & SCORING BAR */}
      <div className="section-editor-settings"
        style={{
          marginTop: 6,
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: type === 'question' ? '1fr 1fr 1.6fr 1fr' : '2fr 1fr',
          gap: 14,
          alignItems: 'center',
        }}
      >
        {type === 'question' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Marks (+)
              </label>
              <input
                type="number"
                value={value.marks}
                onChange={(e) => set('marks', e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Penalty (-)
              </label>
              <input
                type="number"
                value={value.negativeMarks}
                onChange={(e) => set('negativeMarks', e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-primary)' }}
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Required Access Tier
          </label>
          <select
            value={value.accessTier}
            onChange={(e) => set('accessTier', e.target.value as any)}
            style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-primary)', cursor: 'pointer' }}
          >
            <option value="free">Free Preview (All students)</option>
            <option value="basic">Basic Plan and above</option>
            <option value="plus">Plus Plan and above</option>
            <option value="premium">Premium Plan only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
          <input
            type="checkbox"
            id="section-published"
            checked={value.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <label htmlFor="section-published" style={{ fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
            Published
          </label>
        </div>
      </div>
    </div>
  );
};
