import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { HelpCircle, ArrowLeft, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';

export const Practice: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-questions', topicId],
    queryFn: () => api.get(`/practice/topic/${topicId}`),
    enabled: !!topicId,
  });

  const questions = data?.data?.data || [];
  const currentQ = questions[currentIdx];

  const handleSubmit = async () => {
    if (!selectedOpt || !currentQ) return;

    try {
      const res = await api.post('/practice/submit', {
        questionId: currentQ._id,
        selectedOptions: [selectedOpt],
      });
      setFeedback(res.data.data);
    } catch (err) {
      alert('Failed to evaluate answer');
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      alert('Practice Bank Complete! Great job 🎉');
      navigate(-1);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading question bank...</div>;

  if (questions.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No practice questions in this topic yet.</h3>
        <button onClick={() => navigate(-1)} style={{ marginTop: '16px', color: 'var(--accent)' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <StudentPageShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Question {currentIdx + 1} of {questions.length}
        </span>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <HtmlContent as="div" html={currentQ.questionText} style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 600 }} />

        {currentQ.questionImage && (
          <img
            src={currentQ.questionImage}
            alt="Anatomy Diagram"
            style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {currentQ.options?.map((opt: any) => (
            <button
              key={opt.id}
              onClick={() => !feedback && setSelectedOpt(opt.id)}
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
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--text-muted)',
                  borderColor: selectedOpt === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
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
            onClick={handleSubmit}
            disabled={!selectedOpt}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-full)',
              background: selectedOpt ? 'var(--accent)' : 'var(--bg-secondary)',
              color: selectedOpt ? 'var(--on-accent)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            Check Answer
          </button>
        ) : (
          <div>
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: feedback.isCorrect ? 'var(--success-light)' : 'var(--error-light)',
                color: feedback.isCorrect ? 'var(--success)' : 'var(--error)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
                {feedback.isCorrect ? 'Correct! +10 XP 🎯' : 'Incorrect'}
              </div>
              {feedback.explanation && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '8px' }}>
                  <strong>Explanation:</strong> <HtmlContent as="span" html={feedback.explanation} />
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Next Question <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </StudentPageShell>
  );
};
