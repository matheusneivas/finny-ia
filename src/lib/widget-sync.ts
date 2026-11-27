import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { EMPTY_WIDGET_PROPS, type FiniWidgetProps } from '@/widgets/types';

/**
 * O widget só existe no app instalado (build de desenvolvimento ou loja).
 * No Expo Go e na web o módulo nativo não existe, então tudo vira no-op.
 */
const available = Platform.OS !== 'web' && requireOptionalNativeModule('ExpoWidgets') != null;

let last = '';

export function updateFiniWidget(props: FiniWidgetProps) {
  if (!available) return;
  const key = JSON.stringify(props);
  if (key === last) return; // evita recarregar o widget à toa
  last = key;
  try {
    // require só aqui dentro: no Expo Go importar o widget quebraria o app.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const widget = require('@/widgets/fini-widget').default as { updateSnapshot: (p: FiniWidgetProps) => void };
    widget.updateSnapshot(props);
  } catch {
    // Widget é um extra: nunca derruba o app.
  }
}

/** Ao sair da conta, o widget para de mostrar valores. */
export function clearFiniWidget() {
  updateFiniWidget(EMPTY_WIDGET_PROPS);
}
