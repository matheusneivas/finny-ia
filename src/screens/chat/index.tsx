import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiniAvatar, FiniMark } from '@/components/brand';
import { env } from '@/config/env';
import { IconButton } from '@/components/button';
import { Text } from '@/components/text';
import { qk, useChatStats } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { chatApi } from '@/lib/api/endpoints';
import type { ChatHistoryItem, ProposedAction } from '@/lib/api/types';
import { maxContentWidth, radius, spacing, typography, useColors } from '@/theme';

import { ActionCard, type ActionState } from './action-card';

const MAX_LEN = 2000;

const suggestions = [
  'Gastei 45 no almoço',
  'Recebi 600 de um freela',
  'Quanto gastei este mês?',
  'Quero juntar 5000 para uma viagem',
];

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  actions?: ProposedAction[];
  failed?: boolean;
}

export function Chat() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const queryClient = useQueryClient();
  const stats = useChatStats();
  const history = useQuery({
    queryKey: qk.chatHistory,
    queryFn: () => chatApi.history().then((p) => p.content),
    // Mensagens novas ficam em `local`; recarregar o histórico duplicaria.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const [local, setLocal] = useState<Message[]>([]); // mais novas primeiro
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});

  const messages: Message[] = useMemo(() => {
    const fromServer = (history.data ?? []).map((h: ChatHistoryItem) => ({
      id: h.id,
      role: h.role,
      content: h.content,
      actions: h.proposedActions,
    }));
    return [...local, ...fromServer];
  }, [local, history.data]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MAX_LEN);
      if (!message || sending) return;
      setInput('');
      setSending(true);
      const userMsg: Message = { id: `local-${Date.now()}`, role: 'USER', content: message };
      setLocal((cur) => [userMsg, ...cur]);
      try {
        const res = await chatApi.send(message);
        setLocal((cur) => [
          { id: `local-${Date.now()}-a`, role: 'ASSISTANT', content: res.reply, actions: res.proposedActions },
          ...cur,
        ]);
        void queryClient.invalidateQueries({ queryKey: qk.chatStats });
      } catch (e) {
        setLocal((cur) => cur.map((m) => (m.id === userMsg.id ? { ...m, failed: true } : m)));
        const msg = e instanceof ApiError ? e.message : 'Não consegui responder agora.';
        setLocal((cur) => [{ id: `local-${Date.now()}-e`, role: 'ASSISTANT', content: msg }, ...cur]);
      } finally {
        setSending(false);
      }
    },
    [queryClient, sending],
  );

  const clearHistory = () => {
    const run = async () => {
      await chatApi.clearHistory().catch(() => undefined);
      setLocal([]);
      setActionStates({});
      await queryClient.invalidateQueries({ queryKey: qk.chatHistory });
    };
    if (Platform.OS === 'web') {
      void run();
      return;
    }
    Alert.alert('Apagar conversa?', 'Suas transações e metas continuam salvas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => void run() },
    ]);
  };

  const remaining =
    stats.data?.monthlyLimit != null
      ? (stats.data.remainingThisMonth ?? stats.data.monthlyLimit - stats.data.messagesUsedThisMonth)
      : null;

  const empty = !history.isLoading && messages.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
      style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.headerInner}>
          <FiniAvatar size={36} />
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text variant="heading">Fini</Text>
              {env.useMockApi ? (
                <View style={[styles.demoBadge, { backgroundColor: colors.warningSoft }]}>
                  <Text variant="caption" color="warning">
                    Demonstração
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" color="textSecondary">
              {sending ? 'digitando…' : remaining != null ? `${remaining} mensagens restantes este mês` : 'Seu assistente financeiro'}
            </Text>
          </View>
          {messages.length > 0 ? <IconButton icon="trash" label="Apagar conversa" onPress={clearHistory} /> : null}
        </View>
      </View>

      {empty ? (
        <View style={styles.emptyWrap}>
          <FiniMark size={64} />
          <Text variant="title" align="center">
            Como posso ajudar?
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            Me conte um gasto, uma entrada ou um sonho. Eu organizo e você só confirma.
          </Text>
          {env.useMockApi ? (
            <Text variant="caption" color="warning" align="center">
              Modo demonstração: respostas simuladas no próprio app, sem a IA de verdade e sem salvar no servidor.
            </Text>
          ) : null}
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={() => void send(s)}
                style={({ pressed }) => [styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Text variant="label">{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={sending ? <TypingBubble /> : undefined}
          renderItem={({ item }) => (
            <MessageRow
              message={item}
              actionStates={actionStates}
              onActionState={(id, s) => setActionStates((cur) => ({ ...cur, [id]: s }))}
            />
          )}
        />
      )}

      <View
        style={[
          styles.composerWrap,
          // Com o teclado aberto, o campo encosta no teclado; fechado, fica acima da barra de abas.
          { paddingBottom: keyboardOpen ? spacing.sm : Math.max(insets.bottom, spacing.md) + (Platform.OS === 'web' ? 88 : 56) },
        ]}>
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escreva para o Fini…"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            multiline
            numberOfLines={Platform.OS === 'web' ? 1 : undefined}
            maxLength={MAX_LEN}
            accessibilityLabel="Mensagem para o Fini"
            onSubmitEditing={Platform.OS === 'web' ? () => void send(input) : undefined}
            blurOnSubmit={Platform.OS === 'web'}
            style={[typography.body, styles.input, { color: colors.text }]}
          />
          <IconButton
            icon="send"
            label="Enviar"
            variant="filled"
            size={36}
            disabled={!input.trim() || sending}
            onPress={() => void send(input)}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

function MessageRow({
  message,
  actionStates,
  onActionState,
}: {
  message: Message;
  actionStates: Record<string, ActionState>;
  onActionState: (id: string, s: ActionState) => void;
}) {
  const colors = useColors();
  const mine = message.role === 'USER';
  return (
    <View style={[styles.messageRow, mine ? styles.mine : styles.theirs]}>
      {!mine ? <FiniAvatar size={28} /> : null}
      <View style={[styles.messageCol, mine && { alignItems: 'flex-end' }]}>
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm / 2 }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: radius.sm / 2 },
          ]}>
          {/* Texto puro: a resposta da IA nunca é interpretada como HTML/markdown. */}
          <Text variant="body" selectable style={{ color: mine ? colors.onPrimary : colors.text }}>
            {message.content}
          </Text>
        </View>
        {message.failed ? (
          <Text variant="caption" color="danger">
            Não enviada
          </Text>
        ) : null}
        {message.actions?.map((a) => (
          <ActionCard key={a.id} action={a} state={actionStates[a.id] ?? 'pending'} onStateChange={(s) => onActionState(a.id, s)} />
        ))}
      </View>
    </View>
  );
}

function TypingBubble() {
  const colors = useColors();
  return (
    <View style={[styles.messageRow, styles.theirs]}>
      <FiniAvatar size={28} />
      <View style={[styles.bubble, styles.typing, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: colors.textMuted, opacity: 0.4 + i * 0.25 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, maxWidth: maxContentWidth, alignSelf: 'center' },
  suggestions: { gap: spacing.sm, alignSelf: 'stretch', marginTop: spacing.md },
  suggestion: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  messageRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  mine: { justifyContent: 'flex-end', paddingLeft: spacing.xxxl },
  theirs: { justifyContent: 'flex-start', paddingRight: spacing.xxl },
  messageCol: { flexShrink: 1, gap: spacing.sm },
  bubble: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md + 2, borderRadius: radius.lg, borderCurve: 'continuous' },
  typing: { flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.md },
  dot: { width: 7, height: 7, borderRadius: 4 },
  composerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
  },
  input: { flex: 1, maxHeight: 120, paddingTop: spacing.sm, paddingBottom: spacing.sm, outlineStyle: 'none' } as never,
});
