import { useMemo } from 'react';
import Markdown from 'react-native-markdown-display';
import { useCrmTheme } from '~/utils/crm/colors';

export default function MarkdownMessage({ content, color }) {
  const { colors } = useCrmTheme();
  const textColor = color || colors.text;

  const styles = useMemo(
    () => ({
      body: { color: textColor, fontSize: 12, lineHeight: 20 },
      paragraph: { marginTop: 0, marginBottom: 6 },
      text: { color: textColor, fontSize: 12, lineHeight: 20 },
      strong: { fontWeight: '700', color: textColor },
      em: { fontStyle: 'italic' },
      link: { color: colors.primary, textDecorationLine: 'underline' },
      heading1: { color: textColor, fontSize: 18, fontWeight: '800', marginBottom: 6 },
      heading2: { color: textColor, fontSize: 16, fontWeight: '800', marginBottom: 5 },
      heading3: { color: textColor, fontSize: 14, fontWeight: '700', marginBottom: 4 },
      heading4: { color: textColor, fontSize: 13, fontWeight: '700', marginBottom: 4 },
      heading5: { color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 3 },
      heading6: { color: textColor, fontSize: 12, fontWeight: '700', marginBottom: 3 },
      bullet_list: { marginVertical: 2 },
      ordered_list: { marginVertical: 2 },
      list_item: { marginBottom: 3 },
      code_inline: {
        backgroundColor: colors.cardAlt,
        color: colors.primary,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontFamily: 'monospace',
      },
      code_block: {
        backgroundColor: colors.cardAlt,
        color: textColor,
        borderRadius: 8,
        padding: 8,
        fontFamily: 'monospace',
      },
      fence: {
        backgroundColor: colors.cardAlt,
        color: textColor,
        borderRadius: 8,
        padding: 8,
        fontFamily: 'monospace',
      },
      blockquote: {
        backgroundColor: colors.cardAlt,
        borderLeftColor: colors.primary,
        borderLeftWidth: 3,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginVertical: 4,
      },
      hr: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
      table: { borderColor: colors.border, borderWidth: 1, borderRadius: 6 },
      tr: { borderBottomColor: colors.border, borderBottomWidth: 1 },
      th: { padding: 4 },
      td: { padding: 4 },
    }),
    [colors, textColor]
  );

  if (!content) return null;

  return <Markdown style={styles}>{content}</Markdown>;
}
