/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171412',
    background: '#EDF2F8',
    surface: 'rgba(255, 255, 255, 0.64)',
    surfaceMuted: 'rgba(255, 255, 255, 0.42)',
    surfaceElevated: 'rgba(255, 255, 255, 0.78)',
    backgroundElement: 'rgba(255, 255, 255, 0.28)',
    backgroundSelected: 'rgba(237, 232, 255, 0.60)',
    textSecondary: '#6C7076',
    textMuted: '#9DA3AA',
    border: 'rgba(255, 255, 255, 0.58)',
    tint: '#9E7BFF',
    tintMuted: 'rgba(238, 232, 255, 0.74)',
    success: '#69D46F',
    warning: '#A66B1F',
    danger: '#B64A42',
    hero: '#171716',
    heroAccent: '#9E7BFF',
    shadow: 'rgba(30, 41, 59, 0.14)',
    glassTint: 'rgba(255, 255, 255, 0.28)',
    glassTintMuted: 'rgba(255, 255, 255, 0.18)',
  },
  dark: {
    text: '#F5F4EF',
    background: '#0C1016',
    surface: 'rgba(24, 28, 38, 0.62)',
    surfaceMuted: 'rgba(18, 21, 29, 0.48)',
    surfaceElevated: 'rgba(31, 37, 50, 0.74)',
    backgroundElement: 'rgba(255, 255, 255, 0.08)',
    backgroundSelected: 'rgba(38, 32, 58, 0.54)',
    textSecondary: '#A8A79E',
    textMuted: '#78786F',
    border: 'rgba(255, 255, 255, 0.12)',
    tint: '#9E7BFF',
    tintMuted: 'rgba(43, 36, 64, 0.72)',
    success: '#69D46F',
    warning: '#D1A85A',
    danger: '#D66C63',
    hero: '#0F0F0D',
    heroAccent: '#9E7BFF',
    shadow: 'rgba(0, 0, 0, 0.42)',
    glassTint: 'rgba(123, 126, 255, 0.12)',
    glassTintMuted: 'rgba(255, 255, 255, 0.06)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

const systemFonts = Platform.select({
  ios: {
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  web: {
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
  default: {
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Fonts = {
  sans: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtraBold: 'Manrope_800ExtraBold',
  ...systemFonts,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 80,
} as const;

export const Radius = {
  small: 10,
  medium: 14,
  large: 18,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
