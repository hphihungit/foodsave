import { TextStyle } from 'react-native';

/** Tokens from Figma page "0. Cover & Design System" → Foundations. */
export const colors = {
  primary700: '#157A41',
  primary500: '#1F9D55',
  primary50: '#E6F6EC',
  accent500: '#FF8A3D',
  accent50: '#FFF1E6',
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#9E9E9E',
  border: '#E8E8E3',
  bg: '#FAFAF5',
  surface: '#FFFFFF',
  onPrimary: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  errorBg: '#FDECEC',
  warningBg: '#FEF5E7',
  infoBg: '#EAF2FE',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

const t = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({ fontFamily, fontSize, lineHeight });

/** Text styles from Figma "Typography · Be Vietnam Pro". */
export const type = {
  h1: t(fonts.bold, 28, 36),
  h2: t(fonts.bold, 22, 30),
  h3: t(fonts.semibold, 18, 26),
  body: t(fonts.regular, 16, 24),
  bodyMedium: t(fonts.medium, 16, 24),
  bodyS: t(fonts.regular, 14, 20),
  bodySMedium: t(fonts.medium, 14, 20),
  button: t(fonts.semibold, 16, 24),
  buttonS: t(fonts.semibold, 14, 20),
  caption: t(fonts.regular, 12, 16),
  captionMedium: t(fonts.medium, 12, 16),
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const space = { gutter: 20 } as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
