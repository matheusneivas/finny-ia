import { Platform, Share } from 'react-native';

import { accountApi } from '@/lib/api/endpoints';

/**
 * "Baixar meus dados" (LGPD): pede à API a cópia de tudo e entrega como arquivo JSON.
 * Web: baixa meus-dados-finny.json. Celular: abre o compartilhar (salvar em Arquivos, e-mail...).
 */
export async function downloadMyData(): Promise<void> {
  const data = await accountApi.exportData();
  const text = JSON.stringify(data, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meus-dados-finny.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ title: 'Meus dados do Finny', message: text });
}
