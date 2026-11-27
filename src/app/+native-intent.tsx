import { matchShortcutLink, setPendingShortcut } from '@/lib/shortcuts';

/**
 * Links de atalho (finny://novo-gasto, nova-entrada, guardar, chat) vindos do
 * widget, da Siri / app Atalhos ou de qualquer lugar. O app abre no início e
 * as abas abrem o formulário por cima, já com login conferido.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const target = matchShortcutLink(path);
    if (!target) return path;
    if (target !== '/') setPendingShortcut(target);
    return '/';
  } catch {
    return '/';
  }
}
