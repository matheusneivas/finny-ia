import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { usePreferences } from '@/lib/preferences';
import { spacing, useColors } from '@/theme';

import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';

/** Tempo em segundo plano antes de pedir biometria de novo. */
const RELOCK_AFTER_MS = 60_000;

/**
 * Bloqueio do app com Face ID / digital (opcional, ligado no Perfil).
 * Também cobre a tela quando o app vai para segundo plano, para o
 * seletor de apps do sistema não mostrar saldo e gastos.
 */
export function AppLock({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { biometricLock, loaded, locked, setLocked } = usePreferences();
  const [covered, setCovered] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear o Finny',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (res.success) setLocked(false);
  }, [setLocked]);

  const enabled = Platform.OS !== 'web' && loaded && biometricLock;

  // Pede a biometria assim que o app abre travado.
  useEffect(() => {
    if (locked) void unlock();
  }, [locked, unlock]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setCovered(false);
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (enabled && away > RELOCK_AFTER_MS) setLocked(true);
      } else {
        setCovered(true);
        backgroundedAt.current ??= Date.now();
      }
    });
    return () => sub.remove();
  }, [enabled, setLocked]);

  const showLock = enabled && locked;

  return (
    <View style={styles.flex}>
      {children}
      {showLock || covered || (!loaded && Platform.OS !== 'web') ? (
        <View style={[StyleSheet.absoluteFill, styles.lock, { backgroundColor: colors.background }]}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Icon name="lock" size={32} color={colors.primary} />
          </View>
          <Text variant="heading">Finny bloqueado</Text>
          {showLock ? <Button title="Desbloquear" icon="faceId" onPress={() => void unlock()} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lock: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, zIndex: 100 },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
