import { NativeTabs } from 'expo-router/native-tabs';

import { useColors } from '@/theme';

/** Abas nativas: Liquid Glass no iOS 26+, Material 3 no Android. */
export function AppTabs() {
  const colors = useColors();
  return (
    <NativeTabs
      tintColor={colors.primary}
      indicatorColor={colors.primarySoft}
      backgroundColor={colors.surface}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="chat" />
        <NativeTabs.Trigger.Label>Finny</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planilha">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }} md="pie_chart" />
        <NativeTabs.Trigger.Label>Planilha</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="metas">
        <NativeTabs.Trigger.Icon sf={{ default: 'flag', selected: 'flag.fill' }} md="flag" />
        <NativeTabs.Trigger.Label>Metas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
