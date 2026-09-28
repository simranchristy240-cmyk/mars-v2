import React from 'react';

export const ProgressRing: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}> = ({ value, size = 64, stroke = 6, color, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="ui-ring" style={{ width: size, height: size, ...(color ? { ['--ring-color' as string]: color } : {}) }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ui-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ui-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="ui-ring-content">{children}</div>
    </div>
  );
};

export const ProgressBar: React.FC<{ value: number; tone?: 'gold' | 'success'; height?: number }> = ({
  value,
  tone,
  height,
}) => (
  <div className={`ui-progress${tone ? ` is-${tone}` : ''}`} style={height ? { ['--h' as string]: `${height}px` } : undefined}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const TIER_LABEL: Record<string, string> = { free: 'Free', basic: 'Basic', plus: 'Plus', premium: 'Premium' };
const TIER_TONE: Record<string, string> = { free: 'is-success', basic: '', plus: 'is-gold', premium: 'is-accent' };

export const TierChip: React.FC<{ tier?: string; className?: string }> = ({ tier = 'free', className = '' }) => (
  <span className={`ui-chip ${TIER_TONE[tier] ?? ''} ${className}`.trim()}>{TIER_LABEL[tier] ?? tier}</span>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}> = ({ icon, title, text, action }) => (
  <div className="ui-empty">
    {icon && <div className="ui-icon-box" style={{ ['--size' as string]: '56px' }}>{icon}</div>}
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, actions }) => (
  <div className="ui-page-head">
    <div>
      {eyebrow && <div className="ui-label" style={{ marginBottom: 8 }}>{eyebrow}</div>}
      <h1 className="ui-page-title">{title}</h1>
      {subtitle && <p className="ui-page-sub">{subtitle}</p>}
    </div>
    {actions && <div className="ui-row">{actions}</div>}
  </div>
);
