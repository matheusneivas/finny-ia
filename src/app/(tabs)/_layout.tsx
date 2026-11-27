import { AppTabs } from '@/components/app-tabs';
import { useAppShortcuts } from '@/hooks/use-app-shortcuts';

export default function TabsLayout() {
  useAppShortcuts();
  return <AppTabs />;
}
