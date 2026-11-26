import { Tabs } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';

import { maxContentWidth, radius, spacing, useColors } from '@/theme';

import { Icon, type IconName } from './icon';

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Fini', icon: 'chat' },
  { name: 'planilha', title: 'Planilha', icon: 'sheet' },
  { name: 'metas', title: 'Metas', icon: 'goals' },
  { name: 'perfil', title: 'Perfil', icon: 'profile' },
];

/** Web: abas em JS com barra flutuante no rodapé (mesmas rotas do app). */
export function AppTabs() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarStyle: [styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
      }}>
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => <Icon name={t.icon} size={18} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: maxContentWidth / 1.5,
    marginLeft: 'auto',
    marginRight: 'auto',
    height: 64,
    padding: spacing.xs,
    borderRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  },
  item: { borderRadius: radius.lg, overflow: 'hidden' },
  label: { fontSize: 12, fontWeight: '500' },
});
