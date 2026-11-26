import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { radius, useColors } from '@/theme';

import { Icon } from './icon';
import { Text } from './text';

/** Marca do Fini: selo com gradiente verde → violeta (dinheiro + IA). */
export function FiniMark({ size = 56 }: { size?: number }) {
  const colors = useColors();
  return (
    <LinearGradient
      colors={[colors.primary, colors.ai]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Icon name="sparkles" size={size * 0.5} color="#FFFFFF" />
    </LinearGradient>
  );
}

export function FiniAvatar({ size = 32 }: { size?: number }) {
  return (
    <View accessible={false}>
      <FiniMark size={size} />
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={styles.row}>
      <FiniMark size={36} />
      <Text variant="title">Fini</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  row: { flexDirection: 'row', alignItems: 'center', gap: radius.sm + 2 },
});
