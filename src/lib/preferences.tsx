import * as SecureStore from 'expo-secure-store';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

/**
 * Preferências locais do aparelho (não vão para o servidor):
 * - hideValues: esconde valores em público ("modo discreto").
 * - biometricLock: pede Face ID / digital ao abrir o app.
 */
interface Preferences {
  hideValues: boolean;
  biometricLock: boolean;
}

const KEY = 'fini.prefs';
const defaults: Preferences = { hideValues: false, biometricLock: false };

async function read(): Promise<Preferences> {
  if (Platform.OS === 'web') return defaults;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Preferences>) } : defaults;
  } catch {
    return defaults;
  }
}

async function write(p: Preferences) {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(KEY, JSON.stringify(p));
}

interface Ctx extends Preferences {
  loaded: boolean;
  /** App travado pela biometria (começa travado se o bloqueio estiver ligado). */
  locked: boolean;
  setLocked: (locked: boolean) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<Ctx | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    void read().then((p) => {
      setPrefs(p);
      setLocked(p.biometricLock && Platform.OS !== 'web');
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      void write(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...prefs, loaded, locked, setLocked, setPreference }), [prefs, loaded, locked, setPreference]);
  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences() {
  const ctx = use(PreferencesContext);
  if (!ctx) throw new Error('usePreferences precisa estar dentro de <PreferencesProvider>');
  return ctx;
}
