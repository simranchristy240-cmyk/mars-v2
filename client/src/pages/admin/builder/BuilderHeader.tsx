import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit3, Plus } from 'lucide-react';

interface Props {
  current: number;
  total: number;
  title: string;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onEdit?: () => void;
  onAdd: () => void;
  editTitle?: string;
  addTitle?: string;
  extraRight?: React.ReactNode;
}

export const BuilderHeader: React.FC<Props> = ({
  current,
  total,
  title,
  onBack,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  onEdit,
  onAdd,
  editTitle = 'Edit',
  addTitle = 'Add',
  extraRight,
}) => {
  return (
    <header className="les-compact-head" style={{ marginBottom: 6 }}>
      <div className="les-head-left">
        <button
          type="button"
          className="ui-icon-btn is-tile les-back-btn"
          onClick={onBack}
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>

        {total > 0 && (
          <span className="les-counter-pill" title={`${current} of ${total}`}>
            {current}/{total}
          </span>
        )}

        <h1 className="les-single-title" title={title}>
          {title || 'Untitled'}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {extraRight}

        {onPrev && (
          <button
            type="button"
            className="ui-icon-btn is-tile"
            onClick={onPrev}
            disabled={!hasPrev}
            title="Previous"
            aria-label="Previous"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm, 10px)',
              opacity: hasPrev ? 1 : 0.35,
              cursor: hasPrev ? 'pointer' : 'default',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {onNext && (
          <button
            type="button"
            className="ui-icon-btn is-tile"
            onClick={onNext}
            disabled={!hasNext}
            title="Next"
            aria-label="Next"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm, 10px)',
              opacity: hasNext ? 1 : 0.35,
              cursor: hasNext ? 'pointer' : 'default',
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            className="ui-icon-btn is-tile"
            onClick={onEdit}
            disabled={total === 0}
            title={editTitle}
            aria-label={editTitle}
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm, 10px)',
              opacity: total === 0 ? 0.35 : 1,
              cursor: total === 0 ? 'default' : 'pointer',
            }}
          >
            <Edit3 size={15} />
          </button>
        )}

        <button
          type="button"
          className="ui-icon-btn is-primary"
          onClick={onAdd}
          title={addTitle}
          aria-label={addTitle}
          style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm, 10px)' }}
        >
          <Plus size={16} />
        </button>
      </div>
    </header>
  );
};
