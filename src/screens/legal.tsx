import { StyleSheet, View } from 'react-native';

import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { LEGAL_UPDATED_AT, privacyPolicy, termsOfUse, type LegalSection } from '@/content/legal';
import { spacing } from '@/theme';

function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <SheetFrame title={title}>
      <Text variant="caption" color="textMuted">
        Atualizado em {LEGAL_UPDATED_AT}
      </Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="bodyStrong" accessibilityRole="header">
            {section.title}
          </Text>
          {section.paragraphs.map((p, i) => (
            <Text key={i} variant="body" color="textSecondary">
              {p}
            </Text>
          ))}
        </View>
      ))}
    </SheetFrame>
  );
}

export function PrivacyPolicyScreen() {
  return <LegalPage title="Política de Privacidade" sections={privacyPolicy} />;
}

export function TermsScreen() {
  return <LegalPage title="Termos de Uso" sections={termsOfUse} />;
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
