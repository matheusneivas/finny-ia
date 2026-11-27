import * as QuickActions from 'expo-quick-actions';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useGoals, useMonthData } from '@/hooks/queries';
import { usePreferences } from '@/lib/preferences';
import { SHORTCUTS, shortcutTarget, takePendingShortcut, onPendingShortcut, type ShortcutId } from '@/lib/shortcuts';
import { updateFiniWidget } from '@/lib/widget-sync';
import { currentMonth, formatMonth } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

let handledInitialQuickAction = false;

function openShortcut(id: unknown) {
  const shortcut = SHORTCUTS.find((s) => s.id === id);
  if (!shortcut) return;
  const target = shortcutTarget(shortcut.id as ShortcutId, {});
  if (target === '/') router.navigate('/');
  else router.push(target);
}

/**
 * Liga os atalhos quando o app está pronto (logado e com onboarding feito):
 * abre o atalho pendente, registra as ações do ícone e atualiza o widget.
 */
export function useAppShortcuts() {
  // Links de atalho: o que chegou antes do login e os que chegarem com o app aberto.
  useEffect(() => {
    const open = () => {
      const href = takePendingShortcut();
      if (href) setTimeout(() => router.push(href), 50);
    };
    open();
    return onPendingShortcut(open);
  }, []);

  // Ações ao segurar o ícone do app (precisa do app instalado; no Expo Go não faz nada).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void QuickActions.setItems(
      SHORTCUTS.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        icon: Platform.OS === 'ios' ? `symbol:${s.iosSymbol}` : undefined,
      })),
    ).catch(() => undefined);

    if (QuickActions.initial && !handledInitialQuickAction) {
      handledInitialQuickAction = true;
      const id = QuickActions.initial.id;
      setTimeout(() => openShortcut(id), 0);
    }
    const sub = QuickActions.addListener((action) => openShortcut(action.id));
    return () => sub.remove();
  }, []);

  // Widget: saldo do mês e meta principal, respeitando o modo discreto.
  const [month] = useState(currentMonth);
  const { summary } = useMonthData(month);
  const goals = useGoals();
  const { hideValues } = usePreferences();

  useEffect(() => {
    if (!summary.data) return;
    const s = summary.data;
    const main = (goals.data ?? [])
      .filter((g) => g.status === 'ACTIVE')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    const money = (v: number) => formatMoney(v, { hidden: hideValues });
    updateFiniWidget({
      signedIn: true,
      month: formatMonth(month).split(' ')[0],
      balance: money(s.balance),
      income: money(s.totalIncome),
      expense: money(s.totalExpense),
      negative: !hideValues && s.balance < 0,
      goalName: main?.name ?? null,
      goalProgress: main ? Math.min(1, Math.max(0, main.progressPercentage / 100)) : 0,
      goalText: main ? `${formatMoney(main.savedAmount, { hidden: hideValues, compact: true })} de ${formatMoney(main.targetAmount, { hidden: hideValues, compact: true })}` : '',
    });
  }, [summary.data, goals.data, hideValues, month]);
}
