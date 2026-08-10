import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Clock, Bookmark, Flag, ChevronLeft, ChevronRight, CheckCircle2, Grid } from 'lucide-react';
import { HtmlContent } from '../../components/RichTextEditor';

export const TestAttempt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [testData, setTestData] = useState<any>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [showNavGrid, setShowNavGrid] = useState(false);

  useEffect(() => {
    const fetchStart = async () => {
      try {
        const res = await api.post(`/tests/${id}/start`);
        const { test, attempt } = res.data.data;
        setTestData(test);
        setTimeLeftSeconds(test.duration * 60);

        // Populate existing answers if resuming
        const ansMap: Record<string, string[]> = {};
        const flagMap: Record<string, boolean> = {};
        attempt.answers?.forEach((a: any) => {
          ansMap[a.questionId] = a.selectedOptions || [];
          if (a.isMarkedForReview) flagMap[a.questionId] = true;
        });
        setAnswers(ansMap);
        setFlagged(flagMap);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to start test attempt');
        navigate(-1);
      }
    };

    if (id) fetchStart();
  }, [id]);

  // Timer Countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  if (!testData) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading test environment...</div>;

  const currentSection = testData.sections[currentSectionIdx];
  const allQuestions = currentSection?.questions || [];
  const currentQ = allQuestions[currentQIdx];

  const handleSelectOption = (optId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: [optId],
    }));

    // Auto-save answer to server
    api.put(`/tests/${id}/answer`, {
      questionId: currentQ._id,
      selectedOptions: [optId],
      isMarkedForReview: !!flagged[currentQ._id],
    });
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    const newFlagged = !flagged[currentQ._id];
    setFlagged((prev) => ({ ...prev, [currentQ._id]: newFlagged }));

    api.put(`/tests/${id}/answer`, {
      questionId: currentQ._id,
      selectedOptions: answers[currentQ._id] || [],
      isMarkedForReview: newFlagged,
    });
  };

  const handleFinalSubmit = async (isAuto = false) => {
    const confirmSub = isAuto || window.confirm('Are you sure you want to submit your test attempt?');
    if (confirmSub) {
      try {
        await api.post(`/tests/${id}/submit`, { isAutoSubmitted: isAuto });
        alert(isAuto ? 'Time expired! Test auto-submitted.' : 'Test submitted successfully!');
        navigate(`/tests/${id}/report`);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error submitting test');
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      {/* Test Header */}
      <header
        style={{
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem' }}>{testData.title}</h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Section {currentSectionIdx + 1}: {currentSection.name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Countdown Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: timeLeftSeconds < 300 ? 'var(--error-light)' : 'var(--accent-light)',
              color: timeLeftSeconds < 300 ? 'var(--error)' : 'var(--accent)',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            <Clock size={18} /> {formatTime(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowNavGrid(!showNavGrid)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
            }}
          >
            <Grid size={18} /> Grid
          </button>

          <button
            onClick={() => handleFinalSubmit(false)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px 20px 40px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {/* Navigation Grid Modal / Drawer */}
        {showNavGrid && (
          <div
            className="glass-card"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Question Navigation Grid
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: '8px' }}>
              {allQuestions.map((q: any, idx: number) => {
                const isAnswered = !!(answers[q._id] && answers[q._id].length > 0);
                const isFlagged = !!flagged[q._id];
                const isCurrent = idx === currentQIdx;

                return (
                  <button
                    key={q._id}
                    onClick={() => {
                      setCurrentQIdx(idx);
                      setShowNavGrid(false);
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-xs)',
                      background: isCurrent
                        ? 'var(--accent)'
                        : isFlagged
                        ? 'var(--warning-light)'
                        : isAnswered
                        ? 'var(--success-light)'
                        : 'var(--bg-secondary)',
                      color: isCurrent
                        ? 'var(--on-accent)'
                        : isFlagged
                        ? 'var(--warning)'
                        : isAnswered
                        ? 'var(--success)'
                        : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-color)'}`,
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Item Card */}
        {currentQ && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                Question {currentQIdx + 1} of {allQuestions.length} ({currentQ.marks || 1} Marks)
              </span>

              <button
                onClick={toggleFlag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: flagged[currentQ._id] ? 'var(--warning)' : 'var(--text-secondary)',
                }}
              >
                <Flag size={16} fill={flagged[currentQ._id] ? 'currentColor' : 'none'} />
                {flagged[currentQ._id] ? 'Flagged for Review' : 'Mark for Review'}
              </button>
            </div>

            <HtmlContent
              as="div"
              html={currentQ.questionText}
              style={{ fontSize: '1.2rem', marginBottom: '20px', lineHeight: 1.4, fontWeight: 600 }}
            />

            {currentQ.questionImage && (
              <img
                src={currentQ.questionImage}
                alt="Diagram"
                style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {currentQ.options?.map((opt: any) => {
                const isSelected = answers[currentQ._id]?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
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
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                        color: isSelected ? 'var(--on-accent)' : 'var(--text-muted)',
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
                );
              })}
            </div>

            {/* Bottom Nav Bar within Question */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentQIdx === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  opacity: currentQIdx === 0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <button
                onClick={() => setCurrentQIdx((prev) => Math.min(allQuestions.length - 1, prev + 1))}
                disabled={currentQIdx === allQuestions.length - 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontWeight: 700,
                  opacity: currentQIdx === allQuestions.length - 1 ? 0.4 : 1,
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
