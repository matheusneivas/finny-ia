import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Lembra no aparelho quais cartões do chat já foram salvos ou descartados,
 * para eles não voltarem como pendentes ao reabrir o app.
 * Guarda só o id da ação e o resultado (nada de valores ou textos).
 * A API também guarda o status; o que vier dela tem prioridade.
 */
export type StoredActionState = 'done' | 'dismissed';

const MAX = 500;
const FILE_NAME = 'fini-chat-actions.json';

let cache: Record<string, StoredActionState> | null = null;

function file() {
  return new File(Paths.document, FILE_NAME);
}

function read(): Record<string, StoredActionState> {
  if (cache) return cache;
  cache = {};
  try {
    const raw =
      Platform.OS === 'web'
        ? globalThis.sessionStorage?.getItem(FILE_NAME)
        : file().exists
          ? file().textSync()
          : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (v === 'done' || v === 'dismissed') cache[k] = v;
      }
    }
  } catch {
    // arquivo corrompido: começa vazio
  }
  return cache;
}

function write(data: Record<string, StoredActionState>) {
  try {
    const raw = JSON.stringify(data);
    if (Platform.OS === 'web') globalThis.sessionStorage?.setItem(FILE_NAME, raw);
    else file().write(raw);
  } catch {
    // sem espaço ou sem permissão: o estado fica só nesta sessão
  }
}

export function loadActionStates(): Record<string, StoredActionState> {
  return { ...read() };
}

export function saveActionState(id: string, state: StoredActionState) {
  const data = read();
  delete data[id];
  data[id] = state; // mais recentes por último
  const keys = Object.keys(data);
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX))) delete data[k];
  write(data);
}

/** Ao sair da conta ou apagar a conversa. */
export function clearActionStates() {
  cache = {};
  try {
    if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(FILE_NAME);
    else if (file().exists) file().delete();
  } catch {
    // nada a fazer
  }
}
