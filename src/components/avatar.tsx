import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/token-storage';
import { radius, useColors } from '@/theme';

import { Icon } from './icon';
import { Text } from './text';

type Source = { uri: string; headers?: Record<string, string> };

/** Monta a fonte da imagem: arquivo local direto; foto da API com o token (a rota é autenticada). */
function useAvatarSource(url?: string | null): Source | null {
  const [source, setSource] = useState<Source | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!url) return setSource(null);
      if (/^(file|data|blob|content|ph):/.test(url)) return setSource({ uri: url });
      // Só carregamos fotos da nossa própria API, nunca de um endereço arbitrário.
      if (!url.startsWith('/')) return setSource(null);
      const token = await tokenStorage.getAccessToken();
      if (!cancelled) setSource({ uri: `${env.apiUrl}${url}`, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);
  return source;
}

export function Avatar({
  url,
  name,
  size = 52,
  editable,
}: {
  url?: string | null;
  name?: string;
  size?: number;
  editable?: boolean;
}) {
  const colors = useColors();
  const source = useAvatarSource(url);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = !!url && failedUrl === url;
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circle, { width: size, height: size, backgroundColor: colors.primarySoft }]}>
        {source && !failed ? (
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            accessibilityLabel="Foto de perfil"
            onError={() => setFailedUrl(url ?? null)}
          />
        ) : initials ? (
          <Text variant={size >= 72 ? 'title' : 'heading'} color="primary">
            {initials}
          </Text>
        ) : (
          <Icon name="profile" size={size * 0.45} color={colors.primary} />
        )}
      </View>
      {editable ? (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Icon name="camera" size={12} color={colors.onPrimary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
