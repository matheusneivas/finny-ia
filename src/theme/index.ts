import { Platform, TextStyle } from 'react-native';

export * from './colors';

/** Grade de 4 pontos. Bordas de tela usam `spacing.lg`. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

const rounded = Platform.select({ ios: 'ui-rounded', default: undefined });

/** Escala tipográfica. Telas nunca usam fontSize direto: use <Text variant>. */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', fontFamily: rounded, letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  money: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontFamily: rounded, fontVariant: ['tabular-nums'] },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const shadows = {
  card: '0 1px 3px rgba(15, 23, 42, 0.06)',
  raised: '0 6px 16px rgba(15, 23, 42, 0.10)',
  overlay: '0 12px 32px rgba(15, 23, 42, 0.20)',
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

/** Largura máxima do conteúdo na web/tablet. */
export const maxContentWidth = 720;

/** Na web, a partir desta largura o site usa menu lateral (layout de computador). */
export const desktopBreakpoint = 900;
