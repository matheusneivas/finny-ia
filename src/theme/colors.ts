import { useColorScheme } from 'react-native';

/**
 * Paleta do Fini. Toda cor do app sai daqui: nenhuma tela usa hex direto.
 * Verde-esmeralda = dinheiro crescendo; violeta = a IA (Fini).
 * Cada token tem um par claro/escuro com contraste AA sobre o fundo.
 */
const palette = {
  light: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F3',
    surfaceSelected: '#FFFFFF',
    border: '#E2E5EA',
    text: '#0F172A',
    textSecondary: '#5B6474',
    textMuted: '#8A93A3',

    primary: '#0E9F6E',
    primaryPressed: '#0B8059',
    primarySoft: '#E3F6EE',
    onPrimary: '#FFFFFF',

    ai: '#6D4AFF',
    aiSoft: '#EFEBFF',
    onAi: '#FFFFFF',

    income: '#0E9F6E',
    incomeSoft: '#E3F6EE',
    expense: '#E5484D',
    expenseSoft: '#FDECEC',
    warning: '#C27803',
    warningSoft: '#FDF3DC',
    danger: '#E5484D',

    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    background: '#0B0F17',
    surface: '#141A24',
    surfaceMuted: '#1C2430',
    surfaceSelected: '#2B3547',
    border: '#263041',
    text: '#F1F5F9',
    textSecondary: '#A3ADBD',
    textMuted: '#6E7889',

    primary: '#34D399',
    primaryPressed: '#22B583',
    primarySoft: '#11302A',
    onPrimary: '#06281D',

    ai: '#9C87FF',
    aiSoft: '#231D45',
    onAi: '#120B33',

    income: '#34D399',
    incomeSoft: '#11302A',
    expense: '#FF6B6E',
    expenseSoft: '#3A1A1D',
    warning: '#F5B544',
    warningSoft: '#3A2C10',
    danger: '#FF6B6E',

    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof (typeof palette)['light']]: string };
export type ColorToken = keyof Colors;

export function getColors(scheme: ColorScheme): Colors {
  return palette[scheme];
}

/** Cores do tema atual. Use só dentro de componentes. */
export function useColors(): Colors {
  const scheme = useColorScheme();
  return palette[scheme === 'dark' ? 'dark' : 'light'];
}

/** Cores de categoria (vêm da API) caem aqui se vierem vazias ou inválidas. */
export const categoryFallbackColors = [
  '#0E9F6E',
  '#6D4AFF',
  '#E5484D',
  '#F59E0B',
  '#0EA5E9',
  '#EC4899',
  '#14B8A6',
  '#8B5CF6',
] as const;
