export type ThemeColorName = 'purple' | 'emerald' | 'sky' | 'rose' | 'amber';

export interface ThemeColors {
  accent: string;
  accentDim: string;
  accentLight: string;
}

export const THEMES: Record<ThemeColorName, ThemeColors> = {
  purple: {
    accent: '#6c63ff',
    accentDim: 'rgba(108,99,255,0.15)',
    accentLight: '#8b84ff',
  },
  emerald: {
    accent: '#10b981',
    accentDim: 'rgba(16,185,129,0.15)',
    accentLight: '#34d399',
  },
  sky: {
    accent: '#0ea5e9',
    accentDim: 'rgba(14,165,233,0.15)',
    accentLight: '#38bdf8',
  },
  rose: {
    accent: '#f43f5e',
    accentDim: 'rgba(244,63,94,0.15)',
    accentLight: '#fb7185',
  },
  amber: {
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.15)',
    accentLight: '#fbbf24',
  },
};

export function applyTheme(colorKey: ThemeColorName) {
  const theme = THEMES[colorKey] || THEMES.purple;
  const root = document.documentElement;
  
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-dim', theme.accentDim);
  root.style.setProperty('--accent-light', theme.accentLight);
}
