import * as Clipboard from 'expo-clipboard';

/**
 * Copies text to the system clipboard.
 *
 * `expo-clipboard` has no web implementation of `setStringAsync`, so the web
 * target falls back to the async Clipboard API. Returns `false` instead of
 * throwing so callers can surface a single toast on failure.
 */
export async function copyToClipboard(text) {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (!value) return false;

  try {
    if (Platform_isWeb()) {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
      return false;
    }

    await Clipboard.setStringAsync(value);
    return true;
  } catch (error) {
    console.error('copyToClipboard failed:', error);
    return false;
  }
}

/** Minimal platform check so this util stays dependency-free. */
function Platform_isWeb() {
  // `Platform` is not imported here to keep the util usable from plain JS too.
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Renders a message list as plain text for sharing outside the app.
 *
 * Direction is preserved with an arrow so the transcript stays readable, and
 * blank messages are skipped so the output has no double gaps.
 */
export function formatMessagesForClipboard(messages, { nameOf } = {}) {
  if (!Array.isArray(messages)) return '';

  const lines = messages
    .map((message) => {
      const text = typeof message?.text === 'string' ? message.text.trim() : '';
      if (!text) return '';

      const who = message.fromMe
        ? 'You'
        : nameOf
          ? nameOf(message)
          : 'Them';

      const stamp = message.timestamp
        ? new Date(message.timestamp).toLocaleString()
        : '';

      return `${stamp ? `[${stamp}] ` : ''}${who}: ${text}`;
    })
    .filter(Boolean);

  return lines.join('\n');
}