import { Column, LinearProgressIndicator, Spacer, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type FiniWidgetProps } from './types';

/**
 * Widget da tela inicial do Android (Jetpack Compose via Expo UI).
 * Mostra saldo do mês e a meta principal. No Android os botões de widget
 * ainda não abrem telas do app; para anotar rápido, segure o ícone do Fini
 * (atalhos) ou arraste um atalho para a tela inicial.
 */
const FiniWidget = (props: FiniWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const bg = dark ? '#0B1220' : '#FFFFFF';
  const text = dark ? '#F3F4F6' : '#111827';
  const muted = dark ? '#9CA3AF' : '#6B7280';

  if (!props.signedIn) {
    return (
      <Column modifiers={[fillMaxSize(), background(bg), cornerRadius(20), paddingAll(16)]}>
        <Text color="#0E9F6E" style={{ fontSize: 15, fontWeight: 'bold' }}>Fini</Text>
        <Text color={muted} style={{ fontSize: 13 }}>Entre no app para ver seu saldo aqui.</Text>
      </Column>
    );
  }

  return (
    <Column modifiers={[fillMaxSize(), background(bg), cornerRadius(20), paddingAll(16)]}>
      <Text color={muted} style={{ fontSize: 12 }}>Saldo de {props.month}</Text>
      <Text color={props.negative ? '#E02424' : text} maxLines={1} style={{ fontSize: 24, fontWeight: 'bold' }}>
        {props.balance}
      </Text>
      <Text color={muted} maxLines={1} style={{ fontSize: 11 }}>
        ↓ {props.income}   ↑ {props.expense}
      </Text>
      <Spacer modifiers={[height(10)]} />
      {props.goalName ? (
        <Column modifiers={[fillMaxWidth()]}>
          <Text color={text} maxLines={1} style={{ fontSize: 12, fontWeight: '600' }}>{props.goalName}</Text>
          <LinearProgressIndicator progress={props.goalProgress} color="#6D4AFF" modifiers={[fillMaxWidth()]} />
          <Text color={muted} maxLines={1} style={{ fontSize: 10 }}>{props.goalText}</Text>
        </Column>
      ) : null}
    </Column>
  );
};

export default createWidget<FiniWidgetProps>('FiniWidget', FiniWidget, EMPTY_WIDGET_PROPS);
