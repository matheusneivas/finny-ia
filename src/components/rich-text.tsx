import { Fragment } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Text } from './text';

/**
 * Markdown mínimo e seguro para as respostas da IA: **negrito**, *itálico*,
 * `código`, títulos (#), listas (- , * , 1.). Tudo vira <Text>; nada é
 * interpretado como HTML e links não ficam clicáveis (evita phishing via IA).
 */
type Inline = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: line.slice(last, i) });
    const tok = m[0];
    if (tok.startsWith('**') || tok.startsWith('__')) out.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('`')) out.push({ text: tok.slice(1, -1), code: true });
    else out.push({ text: tok.slice(1, -1), italic: true });
    last = i + tok.length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'li'; text: string; marker: string }
  | { kind: 'gap' };

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of src.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (blocks.length && blocks[blocks.length - 1].kind !== 'gap') blocks.push({ kind: 'gap' });
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      blocks.push({ kind: 'h', text: h[1] });
      continue;
    }
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      blocks.push({ kind: 'li', text: bullet[1], marker: '•' });
      continue;
    }
    const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (num) {
      blocks.push({ kind: 'li', text: num[2], marker: `${num[1]}.` });
      continue;
    }
    blocks.push({ kind: 'p', text: line });
  }
  while (blocks.length && blocks[blocks.length - 1].kind === 'gap') blocks.pop();
  return blocks;
}

export function RichText({ children, color }: { children: string; color: string }) {
  const colors = useColors();
  const blocks = parseBlocks(children);

  const renderInline = (text: string) =>
    parseInline(text).map((part, i) => {
      const style: TextStyle = {
        ...(part.bold ? { fontWeight: '700' } : null),
        ...(part.italic ? { fontStyle: 'italic' } : null),
        ...(part.code ? { fontFamily: 'Menlo', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm } : null),
      };
      return (
        <Fragment key={i}>
          {part.bold || part.italic || part.code ? <Text style={[style, { color }]}>{part.text}</Text> : part.text}
        </Fragment>
      );
    });

  return (
    <View style={styles.root}>
      {blocks.map((b, i) => {
        if (b.kind === 'gap') return <View key={i} style={styles.gap} />;
        if (b.kind === 'h')
          return (
            <Text key={i} variant="bodyStrong" selectable style={{ color }}>
              {renderInline(b.text)}
            </Text>
          );
        if (b.kind === 'li')
          return (
            <View key={i} style={styles.li}>
              <Text variant="body" style={[styles.marker, { color }]}>
                {b.marker}
              </Text>
              <Text variant="body" selectable style={[styles.flex, { color }]}>
                {renderInline(b.text)}
              </Text>
            </View>
          );
        return (
          <Text key={i} variant="body" selectable style={{ color }}>
            {renderInline(b.text)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  gap: { height: spacing.xs },
  li: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  marker: { minWidth: 14 },
  flex: { flex: 1 },
});
