import { Platform, useWindowDimensions } from 'react-native';

import { desktopBreakpoint } from '@/theme';

/** true no site aberto em tela larga (computador/notebook). No app é sempre false. */
export function useIsDesktop() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= desktopBreakpoint;
}
