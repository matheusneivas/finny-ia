/** Datas no formato da API (LocalDate ISO, sem fuso): "2026-11-26". */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function today(): string {
  return toIsoDate(new Date());
}

export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toIsoDate(d);
}

export interface MonthRef {
  year: number;
  month: number; // 0-11
}

export function currentMonth(): MonthRef {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const d = new Date(ref.year, ref.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthRange(ref: MonthRef): { startDate: string; endDate: string } {
  return {
    startDate: toIsoDate(new Date(ref.year, ref.month, 1)),
    endDate: toIsoDate(new Date(ref.year, ref.month + 1, 0)),
  };
}

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const fullFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export function formatMonth(ref: MonthRef): string {
  const s = monthFmt.format(new Date(ref.year, ref.month, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDay(iso: string): string {
  return dayFmt.format(parseIsoDate(iso)).replace('.', '');
}

export function formatFullDate(iso: string): string {
  return fullFmt.format(parseIsoDate(iso));
}

export function isSameMonth(a: MonthRef, b: MonthRef) {
  return a.year === b.year && a.month === b.month;
}

/** Meses inteiros até a data (mínimo 1). Usado para "guardar R$ X por mês". */
export function monthsUntil(iso: string): number {
  const now = new Date();
  const target = parseIsoDate(iso);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}

/** "DD/MM/AAAA" digitado -> ISO, ou null se inválida. */
export function brDateToIso(text: string): string | null {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number) as unknown as [number, number, number, number];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return toIsoDate(date);
}

export function isoToBrDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Máscara progressiva DD/MM/AAAA. */
export function maskBrDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
