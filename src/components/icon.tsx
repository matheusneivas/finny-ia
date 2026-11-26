import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Conjunto fechado de ícones do app: SF Symbols no iOS, Material Symbols no
 * Android e na web. Telas pedem pelo nome semântico, nunca pelo nome da plataforma.
 */
const icons = {
  chat: { ios: 'bubble.left.and.bubble.right.fill', md: 'chat' },
  sheet: { ios: 'chart.pie.fill', md: 'pie_chart' },
  goals: { ios: 'flag.checkered', md: 'flag' },
  profile: { ios: 'person.crop.circle.fill', md: 'person' },
  sparkles: { ios: 'sparkles', md: 'auto_awesome' },
  send: { ios: 'arrow.up', md: 'arrow_upward' },
  plus: { ios: 'plus', md: 'add' },
  close: { ios: 'xmark', md: 'close' },
  check: { ios: 'checkmark', md: 'check' },
  chevronLeft: { ios: 'chevron.left', md: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', md: 'chevron_right' },
  income: { ios: 'arrow.down.left', md: 'arrow_downward' },
  expense: { ios: 'arrow.up.right', md: 'arrow_upward' },
  trash: { ios: 'trash', md: 'delete' },
  edit: { ios: 'pencil', md: 'edit' },
  eye: { ios: 'eye', md: 'visibility' },
  eyeOff: { ios: 'eye.slash', md: 'visibility_off' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', md: 'logout' },
  faceId: { ios: 'faceid', md: 'fingerprint' },
  lock: { ios: 'lock.fill', md: 'lock' },
  mail: { ios: 'envelope', md: 'mail' },
  mic: { ios: 'mic.fill', md: 'mic' },
  camera: { ios: 'camera.fill', md: 'photo_camera' },
  receipt: { ios: 'doc.text', md: 'receipt_long' },
  shield: { ios: 'checkmark.shield.fill', md: 'shield' },
  wallet: { ios: 'wallet.pass.fill', md: 'account_balance_wallet' },
  savings: { ios: 'banknote.fill', md: 'savings' },
  bolt: { ios: 'bolt.fill', md: 'bolt' },
  more: { ios: 'ellipsis', md: 'more_horiz' },
  // categorias
  food: { ios: 'fork.knife', md: 'restaurant' },
  cart: { ios: 'cart.fill', md: 'shopping_cart' },
  home: { ios: 'house.fill', md: 'home' },
  car: { ios: 'car.fill', md: 'directions_car' },
  game: { ios: 'gamecontroller.fill', md: 'sports_esports' },
  heart: { ios: 'heart.fill', md: 'favorite' },
  money: { ios: 'banknote.fill', md: 'payments' },
  plane: { ios: 'airplane', md: 'flight' },
  school: { ios: 'graduationcap.fill', md: 'school' },
  trendUp: { ios: 'chart.line.uptrend.xyaxis', md: 'trending_up' },
} as const satisfies Record<string, { ios: SFSymbol; md: AndroidSymbol }>;

export type IconName = keyof typeof icons;

/** Ícones que chegam da API (nomes livres) caem num ícone conhecido. */
const aliases: Record<string, IconName> = {
  'fork.knife': 'food', food: 'food', restaurant: 'food', alimentacao: 'food',
  cart: 'cart', mercado: 'cart', shopping: 'cart',
  house: 'home', home: 'home', moradia: 'home',
  car: 'car', transporte: 'car',
  gamecontroller: 'game', lazer: 'game',
  heart: 'heart', saude: 'heart', health: 'heart',
  banknote: 'money', salary: 'money', salario: 'money', money: 'money',
  sparkles: 'sparkles', shield: 'shield', airplane: 'plane', plane: 'plane', viagem: 'plane',
  school: 'school', educacao: 'school', savings: 'savings', invest: 'trendUp',
};

export function resolveIcon(name?: string | null, fallback: IconName = 'wallet'): IconName {
  if (!name) return fallback;
  if (name in icons) return name as IconName;
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return aliases[key] ?? fallback;
}

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const icon = icons[name];
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.md, web: icon.md }}
      size={size}
      tintColor={color}
      style={style}
    />
  );
}
