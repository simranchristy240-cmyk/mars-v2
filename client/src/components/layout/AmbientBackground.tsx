import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AMBIENT_THEMES = new Set(['lunar-drift', 'silk-paper']);

export const AmbientBackground: React.FC = () => {
  const { theme } = useTheme();

  if (!AMBIENT_THEMES.has(theme)) return null;

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-blob ambient-blob--1" />
      <div className="ambient-blob ambient-blob--2" />
      <div className="ambient-blob ambient-blob--3" />
      <div className="ambient-blob ambient-blob--4" />
    </div>
  );
};
