import React from 'react';

export const StudentPageShell: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  narrow?: boolean;
}> = ({ children, className = '', style, narrow = false }) => (
  <div className={`ui-page ui-rise${narrow ? ' is-narrow' : ''} ${className}`.trim()} style={style}>
    {children}
  </div>
);
