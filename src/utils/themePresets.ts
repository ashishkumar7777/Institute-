export type ThemeKey =
  | 'purple'
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'indigo'
  | 'teal'
  | 'slate';

export const THEME_PRESETS: Record<
  ThemeKey,
  {
    label: string;
    gradient: string;
    swatch: string;
    accentText: string;
    badgeBg: string;
  }
> = {
  purple: {
    label: 'Royal Purple',
    gradient: 'from-purple-800 via-indigo-700 to-slate-900',
    swatch: 'bg-purple-700',
    accentText: 'text-purple-600',
    badgeBg: 'bg-purple-500/30 border-purple-400/30',
  },
  blue: {
    label: 'Ocean Blue',
    gradient: 'from-blue-800 via-indigo-700 to-slate-900',
    swatch: 'bg-blue-700',
    accentText: 'text-blue-600',
    badgeBg: 'bg-blue-500/30 border-purple-400/30',
  },
  emerald: {
    label: 'Emerald Green',
    gradient: 'from-emerald-800 via-teal-700 to-slate-900',
    swatch: 'bg-emerald-700',
    accentText: 'text-emerald-600',
    badgeBg: 'bg-emerald-500/30 border-emerald-400/30',
  },
  rose: {
    label: 'Crimson Rose',
    gradient: 'from-rose-800 via-pink-700 to-slate-900',
    swatch: 'bg-rose-700',
    accentText: 'text-rose-600',
    badgeBg: 'bg-rose-500/30 border-rose-400/30',
  },
  amber: {
    label: 'Sunset Amber',
    gradient: 'from-amber-700 via-orange-700 to-slate-900',
    swatch: 'bg-amber-600',
    accentText: 'text-amber-600',
    badgeBg: 'bg-amber-500/30 border-amber-400/30',
  },
  indigo: {
    label: 'Deep Indigo',
    gradient: 'from-indigo-900 via-violet-800 to-slate-900',
    swatch: 'bg-indigo-700',
    accentText: 'text-indigo-600',
    badgeBg: 'bg-indigo-500/30 border-indigo-400/30',
  },
  teal: {
    label: 'Teal Cyan',
    gradient: 'from-teal-700 via-cyan-800 to-slate-900',
    swatch: 'bg-teal-600',
    accentText: 'text-teal-600',
    badgeBg: 'bg-teal-500/30 border-teal-400/30',
  },
  slate: {
    label: 'Midnight Slate',
    gradient: 'from-slate-800 via-zinc-800 to-black',
    swatch: 'bg-slate-800',
    accentText: 'text-slate-700',
    badgeBg: 'bg-slate-500/30 border-slate-400/30',
  },
};