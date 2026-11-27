import type { BottomTabBarProps } from 'expo-router/tabs';
import { Tabs } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { useIsDesktop } from '@/hooks/use-is-desktop';
import { maxContentWidth, radius, spacing, useColors } from '@/theme';

import { FiniMark } from './brand';
import { Icon, type IconName } from './icon';
import { Text } from './text';

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Finny', icon: 'chat' },
  { name: 'planilha', title: 'Planilha', icon: 'sheet' },
  { name: 'metas', title: 'Metas', icon: 'goals' },
  { name: 'perfil', title: 'Perfil', icon: 'profile' },
];

/**
 * Web: abas em JS com as mesmas rotas do app.
 * - Tela estreita (celular): barra flutuante no rodapé.
 * - Tela larga (computador): menu lateral fixo à esquerda.
 */
export function AppTabs() {
  const colors = useColors();
  const desktop = useIsDesktop();
  return (
    <Tabs
      tabBar={desktop ? (props) => <Sidebar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? 'left' : 'bottom',
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

/** Menu lateral do site no computador. */
function Sidebar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.sidebar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.brand}>
        <FiniMark size={36} />
        <Text variant="heading">Finny</Text>
      </View>
      <View style={styles.menu}>
        {state.routes.map((route, index) => {
          const tab = tabs.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.textSecondary;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={({ hovered }) => [
                styles.menuItem,
                { backgroundColor: focused ? colors.primarySoft : hovered ? colors.surfaceMuted : 'transparent' },
              ]}>
              <Icon name={tab.icon} size={20} color={color} />
              <Text variant="body" style={{ color, fontWeight: focused ? '600' : '500' }}>
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  sidebar: {
    width: 232,
    height: '100%',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xl,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  menu: { gap: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
});
