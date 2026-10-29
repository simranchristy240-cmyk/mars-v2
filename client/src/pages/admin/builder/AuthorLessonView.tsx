import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Columns,
  ExternalLink,
  FileText,
  Flag,
  HelpCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { QuestionAnswer } from '../../../components/QuestionAnswer';
import { HtmlContent } from '../../../components/RichTextEditor';
import { PdfNotesViewer } from '../../../components/lesson/PdfNotesViewer';
import { VimeoPlayer, formatTime } from '../../../components/lesson/VimeoPlayer';
import { BuilderHeader } from './BuilderHeader';
import '../../../styles/pages/lesson.css';

interface Props {
  lesson: any;
  topicTitle?: string;
  activeSectionIdx: number;
  onSelectSectionIdx: (idx: number) => void;
  onEditLesson: () => void;
  onEditSection: (section: any) => void;
  onAddSection: (type?: 'video' | 'text' | 'question') => void;
  onDeleteSection: (sectionId: string) => void;
  onBackToOverview: () => void;
}

export const AuthorLessonView: React.FC<Props> = ({
  lesson,
  topicTitle,
  activeSectionIdx,
  onSelectSectionIdx,
  onEditLesson,
  onEditSection,
  onAddSection,
  onDeleteSection,
  onBackToOverview,
}) => {
  const sections = lesson?.sections || [];
  const currentSection = sections[activeSectionIdx] || sections[0];
  const hasNotes = !!lesson?.notesFile?.filename;
  const isVideo = currentSection?.type === 'video';

  const [splitMode, setSplitMode] = useState<'split' | 'video' | 'notes'>('split');
  const [selectedOpt, setSelectedOpt] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const videoTileRef = useRef<HTMLDivElement | null>(null);
  const [videoTileHeight, setVideoTileHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    setSelectedOpt([]);
    setFeedback(null);
  }, [activeSectionIdx, lesson?._id]);

  // Sync split view height between video and PDF notes
  useEffect(() => {
    const el = videoTileRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const syncHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 120) setVideoTileHeight(h);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [currentSection, splitMode]);

  const handlePrev = () => {
    if (activeSectionIdx > 0) onSelectSectionIdx(activeSectionIdx - 1);
  };

  const handleNext = () => {
    if (activeSectionIdx < sections.length - 1) {
      onSelectSectionIdx(activeSectionIdx + 1);
    }
  };

  const isLast = activeSectionIdx === sections.length - 1;

  return (
    <div className={`les-wrap ${hasNotes && isVideo && splitMode !== 'video' ? 'is-wide' : ''}`}>
      {/* ─── Standard Minimalist Header (Icon-only Edit & Add) ─────────── */}
      <BuilderHeader
        current={activeSectionIdx + 1}
        total={sections.length}
        title={lesson.title || 'Untitled Lesson'}
        onBack={onBackToOverview}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={activeSectionIdx > 0}
        hasNext={activeSectionIdx < sections.length - 1}
        onEdit={() => currentSection && onEditSection(currentSection)}
        onAdd={() => onAddSection()}
        editTitle={currentSection ? `Edit Section: ${currentSection.title || `Part ${activeSectionIdx + 1}`}` : 'Edit Section'}
        addTitle="Add Section"
        extraRight={
          hasNotes && isVideo ? (
            <div className="lesson-segmented-control" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'split'}
                className={`lesson-segment-btn ${splitMode === 'split' ? 'is-active' : ''}`}
                onClick={() => setSplitMode('split')}
                title="Side-by-side video and notes"
              >
                <Columns size={13} /> Split
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'video'}
                className={`lesson-segment-btn ${splitMode === 'video' ? 'is-active' : ''}`}
                onClick={() => setSplitMode('video')}
                title="Focus on video"
              >
                <PlayCircle size={13} /> Video
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={splitMode === 'notes'}
                className={`lesson-segment-btn ${splitMode === 'notes' ? 'is-active' : ''}`}
                onClick={() => setSplitMode('notes')}
                title="Focus on notes"
              >
                <FileText size={13} /> Notes
              </button>
            </div>
          ) : undefined
        }
      />

      {/* ─── Section Progress Strip ────────────────────────────────────── */}
      {sections.length > 1 && (
        <div style={{ display: 'flex', gap: 4, width: '100%', marginBottom: 4 }}>
          {sections.map((sec: any, idx: number) => (
            <div
              key={sec._id || idx}
              onClick={() => onSelectSectionIdx(idx)}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                cursor: 'pointer',
                background:
                  idx === activeSectionIdx
                    ? 'var(--primary, #6366f1)'
                    : idx < activeSectionIdx
                      ? 'var(--tile-muted, rgba(99, 102, 241, 0.35))'
                      : 'var(--border-color, rgba(0, 0, 0, 0.08))',
                transition: 'background 0.2s ease',
              }}
              title={`${idx + 1}. ${sec.title || (sec.type === 'video' ? 'Video' : sec.type === 'text' ? 'Reading' : 'Question')}`}
            />
          ))}
        </div>
      )}

      {/* ─── If No Sections in Lesson ──────────────────────────────────── */}
      {sections.length === 0 ? (
        <div
          className="ui-tile"
          style={{
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <BookOpen size={40} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px' }}>No Sections Yet</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Add video clips, readings, or quick check questions to this lesson.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="ui-btn is-primary"
              onClick={() => onAddSection('video')}
            >
              <PlayCircle size={14} style={{ marginRight: 6 }} /> Add Video Clip
            </button>
            <button
              type="button"
              className="ui-btn is-outline"
              onClick={() => onAddSection('text')}
            >
              <FileText size={14} style={{ marginRight: 6 }} /> Add Reading
            </button>
            <button
              type="button"
              className="ui-btn is-outline"
              onClick={() => onAddSection('question')}
            >
              <HelpCircle size={14} style={{ marginRight: 6 }} /> Add Question
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── VIDEO SECTION ─────────────────────────────────────────── */}
          {currentSection.type === 'video' && (
            hasNotes ? (
              <div className="lesson-split-container">
                <div
                  className="lesson-split-grid"
                  data-split={splitMode}
                  style={splitMode === 'notes' ? { gridTemplateColumns: '0 1fr' } : undefined}
                >
                  <div
                    ref={videoTileRef}
                    className="lesson-video-pane"
                    style={splitMode === 'notes' ? { display: 'none' } : undefined}
                  >
                    <section className="ui-tile is-flush les-video-tile">
                      <div className="les-video-frame">
                        <VimeoPlayer
                          vimeoVideoId={currentSection.vimeoVideoId || '76979871'}
                          startTime={currentSection.videoStartTime || 0}
                          endTime={currentSection.videoEndTime}
                          title={currentSection.title || 'Anatomy Video'}
                        />
                      </div>
                      <div className="les-video-bottom-bar">
                        <div className="les-nav-left">
                          {activeSectionIdx > 0 && (
                            <button
                              type="button"
                              className="ui-btn is-outline is-sm les-nav-btn"
                              onClick={handlePrev}
                            >
                              <ArrowLeft size={14} /> Previous
                            </button>
                          )}
                          <span className="les-video-caption-text" title={currentSection.title || 'Video Lesson'}>
                            {currentSection.title || 'Video Lesson'}
                          </span>
                          {currentSection.videoEndTime && (
                            <span className="les-clip-time-pill" title="Section duration">
                              {formatTime(currentSection.videoStartTime || 0)} – {formatTime(currentSection.videoEndTime)}
                            </span>
                          )}
                        </div>

                        <div className="les-nav-right">
                          <button
                            type="button"
                            className={`ui-btn is-sm les-nav-btn ${isLast ? 'is-gold' : 'is-primary'}`}
                            onClick={handleNext}
                          >
                            {isLast ? <><Flag size={14} /> Finish lesson (+50 XP)</> : <>Next section <ArrowRight size={14} /></>}
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div
                    className="lesson-notes-pane"
                    style={splitMode === 'split' && videoTileHeight ? { height: `${videoTileHeight}px` } : undefined}
                  >
                    <PdfNotesViewer
                      lessonId={lesson._id}
                      notesTitle={lesson.notesFile?.originalName || 'Lesson Notes'}
                      isMaximized={splitMode === 'notes'}
                      onToggleMaximize={() => setSplitMode(splitMode === 'notes' ? 'split' : 'notes')}
                      matchedHeight={splitMode === 'split' ? videoTileHeight : undefined}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <section className="ui-tile is-flush les-video-tile">
                  <div className="les-video-frame">
                    <VimeoPlayer
                      vimeoVideoId={currentSection.vimeoVideoId || '76979871'}
                      startTime={currentSection.videoStartTime || 0}
                      endTime={currentSection.videoEndTime}
                      title={currentSection.title || 'Anatomy Video'}
                    />
                  </div>
                  <div className="les-video-bottom-bar">
                    <div className="les-nav-left">
                      {activeSectionIdx > 0 && (
                        <button
                          type="button"
                          className="ui-btn is-outline is-sm les-nav-btn"
                          onClick={handlePrev}
                        >
                          <ArrowLeft size={14} /> Previous
                        </button>
                      )}
                      <span className="les-video-caption-text" title={currentSection.title || 'Video Lesson'}>
                        {currentSection.title || 'Video Lesson'}
                      </span>
                      {currentSection.videoEndTime && (
                        <span className="les-clip-time-pill" title="Section duration">
                          {formatTime(currentSection.videoStartTime || 0)} – {formatTime(currentSection.videoEndTime)}
                        </span>
                      )}
                    </div>

                    <div className="les-nav-right">
                      <button
                        type="button"
                        className={`ui-btn is-sm les-nav-btn ${isLast ? 'is-gold' : 'is-primary'}`}
                        onClick={handleNext}
                      >
                        {isLast ? <><Flag size={14} /> Finish lesson (+50 XP)</> : <>Next section <ArrowRight size={14} /></>}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )
          )}

          {/* ─── TEXT / READING SECTION ─────────────────────────────────── */}
          {currentSection.type === 'text' && (
            <div>
              <section className="ui-tile les-reading">
                {currentSection.title && <h2 className="ui-title-lg les-reading-title">{currentSection.title}</h2>}
                <div
                  className="les-prose"
                  dangerouslySetInnerHTML={{
                    __html: currentSection.text || '<p>Study Notes: Enter key concepts and clinical takeaways.</p>',
                  }}
                />
                <div className="les-section-nav">
                  <div>
                    {activeSectionIdx > 0 && (
                      <button
                        type="button"
                        className="ui-btn is-outline is-sm les-nav-btn"
                        onClick={handlePrev}
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`ui-btn is-sm les-nav-btn ${isLast ? 'is-gold' : 'is-primary'}`}
                    onClick={handleNext}
                  >
                    {isLast ? <><Flag size={14} /> Finish lesson (+50 XP)</> : <>Next section <ArrowRight size={14} /></>}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ─── QUICK CHECK QUESTION SECTION ───────────────────────────── */}
          {currentSection.type === 'question' && (
            <div>
              <section className="ui-tile les-question">
                <div className="ui-tile-head">
                  <span className="ui-chip is-gold">
                    <HelpCircle size={13} /> Quick check
                  </span>
                  {!feedback && <span className="ui-faint">Interactive preview — test answer below</span>}
                </div>

                <HtmlContent as="div" html={currentSection.questionText} className="les-question-text" />

                {currentSection.questionImage && (
                  <img src={currentSection.questionImage} alt="Anatomy Diagram" className="les-question-img" />
                )}

                <QuestionAnswer
                  question={currentSection}
                  value={selectedOpt}
                  onChange={setSelectedOpt}
                  disabled={false}
                />

                {!feedback ? (
                  <button
                    type="button"
                    className="ui-btn is-primary is-lg les-submit"
                    disabled={selectedOpt.length === 0}
                    onClick={() => {
                      const isCorrect = (currentSection.options || [])
                        .filter((o: any) => o.isCorrect)
                        .every((o: any) => selectedOpt.includes(o.id));
                      setFeedback({
                        isCorrect,
                        explanation: currentSection.explanation || 'Review the anatomical relationships and landmarks.',
                      });
                    }}
                  >
                    Submit response
                  </button>
                ) : (
                  <div className={`les-feedback ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    <div className="les-feedback-head">
                      {feedback.isCorrect ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}
                      <strong>{feedback.isCorrect ? 'Correct response' : 'Incorrect response'}</strong>
                    </div>
                    {feedback.explanation && (
                      <p className="les-feedback-body">{feedback.explanation}</p>
                    )}
                    <button
                      type="button"
                      className="ui-btn is-ghost is-sm"
                      onClick={() => { setFeedback(null); setSelectedOpt([]); }}
                    >
                      Reset and try again
                    </button>
                  </div>
                )}

                <div className="les-section-nav" style={{ marginTop: 20 }}>
                  <div>
                    {activeSectionIdx > 0 && (
                      <button
                        type="button"
                        className="ui-btn is-outline is-sm les-nav-btn"
                        onClick={handlePrev}
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`ui-btn is-sm les-nav-btn ${isLast ? 'is-gold' : 'is-primary'}`}
                    onClick={handleNext}
                  >
                    {isLast ? <><Flag size={14} /> Finish lesson (+50 XP)</> : <>Next section <ArrowRight size={14} /></>}
                  </button>
                </div>
              </section>
            </div>
          )}

        </>
      )}
    </div>
  );
};
