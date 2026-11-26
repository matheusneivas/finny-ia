import { Text as RNText, type TextProps } from 'react-native';

import { typography, useColors, type ColorToken, type TypographyVariant } from '@/theme';

export function Text({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...props
}: TextProps & { variant?: TypographyVariant; color?: ColorToken; align?: 'left' | 'center' | 'right' }) {
  const colors = useColors();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
      {...props}
    />
  );
}
