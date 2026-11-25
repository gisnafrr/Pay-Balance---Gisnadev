import { ActiveWorkspaceMode, ThemeMode } from '@/types/domain';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  positive: string;
  positiveSoft: string;
  negative: string;
  negativeSoft: string;
  warning: string;
  warningSoft: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  heroPersonal: string;
  heroBusiness: string;
  heroCombined: string;
  insightBannerBg: string;
  insightBannerText: string;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceElevated: '#F3F5FC',
  primary: '#7C3AED',       // Violet 600 (Modern Colorful)
  primarySoft: '#F3E8FF',   // Violet 100
  secondary: '#2563EB',     // Blue 600
  secondarySoft: '#DBEAFE', // Blue 100
  positive: '#10B981',      // Emerald 500
  positiveSoft: '#D1FAE5',
  negative: '#EF4444',      // Red 500
  negativeSoft: '#FEE2E2',
  warning: '#F59E0B',       // Amber 500
  warningSoft: '#FEF3C7',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border: '#EEF2F6',
  heroPersonal: '#7C3AED',
  heroBusiness: '#2563EB',
  heroCombined: '#4F46E5',
  insightBannerBg: '#111827',
  insightBannerText: '#FFFFFF',
};

export const DARK_COLORS: ThemeColors = {
  background: '#0B0D17',
  surface: '#15192B',
  surfaceElevated: '#1E243D',
  primary: '#8B5CF6',       // Violet 500
  primarySoft: '#2E1065',
  secondary: '#3B82F6',     // Blue 500
  secondarySoft: '#1E3A8A',
  positive: '#34D399',
  positiveSoft: '#064E3B',
  negative: '#F87171',
  negativeSoft: '#7F1D1D',
  warning: '#FBBF24',
  warningSoft: '#78350F',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#232942',
  heroPersonal: '#6D28D9',
  heroBusiness: '#1D4ED8',
  heroCombined: '#4338CA',
  insightBannerBg: '#232942',
  insightBannerText: '#F9FAFB',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export function getWorkspaceHeroColor(colors: ThemeColors, workspaceMode: ActiveWorkspaceMode): string {
  if (workspaceMode === 'BUSINESS') return colors.heroBusiness;
  if (workspaceMode === 'COMBINED') return colors.heroCombined;
  return colors.heroPersonal;
}

export const CHART_PALETTE = [
  '#7C3AED', // Purple
  '#2563EB', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber/Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  sheet: 28,
  pill: 999,
} as const;
