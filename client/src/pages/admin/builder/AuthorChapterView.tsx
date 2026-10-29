import React from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileQuestion,
  FileText,
  HelpCircle,
  PlayCircle,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';

interface Props {
  topic: any;
  onEditTopic: () => void;
  onAddLesson: () => void;
  onSelectLesson: (lessonId: string) => void;
  onSelectPractice: () => void;
  onAddPracticeQuestion: () => void;
  onSelectTest: (testId: string) => void;
  onAddTest: () => void;
  onMoveLesson?: (lessonId: string, direction: 'up' | 'down') => void;
}

export const AuthorChapterView: React.FC<Props> = ({
  topic,
  onEditTopic,
  onAddLesson,
  onSelectLesson,
  onSelectPractice,
  onAddPracticeQuestion,
  onSelectTest,
  onAddTest,
  onMoveLesson,
}) => {
  const lessons = topic?.lessons || [];
  const practiceCount = topic?.practiceQuestions?.length || 0;

  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Chapter Hero Card ────────────────────────────────────────── */}
      <div className="cb-overview-card">
        <div className="cb-overview-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="ui-chip is-gold" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                CHAPTER OVERVIEW
              </span>
              {topic.isFree && <span className="ui-chip is-success is-sm">Free Trial</span>}
              <span className={`ui-chip is-sm ${topic.isPublished !== false ? 'is-success' : 'is-warning'}`}>
                {topic.isPublished !== false ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="cb-overview-title">{topic.title || 'Untitled Chapter'}</h1>
            <p className="cb-overview-desc">
              {topic.description || 'Core anatomical topics, clinical implications, and high-yield question drills.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="ui-btn is-outline is-sm"
              onClick={onEditTopic}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Edit3 size={13} /> Edit Chapter
            </button>
            <button
              type="button"
              className="ui-btn is-primary is-sm"
              onClick={onAddLesson}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Add Lesson
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            borderTop: '1px solid var(--border-color)',
            paddingTop: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={20} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{lessons.length}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Lessons</div>
            </div>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={onSelectPractice}
          >
            <Zap size={20} color="var(--ui-gold, #f59e0b)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{practiceCount}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Practice Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Lessons in this Chapter ───────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            Chapter Lessons ({lessons.length})
          </h2>
          <button
            type="button"
            className="ui-btn is-ghost is-sm"
            onClick={onAddLesson}
          >
            <Plus size={13} /> Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div
            className="ui-tile"
            style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            <p style={{ margin: '0 0 12px' }}>No lessons added to this chapter yet.</p>
            <button type="button" className="ui-btn is-primary is-sm" onClick={onAddLesson}>
              <Plus size={13} /> Add First Lesson
            </button>
          </div>
        ) : (
          <div className="cb-syllabus-grid">
            {lessons.map((les: any, idx: number) => {
              const secCount = les.sections?.length || 0;
              const hasNotes = !!les.notesFile?.filename;
              return (
                <div
                  key={les._id || idx}
                  className="cb-syllabus-item"
                  onClick={() => onSelectLesson(les._id)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className="ui-faint" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                        {idx + 1}.
                      </span>
                      <span className="ui-truncate" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {les.title || 'Untitled Lesson'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="ui-chip is-sm" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {secCount} {secCount === 1 ? 'section' : 'sections'}
                      </span>
                      {hasNotes && (
                        <span className="ui-chip is-sm is-gold" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          <FileText size={10} /> PDF Notes
                        </span>
                      )}
                      <span className="ui-faint" style={{ fontSize: '0.72rem' }}>
                        {les.accessTier || 'free'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 10 }}>
                    {onMoveLesson && idx > 0 && (
                      <button
                        type="button"
                        className="ui-icon-btn is-ghost is-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLesson(les._id, 'up');
                        }}
                        title="Move Lesson Up"
                        style={{ width: 28, height: 28, borderRadius: 6 }}
                      >
                        <ChevronUp size={14} />
                      </button>
                    )}
                    {onMoveLesson && idx < lessons.length - 1 && (
                      <button
                        type="button"
                        className="ui-icon-btn is-ghost is-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLesson(les._id, 'down');
                        }}
                        title="Move Lesson Down"
                        style={{ width: 28, height: 28, borderRadius: 6 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                    <PlayCircle size={18} color="var(--primary)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Practice Drills Card ─────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            Chapter Practice Bank
          </h2>
          <button
            type="button"
            className="ui-btn is-ghost is-sm"
            onClick={onAddPracticeQuestion}
          >
            <Plus size={13} /> Add Question
          </button>
        </div>

        <div
          className="ui-tile"
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            cursor: 'pointer',
          }}
          onClick={onSelectPractice}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>
                Practice Questions: {topic.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {practiceCount} {practiceCount === 1 ? 'question' : 'questions'} available for students.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ui-btn is-outline is-sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPractice();
            }}
          >
            Open Practice Runner
          </button>
        </div>
      </div>
    </div>
  );
};
