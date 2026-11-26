const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatMoney(value: number | null | undefined, opts?: { compact?: boolean; hidden?: boolean }) {
  if (opts?.hidden) return 'R$ ••••';
  const n = Number.isFinite(value) ? (value as number) : 0;
  return (opts?.compact && Math.abs(n) >= 10_000 ? brlCompact : brl).format(n);
}

/**
 * Converte o que o usuário digita num campo de dinheiro em centavos.
 * Só dígitos contam: "1.234,56" -> 123456. Evita erros de ponto flutuante.
 */
export function digitsToCents(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, 12);
  return digits ? parseInt(digits, 10) : 0;
}

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatCentsInput(cents: number): string {
  return cents === 0 ? '' : brl.format(cents / 100);
}
