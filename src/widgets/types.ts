/**
 * O que o app manda para o widget. Tudo já vem formatado (o widget roda
 * isolado, sem acesso ao app) e respeita o modo discreto.
 */
export interface FiniWidgetProps {
  signedIn: boolean;
  /** "Novembro" */
  month: string;
  /** "R$ 1.234,56" ou "R$ ••••" no modo discreto */
  balance: string;
  income: string;
  expense: string;
  /** Saldo negativo pinta de vermelho. */
  negative: boolean;
  goalName: string | null;
  /** 0 a 1 */
  goalProgress: number;
  /** "R$ 300 de R$ 1.000" */
  goalText: string;
}

export const EMPTY_WIDGET_PROPS: FiniWidgetProps = {
  signedIn: false,
  month: '',
  balance: '',
  income: '',
  expense: '',
  negative: false,
  goalName: null,
  goalProgress: 0,
  goalText: '',
};
