/**
 * Site: cada tela é um arquivo JS separado com hash no nome. Se o site for atualizado com a aba
 * aberta, a aba antiga pede um arquivo que não existe mais e a tela não abre ("Loading module ...
 * failed"). Nesse caso recarregamos a página uma vez para pegar a versão nova.
 * A trava no sessionStorage evita recarregar sem parar se o erro for outro.
 */
const KEY = 'finny.chunkReloadAt';
const COOLDOWN_MS = 30_000;

function isChunkError(reason: unknown): boolean {
  const e = reason as { name?: string; message?: string } | null;
  const text = `${e?.name ?? ''} ${e?.message ?? String(reason ?? '')}`;
  return /AsyncRequireError|ChunkLoadError|Loading module .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(text);
}

function reloadOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sem sessionStorage: recarrega mesmo assim (uma vez por carregamento da página)
  }
  window.location.reload();
}

let installed = false;

export function installChunkReload() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (event) => {
    if (isChunkError(event.error ?? event.message)) reloadOnce();
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkError(event.reason)) reloadOnce();
  });
}
