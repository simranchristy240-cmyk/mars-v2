import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trophy, CheckCircle, XCircle, Clock, ArrowLeft, BarChart2 } from 'lucide-react';
import { StudentPageShell } from '../../components/layout/StudentPageShell';
import { HtmlContent } from '../../components/RichTextEditor';

export const TestReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['test-report', id],
    queryFn: () => api.get(`/tests/${id}/report`),
    enabled: !!id,
  });

  const reportData = data?.data?.data;
  const attempt = reportData?.attempt;
  const test = reportData?.test;

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Generating test report...</div>;
  if (!attempt) return <div style={{ padding: '40px', textAlign: 'center' }}>Test attempt report not found</div>;

  return (
    <StudentPageShell>
      <button
        onClick={() => navigate('/reports')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: '16px' }}
      >
        <ArrowLeft size={18} /> Back to Reports Dashboard
      </button>

      {/* Summary Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--leaderboard-gold-bg)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Trophy size={36} />
        </div>

        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{test?.title || 'Test Attempt Report'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Submitted on {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString()}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
              {attempt.score} / {attempt.totalMarks}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Percentage</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
              {attempt.percentage}%
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rank</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)' }}>
              #{attempt.rank || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Review */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Question-by-Question Review</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {attempt.answers?.map((ans: any, idx: number) => {
          const q = ans.questionId;
          if (!q) return null;

          const correctOpts = (q.options || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
          const isCorrect =
            correctOpts.length === (ans.selectedOptions || []).length &&
            correctOpts.every((id: string) => (ans.selectedOptions || []).includes(id));

          return (
            <div
              key={q._id || idx}
              className="glass-card"
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Question {idx + 1}
                </span>

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: isCorrect ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <HtmlContent as="div" html={q.questionText} style={{ fontSize: '1.05rem', marginBottom: '14px', fontWeight: 600 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {q.options?.map((opt: any) => {
                  const wasSelected = ans.selectedOptions?.includes(opt.id);
                  const isOptCorrect = opt.isCorrect;

                  let bg = 'var(--bg-primary)';
                  let color = 'var(--text-primary)';
                  if (isOptCorrect) {
                    bg = 'var(--success-light)';
                    color = 'var(--success)';
                  } else if (wasSelected && !isOptCorrect) {
                    bg = 'var(--error-light)';
                    color = 'var(--error)';
                  }

                  return (
                    <div
                      key={opt.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-xs)',
                        background: bg,
                        color,
                        fontSize: '0.9rem',
                        fontWeight: isOptCorrect || wasSelected ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <span style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span>{opt.id.toUpperCase()}.</span>
                        <HtmlContent html={opt.text} />
                      </span>
                      {isOptCorrect && <span style={{ fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>CORRECT ANSWER</span>}
                      {wasSelected && !isOptCorrect && <span style={{ fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>YOUR CHOICE</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Explanation:</strong> <HtmlContent as="span" html={q.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StudentPageShell>
  );
};
