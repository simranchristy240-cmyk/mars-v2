import React from 'react';

/** Mobile-first page shell matching the Home dashboard column. */
export const StudentPageShell: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
  <div
    className={`animate-fade-in ${className}`.trim()}
    style={{
      padding: '20px 20px 40px',
      maxWidth: '480px',
      margin: '0 auto',
      width: '100%',
      ...style,
    }}
  >
    {children}
  </div>
);
