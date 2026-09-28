import { BarChart3, Home, Trophy, UserRound } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/reports', label: 'Progress', icon: BarChart3, end: false },
  { to: '/achievements', label: 'Rank', icon: Trophy, end: false },
  { to: '/settings', label: 'Profile', icon: UserRound, end: false },
];
