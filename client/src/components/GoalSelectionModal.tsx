import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Check, Sparkles, X, Stethoscope, Award, BookOpen, Compass, ArrowRight } from 'lucide-react';
import '../styles/pages/modals.css';

interface GoalSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mandatory?: boolean;
}

const TRACK_ICONS: Record<string, { icon: React.ReactNode; tone: string }> = {
  mbbs: { icon: <Stethoscope size={24} />, tone: '' },
  bds: { icon: <Award size={24} />, tone: 'is-gold' },
  ayush: { icon: <Compass size={24} />, tone: 'is-success' },
  general: { icon: <BookOpen size={24} />, tone: '' },
};

const TRACK_BADGES: Record<string, string[]> = {
  mbbs: ['Gross Anatomy', 'Clinical Osteology', 'Surgical Dissections'],
  bds: ['Head & Neck', 'Cranial Nerves', 'TMJ & Oral Cavity'],
  ayush: ['Sharira Rachana', 'Marma Points', 'Integrative Anatomy'],
  general: ['Foundations', 'Body Systems', 'Allied Health Sciences'],
};

export const GoalSelectionModal: React.FC<GoalSelectionModalProps> = ({
  isOpen,
  onClose,
  mandatory = false,
}) => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>(user?.selectedCourseId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: coursesRes, isLoading } = useQuery({
    queryKey: ['courses-list-for-goal'],
    queryFn: () => api.get('/courses'),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const courses: any[] = coursesRes?.data?.data || [];

  const handleSelect = async () => {
    if (!selectedId) {
      setErrorMsg('Please select your target course to proceed.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/select-course', { courseId: selectedId });
      if (res.data.success) {
        updateUser(res.data.data);
        queryClient.invalidateQueries({ queryKey: ['my-course'] });
        queryClient.invalidateQueries({ queryKey: ['course-detail'] });
        queryClient.invalidateQueries({ queryKey: ['courses-all'] });
        if (onClose) onClose();
      } else {
        setErrorMsg(res.data.error || 'Failed to select goal');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error updating target track');
    } finally {
      setLoading(false);
    }
  };

  const getTrackKey = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('mbbs')) return 'mbbs';
    if (lower.includes('bds')) return 'bds';
    if (lower.includes('ayush')) return 'ayush';
    return 'general';
  };

  const canClose = !mandatory && !!onClose;

  return (
    <div className="ui-modal-backdrop mdl-backdrop">
      <div
        className="ui-modal mdl-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdl-goal-title"
        style={{ ['--w' as string]: '720px' }}
      >
        {canClose && (
          <button type="button" className="ui-icon-btn ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}

        <div className="ui-modal-head mdl-head">
          <span className="ui-chip is-gold">
            <Sparkles size={12} /> Curriculum customization
          </span>
          <h2 id="mdl-goal-title" className="ui-title-lg mdl-title">
            What are you preparing for?
          </h2>
          <p className="ui-muted mdl-sub">
            Select your primary exam track. You can preview free lessons and switch courses anytime before buying.
          </p>
        </div>

        <div className="ui-modal-body">
          {errorMsg && (
            <div className="ui-callout is-danger mdl-error" role="alert">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="mdl-tracks" aria-label="Loading preparation tracks...">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="ui-skeleton" style={{ ['--h' as string]: '168px' }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="ui-empty">
              <span className="ui-icon-box" style={{ ['--size' as string]: '52px' }}>
                <BookOpen size={24} />
              </span>
              <h3>No active courses found</h3>
              <p>Please contact administration.</p>
            </div>
          ) : (
            <div className="mdl-tracks">
              {courses.map((course, idx) => {
                const isSelected = selectedId === course._id;
                const trackKey = getTrackKey(course.title);
                const track = TRACK_ICONS[trackKey] || TRACK_ICONS.general;
                const badges = TRACK_BADGES[trackKey] || ['Anatomy', 'Clinical Study'];

                return (
                  <button
                    type="button"
                    key={course._id}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedId(course._id);
                      setErrorMsg('');
                    }}
                    className={`ui-tile is-interactive is-compact mdl-track${isSelected ? ' is-selected' : ''}`}
                    style={{ ['--i' as string]: idx }}
                  >
                    <span className="ui-row is-between is-nowrap">
                      <span className={`ui-icon-box ${isSelected ? 'is-accent' : track.tone}`} style={{ ['--size' as string]: '48px' }}>
                        {track.icon}
                      </span>
                      <span className="mdl-radio" aria-hidden="true">
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </span>
                    </span>

                    <span className="ui-title mdl-track-title">{course.title}</span>
                    <span className="ui-muted mdl-track-desc">
                      {course.description || 'Comprehensive curriculum for clinical anatomy.'}
                    </span>

                    <span className="ui-row mdl-track-chips" style={{ ['--gap' as string]: '6px' }}>
                      {badges.map((badge, bIdx) => (
                        <span key={bIdx} className="ui-chip">
                          {badge}
                        </span>
                      ))}
                      <span className="ui-chip is-success">Free preview available</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ui-modal-foot mdl-foot">
          {canClose && (
            <button type="button" className="ui-btn is-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          )}

          <button type="button" className="ui-btn is-primary mdl-cta" onClick={handleSelect} disabled={loading || !selectedId}>
            {loading ? 'Saving track...' : user?.selectedCourseId ? 'Confirm & switch track' : 'Start learning this track'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
