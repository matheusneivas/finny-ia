import { HStack, Image, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { EMPTY_WIDGET_PROPS, type FiniWidgetProps } from './types';

/**
 * Widget da tela inicial do iPhone (SwiftUI via Expo UI).
 * - Pequeno: saldo do mês; tocar abre "Novo gasto".
 * - Médio: saldo, meta principal e botões +Gasto / +Entrada.
 * - Tela bloqueada: atalho circular para "Novo gasto".
 *
 * Atenção: com a diretiva 'widget' a função roda isolada. Tudo que ela usa
 * (cores, links) precisa estar declarado aqui dentro.
 */
const FiniWidget = (props: FiniWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const bg = dark ? '#0B1220' : '#FFFFFF';
  const text = dark ? '#F3F4F6' : '#111827';
  const muted = dark ? '#9CA3AF' : '#6B7280';
  const green = '#0E9F6E';
  const red = '#E02424';
  const violet = '#6D4AFF';
  const scheme = 'fini://';

  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <VStack modifiers={[containerBackground('clear', 'widget'), widgetURL(`${scheme}novo-gasto`)]}>
        <Image systemName="plus.circle.fill" size={28} />
        <Text modifiers={[font({ size: 10, weight: 'semibold' })]}>Gasto</Text>
      </VStack>
    );
  }

  if (!props.signedIn) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[containerBackground(bg, 'widget'), widgetURL(`${scheme}chat`)]}>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(green)]}>Fini</Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>Entre no app para ver seu saldo aqui.</Text>
      </VStack>
    );
  }

  const balanceBlock = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(muted)]}>Saldo de {props.month}</Text>
      <Text
        modifiers={[
          font({ size: 24, weight: 'bold', design: 'rounded' }),
          foregroundStyle(props.negative ? red : text),
          lineLimit(1),
          minimumScaleFactor(0.5),
        ]}>
        {props.balance}
      </Text>
    </VStack>
  );

  if (env.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={8} modifiers={[containerBackground(bg, 'widget'), widgetURL(`${scheme}novo-gasto`)]}>
        <HStack>
          <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(green)]}>Fini</Text>
          <Spacer />
          <Image systemName="plus.circle.fill" size={22} color={green} />
        </HStack>
        <Spacer />
        {balanceBlock}
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted), lineLimit(1)]}>Toque para anotar um gasto</Text>
      </VStack>
    );
  }

  // systemMedium
  const button = (label: string, symbol: 'minus' | 'plus', path: string, color: string) => (
    <Link destination={`${scheme}${path}`}>
      <HStack
        spacing={4}
        modifiers={[padding({ vertical: 8, horizontal: 10 }), frame({ maxWidth: 9999 }), background(color), clipShape('capsule')]}>
        <Image systemName={symbol === 'plus' ? 'plus' : 'minus'} size={12} color="#FFFFFF" />
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>{label}</Text>
      </HStack>
    </Link>
  );

  return (
    <HStack spacing={14} modifiers={[containerBackground(bg, 'widget'), widgetURL(`${scheme}chat`)]}>
      <VStack alignment="leading" spacing={8} modifiers={[frame({ maxWidth: 9999, alignment: 'leading' })]}>
        {balanceBlock}
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(0.7)]}>
          ↓ {props.income}   ↑ {props.expense}
        </Text>
        <Spacer />
        {props.goalName ? (
          <VStack alignment="leading" spacing={4}>
            <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(text), lineLimit(1)]}>{props.goalName}</Text>
            <ProgressView value={props.goalProgress} modifiers={[tint(violet)]} />
            <Text modifiers={[font({ size: 10 }), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(0.7)]}>{props.goalText}</Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>Crie uma meta no app</Text>
        )}
      </VStack>
      <VStack spacing={8} modifiers={[frame({ width: 112 })]}>
        {button('Gasto', 'minus', 'novo-gasto', red)}
        {button('Entrada', 'plus', 'nova-entrada', green)}
        {button('Guardar', 'plus', 'guardar', violet)}
      </VStack>
    </HStack>
  );
};

export default createWidget<FiniWidgetProps>('FiniWidget', FiniWidget, EMPTY_WIDGET_PROPS);
