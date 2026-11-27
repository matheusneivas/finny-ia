import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { ProgressBar } from '@/components/misc';
import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { qk } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { billingApi } from '@/lib/api/endpoints';
import type { BillingPlans, PixCharge, Subscription } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { radius, spacing, useColors } from '@/theme';
import { formatFullDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

const subscriptionKey = ['billing', 'subscription'] as const;

/** Espera pelo pagamento: cartão por até 1 min depois do checkout; Pix enquanto o QR code vale. */
type Waiting = { kind: 'card' | 'pix'; until: number; premiumUntilBefore: string | null } | null;

function newKey() {
  return `pix-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isPaid(w: NonNullable<Waiting>, d: Subscription) {
  if (w.kind === 'pix') return d.premiumUntil != null && d.premiumUntil !== w.premiumUntilBefore;
  return d.plan === 'PREMIUM' && d.premiumUntil !== w.premiumUntilBefore;
}

const dateOf = (iso: string | null | undefined) => (iso ? formatFullDate(iso.slice(0, 10)) : '');

export function PremiumScreen({ reason }: { reason?: string }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { setPlan } = useAuth();
  const [waiting, setWaiting] = useState<Waiting>(null);
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [busy, setBusy] = useState<'trial' | 'card' | 'pix' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const pixKey = useRef<string | null>(null);

  // Ao abrir a tela (ex.: voltando do checkout), um cartão pendente é consultado por 1 minuto.
  const [pendingWindowOpen, setPendingWindowOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPendingWindowOpen(false), 60_000);
    return () => clearTimeout(t);
  }, []);

  // A espera termina sozinha no prazo (1 min no cartão; validade do QR code no Pix).
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setWaiting((w) => (w === waiting ? null : w)), Math.max(0, waiting.until - Date.now()));
    return () => clearTimeout(t);
  }, [waiting]);

  const plans = useQuery({ queryKey: ['billing', 'plans'], queryFn: billingApi.plans, staleTime: 10 * 60_000 });
  const sub = useQuery({ queryKey: subscriptionKey, queryFn: billingApi.subscription });

  const data = sub.data;
  const premium = data?.plan === 'PREMIUM';
  const paid = !!waiting && !!data && isPaid(waiting, data);
  const cardPending = data?.card?.status === 'PENDING' && !premium;
  const polling = (!!waiting && !paid) || (cardPending && pendingWindowOpen && !waiting);
  const waitingCard = polling && waiting?.kind !== 'pix';
  const showPix = pix && !paid ? pix : null;
  const celebrate = premium && (justActivated || paid);

  // Consulta a assinatura a cada 3 s enquanto espera o pagamento.
  const { refetch } = sub;
  useEffect(() => {
    if (!polling) return;
    const t = setInterval(() => void refetch(), 3000);
    return () => clearInterval(t);
  }, [polling, refetch]);

  // Mantém o selo do plano (Perfil) igual ao que a API diz.
  useEffect(() => {
    if (data) setPlan(data.plan, data.premiumUntil);
  }, [data, setPlan]);

  // Pagamento confirmado: o limite de conversas muda.
  useEffect(() => {
    if (paid) void queryClient.invalidateQueries({ queryKey: qk.chatStats });
  }, [paid, queryClient]);

  function apply(next: Subscription) {
    queryClient.setQueryData(subscriptionKey, next);
  }

  function fail(e: unknown, fallback: string) {
    setError(e instanceof ApiError ? (e.status === 503 ? 'Pagamentos indisponíveis agora. Tente de novo mais tarde.' : e.message) : fallback);
  }

  async function startTrial() {
    setError(null);
    setBusy('trial');
    try {
      apply(await billingApi.trial());
      setJustActivated(true);
      void queryClient.invalidateQueries({ queryKey: qk.chatStats });
    } catch (e) {
      fail(e, 'Não foi possível liberar o teste agora.');
    } finally {
      setBusy(null);
    }
  }

  async function payWithCard() {
    setError(null);
    setBusy('card');
    try {
      const next = await billingApi.card();
      apply(next);
      const url = next.card?.checkoutUrl;
      if (!url) throw new ApiError(500, 'O Mercado Pago não devolveu a página de pagamento. Tente de novo.');
      if (Platform.OS === 'web') {
        // Mesma aba: o Mercado Pago volta para /premium e a sessão continua nesta aba.
        window.location.assign(url);
        return;
      }
      setWaiting({ kind: 'card', until: Date.now() + 60_000, premiumUntilBefore: next.premiumUntil });
      await WebBrowser.openBrowserAsync(url);
      // Voltou do navegador: recomeça o minuto de espera a partir de agora.
      setWaiting({ kind: 'card', until: Date.now() + 60_000, premiumUntilBefore: next.premiumUntil });
      void sub.refetch();
    } catch (e) {
      fail(e, 'Não foi possível abrir o pagamento no cartão.');
    } finally {
      setBusy(null);
    }
  }

  async function payWithPix() {
    setError(null);
    setBusy('pix');
    // A mesma chave para toques repetidos: a API devolve o mesmo Pix.
    pixKey.current ??= newKey();
    try {
      const charge = await billingApi.pix(pixKey.current);
      setPix(charge);
      setCopied(false);
      setWaiting({ kind: 'pix', until: new Date(charge.expiresAt).getTime() || Date.now() + 24 * 3600_000, premiumUntilBefore: data?.premiumUntil ?? null });
    } catch (e) {
      pixKey.current = null;
      fail(e, 'Não foi possível gerar o Pix agora.');
    } finally {
      setBusy(null);
    }
  }

  async function copyPix() {
    if (!pix) return;
    await Clipboard.setStringAsync(pix.qrCode);
    setCopied(true);
  }

  function cancelCard() {
    const run = async () => {
      setError(null);
      setBusy('cancel');
      try {
        apply(await billingApi.cancelCard());
      } catch (e) {
        fail(e, 'Não foi possível cancelar agora.');
      } finally {
        setBusy(null);
      }
    };
    const until = dateOf(data?.premiumUntil);
    const text = `A cobrança no cartão para. O Premium continua${until ? ` até ${until}` : ' até o fim do mês pago'}.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Cancelar a assinatura? ${text}`) ?? true) void run();
      return;
    }
    Alert.alert('Cancelar a assinatura?', text, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar assinatura', style: 'destructive', onPress: () => void run() },
    ]);
  }

  const loading = plans.isLoading || sub.isLoading;
  const loadError = plans.error ?? sub.error;

  return (
    <SheetFrame title="Finny Premium">
      {reason === 'limite' && !premium ? (
        <Card tone="warningSoft">
          <Text variant="bodyStrong">Você chegou ao limite do plano grátis.</Text>
          <Text variant="label" color="textSecondary">
            Assine o Premium para continuar anotando, criando metas e conversando com o Finny sem limite.
          </Text>
        </Card>
      ) : null}

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.aiSoft }]}>
          <Icon name="crown" size={28} color={colors.ai} />
        </View>
        <Text variant="title" align="center">
          {premium ? 'Você é Premium' : 'Seu dinheiro sem limites'}
        </Text>
        {plans.data ? (
          <Text variant="body" color="textSecondary" align="center">
            <Text variant="bodyStrong" color="ai">
              {formatMoney(plans.data.monthlyPrice)}
            </Text>{' '}
            por mês. Cancele quando quiser.
          </Text>
        ) : null}
      </View>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {loadError ? (
        <Card tone="expenseSoft">
          <Text variant="label" color="danger">
            {loadError instanceof ApiError ? loadError.message : 'Não foi possível carregar os planos.'}
          </Text>
          <Button title="Tentar de novo" size="sm" variant="secondary" onPress={() => void Promise.all([plans.refetch(), sub.refetch()])} />
        </Card>
      ) : null}

      {celebrate ? (
        <Card tone="primarySoft">
          <Text variant="bodyStrong" color="primary">
            Premium liberado! 🎉
          </Text>
          <Text variant="label" color="textSecondary">
            Pode usar o Finny sem limite.
          </Text>
        </Card>
      ) : null}

      {data && premium ? <PremiumStatus data={data} /> : null}

      {plans.data ? <Comparison plans={plans.data} /> : null}

      {data && plans.data && !premium ? <Usage plans={plans.data} data={data} /> : null}

      {showPix ? (
        <Card style={styles.pix}>
          <Text variant="heading">Pague com Pix</Text>
          <Text variant="label" color="textSecondary" align="center">
            Abra o app do seu banco, escolha Pix e leia o QR code ou use o “copia e cola”. Libera {showPix.premiumDays} dias de
            Premium por {formatMoney(showPix.amount)}.
          </Text>
          <Image
            source={{ uri: `data:image/png;base64,${showPix.qrCodeBase64}` }}
            style={styles.qr}
            contentFit="contain"
            accessibilityLabel="QR code do Pix"
          />
          <Button title={copied ? 'Código copiado' : 'Copiar código Pix'} icon={copied ? 'check' : 'copy'} variant="secondary" fullWidth onPress={() => void copyPix()} />
          <View style={styles.waitRow}>
            <ActivityIndicator size="small" color={colors.ai} />
            <Text variant="caption" color="textSecondary">
              Esperando o pagamento… vale até {new Date(showPix.expiresAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.
            </Text>
          </View>
        </Card>
      ) : null}

      {waitingCard ? (
        <View style={styles.waitRow}>
          <ActivityIndicator size="small" color={colors.ai} />
          <Text variant="label" color="textSecondary" style={styles.flex}>
            Confirmando o pagamento no cartão com o Mercado Pago…
          </Text>
        </View>
      ) : null}
      {!polling && cardPending ? (
        <Text variant="caption" color="textSecondary">
          Ainda não recebemos a confirmação do cartão. Se você já terminou o pagamento, ela chega em alguns minutos.
        </Text>
      ) : null}

      {error ? (
        <Text variant="label" color="danger" accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}

      {data && plans.data ? (
        <View style={styles.actions}>
          {!premium && data.trialAvailable && plans.data.trialDays > 0 ? (
            <Button
              title={`Testar ${plans.data.trialDays} dias grátis`}
              variant="ai"
              size="lg"
              icon="sparkles"
              fullWidth
              loading={busy === 'trial'}
              onPress={() => void startTrial()}
            />
          ) : null}
          {plans.data.enabled ? (
            <>
              {data.card?.status !== 'ACTIVE' ? (
                <Button
                  title={premium ? 'Renovar sozinho no cartão' : 'Assinar no cartão'}
                  icon="card"
                  size="lg"
                  variant={!premium && data.trialAvailable ? 'secondary' : 'primary'}
                  fullWidth
                  loading={busy === 'card'}
                  onPress={() => void payWithCard()}
                />
              ) : null}
              {!showPix ? (
                <Button
                  title={premium ? `Somar ${plans.data.pixDays} dias com Pix` : `Pagar ${plans.data.pixDays} dias com Pix`}
                  icon="qrcode"
                  size="lg"
                  variant="secondary"
                  fullWidth
                  loading={busy === 'pix'}
                  onPress={() => void payWithPix()}
                />
              ) : null}
              {data.card?.status === 'ACTIVE' ? (
                <Button title="Cancelar assinatura no cartão" variant="ghost" fullWidth loading={busy === 'cancel'} onPress={cancelCard} />
              ) : null}
              <Text variant="caption" color="textMuted" align="center">
                Pagamento seguro pelo Mercado Pago. O Finny não vê nem guarda os dados do seu cartão.
              </Text>
            </>
          ) : (
            <Text variant="caption" color="textSecondary" align="center">
              Os pagamentos ainda não estão abertos. Em breve você poderá assinar por aqui.
            </Text>
          )}
        </View>
      ) : null}
    </SheetFrame>
  );
}

function PremiumStatus({ data }: { data: Subscription }) {
  const until = dateOf(data.premiumUntil);
  const cardText =
    data.card?.status === 'ACTIVE'
      ? 'Renova sozinho todo mês no cartão.'
      : data.card?.status === 'CANCELED'
        ? 'Assinatura no cartão cancelada: não haverá nova cobrança.'
        : 'Sem renovação automática. Pague de novo com Pix ou assine no cartão para não perder.';
  return (
    <Card tone="aiSoft">
      <Text variant="bodyStrong">{until ? `Premium ativo até ${until}` : 'Premium ativo'}</Text>
      <Text variant="label" color="textSecondary">
        {cardText}
      </Text>
    </Card>
  );
}

function Comparison({ plans }: { plans: BillingPlans }) {
  const colors = useColors();
  const n = (v: number) => v.toLocaleString('pt-BR');
  const rows: { icon: IconName; label: string; free: string; premium: string }[] = [
    { icon: 'sheet', label: 'Lançamentos por mês', free: n(plans.free.transactionsPerMonth), premium: 'Sem limite' },
    { icon: 'goals', label: 'Metas ativas', free: n(plans.free.activeGoals), premium: 'Sem limite' },
    {
      icon: 'chat',
      label: 'Conversas com o Finny por mês',
      free: n(plans.free.chatMessagesPerMonth),
      premium: n(plans.premiumChatMessagesPerMonth),
    },
  ];
  return (
    <Card>
      <View style={styles.tableHead}>
        <View style={styles.flex} />
        <Text variant="label" color="textSecondary" style={styles.col}>
          Grátis
        </Text>
        <Text variant="label" color="ai" style={styles.col}>
          Premium
        </Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={[styles.tableRow, { borderColor: colors.border }]}>
          <View style={[styles.flex, styles.tableLabel]}>
            <Icon name={r.icon} size={16} color={colors.textSecondary} />
            <Text variant="label" style={styles.flex}>
              {r.label}
            </Text>
          </View>
          <Text variant="label" color="textSecondary" style={styles.col}>
            {r.free}
          </Text>
          <Text variant="bodyStrong" color="ai" style={styles.col}>
            {r.premium}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function Usage({ plans, data }: { plans: BillingPlans; data: Subscription }) {
  const items = [
    { label: 'Lançamentos este mês', used: data.usage.transactionsThisMonth, limit: plans.free.transactionsPerMonth },
    { label: 'Metas ativas', used: data.usage.activeGoals, limit: plans.free.activeGoals },
  ];
  return (
    <Card style={styles.usage}>
      <Text variant="overline" color="textSecondary">
        Seu uso no plano grátis
      </Text>
      {items.map((i) => (
        <View key={i.label} style={styles.usageItem}>
          <View style={styles.usageHead}>
            <Text variant="label" color="textSecondary">
              {i.label}
            </Text>
            <Text variant="label">
              {Math.min(i.used, i.limit)}/{i.limit}
            </Text>
          </View>
          <ProgressBar value={(i.used / Math.max(i.limit, 1)) * 100} tone={i.used >= i.limit ? 'danger' : 'primary'} height={6} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tableHead: { flexDirection: 'row', paddingBottom: spacing.sm },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  tableLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  col: { width: 84, textAlign: 'center' },
  usage: { gap: spacing.md },
  usageItem: { gap: spacing.sm },
  usageHead: { flexDirection: 'row', justifyContent: 'space-between' },
  pix: { alignItems: 'center', gap: spacing.md },
  qr: { width: 220, height: 220 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
  actions: { gap: spacing.sm },
});
