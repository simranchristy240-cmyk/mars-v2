import React from 'react';
import { BookOpen, ChevronDown, ChevronUp, Edit3, Layers, Plus } from 'lucide-react';

interface Props {
  course: any;
  onEditCourse: () => void;
  onAddTopic: () => void;
  onSelectTopic: (topicId: string) => void;
  onMoveTopic?: (topicId: string, direction: 'up' | 'down') => void;
}

export const AuthorCourseOverview: React.FC<Props> = ({
  course,
  onEditCourse,
  onAddTopic,
  onSelectTopic,
  onMoveTopic,
}) => {
  const topics = course?.topics || [];
  const basicPrice = course?.pricing?.basic?.price ? Math.round(course.pricing.basic.price / 100) : 499;
  const plusPrice = course?.pricing?.plus?.price ? Math.round(course.pricing.plus.price / 100) : 999;
  const premiumPrice = course?.pricing?.premium?.price ? Math.round(course.pricing.premium.price / 100) : 1499;

  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="cb-overview-card">
        <div className="cb-overview-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="ui-chip is-gold" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                COURSE SYLLABUS
              </span>
              <span className={`ui-chip is-sm ${course.isPublished ? 'is-success' : 'is-warning'}`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="cb-overview-title">{course.title || 'Untitled Course'}</h1>
            <p className="cb-overview-desc">
              {course.description || 'Comprehensive medical anatomy curriculum for MBBS, BDS, and AYUSH learners.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="ui-btn is-outline is-sm"
              onClick={onEditCourse}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Edit3 size={13} /> Edit Course
            </button>
            <button
              type="button"
              className="ui-btn is-primary is-sm"
              onClick={onAddTopic}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Add Chapter
            </button>
          </div>
        </div>

        {/* Pricing Tiers Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            borderTop: '1px solid var(--border-color)',
            paddingTop: 18,
          }}
        >
          <div className="ui-tile" style={{ padding: '12px 16px', background: 'var(--bg-secondary)' }}>
            <div className="ui-faint" style={{ fontSize: '0.74rem', fontWeight: 700 }}>BASIC TIER</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>₹{basicPrice}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Full Video Lectures</div>
          </div>

          <div className="ui-tile" style={{ padding: '12px 16px', background: 'var(--bg-secondary)' }}>
            <div className="ui-faint" style={{ fontSize: '0.74rem', fontWeight: 700 }}>PLUS TIER</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>₹{plusPrice}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Videos + PDF Notes</div>
          </div>

          <div className="ui-tile" style={{ padding: '12px 16px', background: 'var(--bg-secondary)' }}>
            <div className="ui-faint" style={{ fontSize: '0.74rem', fontWeight: 700 }}>PREMIUM TIER</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>₹{premiumPrice}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>All Access + Test Series</div>
          </div>
        </div>
      </div>

      {/* Chapters in this Course */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            Curriculum Chapters ({topics.length})
          </h2>
          <button type="button" className="ui-btn is-ghost is-sm" onClick={onAddTopic}>
            <Plus size={13} /> Add Chapter
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="ui-tile" style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 12px' }}>No chapters in this course yet.</p>
            <button type="button" className="ui-btn is-primary is-sm" onClick={onAddTopic}>
              <Plus size={13} /> Add First Chapter
            </button>
          </div>
        ) : (
          <div className="cb-syllabus-grid">
            {topics.map((t: any, idx: number) => {
              const lesCount = t.lessons?.length || 0;
              const qCount = t.practiceQuestions?.length || 0;
              return (
                <div
                  key={t._id || idx}
                  className="cb-syllabus-item"
                  onClick={() => onSelectTopic(t._id)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className="ui-faint" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                        {idx + 1}.
                      </span>
                      <span className="ui-truncate" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {t.title || 'Untitled Chapter'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="ui-chip is-sm" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {lesCount} {lesCount === 1 ? 'lesson' : 'lessons'}
                      </span>
                      {qCount > 0 && (
                        <span className="ui-chip is-sm is-gold" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          {qCount} practice Qs
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 10 }}>
                    {onMoveTopic && idx > 0 && (
                      <button
                        type="button"
                        className="ui-icon-btn is-ghost is-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveTopic(t._id, 'up');
                        }}
                        title="Move Chapter Up"
                        style={{ width: 28, height: 28, borderRadius: 6 }}
                      >
                        <ChevronUp size={14} />
                      </button>
                    )}
                    {onMoveTopic && idx < topics.length - 1 && (
                      <button
                        type="button"
                        className="ui-icon-btn is-ghost is-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveTopic(t._id, 'down');
                        }}
                        title="Move Chapter Down"
                        style={{ width: 28, height: 28, borderRadius: 6 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                    <Layers size={18} color="var(--primary)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
