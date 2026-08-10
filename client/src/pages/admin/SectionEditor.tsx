import React, { useEffect } from 'react';
import { RichTextEditor, isHtmlEmpty, stripHtml } from '../../components/RichTextEditor';

export type QuestionType = 'single-mcq' | 'multi-mcq' | 'true-false' | 'match' | 'image-based';
export type SectionType = 'video' | 'text' | 'question';

export interface SectionFormValues {
  type: SectionType;
  title: string;
  isPublished: boolean;
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
    payload.marks = parseFloat(form.marks) || 1;
    payload.negativeMarks = parseFloat(form.negativeMarks) || 0;

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

  return payload;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

interface SectionEditorProps {
  value: SectionFormValues;
  onChange: (next: SectionFormValues) => void;
  allowTypeChange?: boolean;
  forceType?: SectionType;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  value,
  onChange,
  allowTypeChange = true,
  forceType,
}) => {
  const type = forceType || value.type;

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

  return (
    <div>
      {allowTypeChange && !forceType && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['video', 'text', 'question'] as SectionType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => set('type', t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-xs)',
                background: type === t ? 'var(--accent)' : 'var(--bg-secondary)',
                color: type === t ? 'var(--on-accent)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Title / Name</label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          style={inputStyle}
          placeholder={type === 'video' ? 'Video name' : type === 'question' ? 'Question title' : 'Section title'}
        />
      </div>

      {type === 'video' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Vimeo Video ID</label>
            <input
              type="text"
              required
              value={value.vimeoVideoId}
              onChange={(e) => set('vimeoVideoId', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Start (sec)</label>
              <input
                type="number"
                value={value.videoStartTime}
                onChange={(e) => set('videoStartTime', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>End (sec)</label>
              <input
                type="number"
                value={value.videoEndTime}
                onChange={(e) => set('videoEndTime', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </>
      )}

      {type === 'text' && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Study notes / content</label>
          <RichTextEditor
            variant="full"
            value={value.text}
            onChange={(html) => set('text', html)}
            placeholder="Write lesson notes, clinical pearls, key points…"
          />
        </div>
      )}

      {type === 'question' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Question Type</label>
            <select
              value={value.questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              style={inputStyle}
            >
              <option value="single-mcq">Single MCQ</option>
              <option value="multi-mcq">Multi MCQ</option>
              <option value="true-false">True / False</option>
              <option value="match">Match the following</option>
              <option value="image-based">Image-based</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Question Text</label>
            <RichTextEditor
              variant="compact"
              value={value.questionText}
              onChange={(html) => set('questionText', html)}
              placeholder="Enter the question stem…"
            />
          </div>

          {value.questionType === 'image-based' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Question Image URL</label>
              <input
                type="text"
                value={value.questionImage}
                onChange={(e) => set('questionImage', e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {value.questionType === 'match' ? (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px' }}>Match Pairs</label>
              {value.matchPairs.map((pair, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <RichTextEditor
                    variant="inline"
                    value={pair.left}
                    onChange={(html) => {
                      const matchPairs = value.matchPairs.map((p, i) => (i === idx ? { ...p, left: html } : p));
                      set('matchPairs', matchPairs);
                    }}
                    placeholder="Left item"
                  />
                  <RichTextEditor
                    variant="inline"
                    value={pair.right}
                    onChange={(html) => {
                      const matchPairs = value.matchPairs.map((p, i) => (i === idx ? { ...p, right: html } : p));
                      set('matchPairs', matchPairs);
                    }}
                    placeholder="Right item"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('matchPairs', [...value.matchPairs, { left: '', right: '' }])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                + Add pair
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px' }}>
                Options {value.questionType === 'multi-mcq' ? '(select all correct)' : '(select correct)'}
              </label>
              {value.options.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <input
                    type={value.questionType === 'multi-mcq' ? 'checkbox' : 'radio'}
                    name="correct-opt"
                    checked={opt.isCorrect}
                    onChange={() =>
                      updateOption(
                        idx,
                        value.questionType === 'multi-mcq'
                          ? { isCorrect: !opt.isCorrect }
                          : { isCorrect: true }
                      )
                    }
                    style={{ width: 16, height: 16, marginTop: 12 }}
                  />
                  <div style={{ flex: 1 }}>
                    {value.questionType === 'true-false' ? (
                      <input type="text" value={opt.text} disabled style={inputStyle} />
                    ) : (
                      <RichTextEditor
                        variant="inline"
                        value={opt.text}
                        onChange={(html) => updateOption(idx, { text: html })}
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                      />
                    )}
                  </div>
                </div>
              ))}
              {value.questionType !== 'true-false' && value.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextId = String.fromCharCode(97 + value.options.length);
                    set('options', [...value.options, { id: nextId, text: '', isCorrect: false }]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Hints (one per line)</label>
            <textarea rows={2} value={value.hints} onChange={(e) => set('hints', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Solution / Explanation</label>
            <RichTextEditor
              variant="compact"
              value={value.explanation}
              onChange={(html) => set('explanation', html)}
              placeholder="Explain the correct answer…"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Marks</label>
              <input type="number" value={value.marks} onChange={(e) => set('marks', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Negative Marks</label>
              <input
                type="number"
                value={value.negativeMarks}
                onChange={(e) => set('negativeMarks', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <input
          type="checkbox"
          id="section-published"
          checked={value.isPublished}
          onChange={(e) => set('isPublished', e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        <label htmlFor="section-published" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
          Published (visible to students)
        </label>
      </div>
    </div>
  );
};
