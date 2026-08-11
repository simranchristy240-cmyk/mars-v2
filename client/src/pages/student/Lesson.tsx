import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { Play, CheckCircle2, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';

export const Lesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson-detail', id],
    queryFn: () => api.get(`/lessons/lessons/${id}`),
    enabled: !!id,
  });

  const lesson = data?.data?.data;
  const sections = lesson?.sections || [];
  const currentSection = sections[activeSectionIdx];

  const completeMutation = useMutation({
    mutationFn: (sectionId: string) =>
      api.put('/progress/section', {
        courseId: lesson.courseId,
        lessonId: lesson._id,
        sectionId,
      }),
  });

  const handleNextSection = () => {
    if (currentSection) {
      completeMutation.mutate(currentSection._id);
    }
    if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setFeedback(null);
    } else {
      alert('Lesson Completed! +50 XP Earned 🎉');
      navigate(`/course/${lesson.courseId}`);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!selectedOpt || !currentSection) return;
    try {
      const res = await api.post('/practice/submit', {
        questionId: currentSection._id,
        selectedOptions: [selectedOpt],
        courseId: lesson.courseId,
      });
      setFeedback(res.data.data);
    } catch (err: any) {
      alert('Error submitting answer');
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading lesson video & content...</div>;
  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        Topic Locked or Unauthorized. Purchase course to view lessons.
      </div>
    );
  }

  if (!lesson || sections.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No content in this lesson yet.</div>;
  }

  return (
    <StudentPageShell style={{ paddingBottom: '40px' }}>
      {/* Top Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          onClick={() => navigate(`/course/${lesson.courseId}`)}
          style={{ color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.05rem' }}>{lesson.title}</h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Section {activeSectionIdx + 1} of {sections.length}
          </div>
        </div>
      </div>

      {/* Section Content Display */}
      {currentSection && (
        <div style={{ padding: '20px 16px' }}>
          {/* VIDEO SECTION */}
          {currentSection.type === 'video' && (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  background: '#000',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <iframe
                  src={`https://player.vimeo.com/video/${currentSection.vimeoVideoId || '76979871'}?badge=0&autopause=0&player_id=0&app_id=58479#t=${currentSection.videoStartTime || 0}s`}
                  allow="autoplay; fullscreen; picture-in-in-picture"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title="Anatomy Lesson Video"
                />
              </div>
            </div>
          )}

          {/* TEXT SECTION */}
          {currentSection.type === 'text' && (
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{
                __html: currentSection.text || '<p>Study Notes: Pay close attention to domain structures and anatomical references in the video.</p>',
              }}
            />
          )}

          {/* INLINE QUESTION SECTION */}
          {currentSection.type === 'question' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                <HelpCircle size={14} /> INLINE QUESTION
              </div>

              <HtmlContent
                as="div"
                html={currentSection.questionText}
                style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}
              />

              {currentSection.questionImage && (
                <img
                  src={currentSection.questionImage}
                  alt="Anatomy Diagram"
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {currentSection.options?.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOpt(opt.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedOpt === opt.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${selectedOpt === opt.id ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        border: '2px solid var(--text-muted)',
                        borderColor: selectedOpt === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {opt.id.toUpperCase()}
                    </div>
                    <HtmlContent html={opt.text} style={{ flex: 1 }} />
                  </button>
                ))}
              </div>

              {!feedback ? (
                <button
                  onClick={handleQuestionSubmit}
                  disabled={!selectedOpt}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: selectedOpt ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: 'var(--on-accent)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: feedback.isCorrect ? 'var(--success-light)' : 'var(--error-light)',
                    color: feedback.isCorrect ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                    {feedback.isCorrect ? 'Correct Answer! +10 XP' : 'Incorrect'}
                  </div>
                  {feedback.explanation && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '6px' }}>
                      <strong>Explanation:</strong>{' '}
                      <HtmlContent as="span" html={feedback.explanation} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={handleNextSection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--course-play-shadow, 0 4px 14px rgba(0, 0, 0, 0.2))',
              }}
            >
              {activeSectionIdx < sections.length - 1 ? 'Next Section' : 'Finish Lesson'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </StudentPageShell>
  );
};
