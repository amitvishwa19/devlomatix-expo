import * as crmService from '~/services/crm';

// The backend currently returns the full reply in one response. Keep the
// adapter boundary so a real SSE/WebSocket stream can be implemented here
// without touching the chat UI.
export function supportsStreaming() {
  return false;
}

function extractReply(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  return (
    payload.reply ||
    payload.message ||
    payload.content ||
    payload.text ||
    payload.data?.reply ||
    payload.data?.message ||
    payload.data?.content ||
    ''
  );
}

export async function sendCopilotMessage({ message, history = [], params = {}, onChunk }) {
  const res = await crmService.askCopilotChat(message, history, params);
  const reply = extractReply(res?.data);

  if (reply && typeof onChunk === 'function') {
    onChunk(reply);
  }

  return {
    success: Boolean(reply),
    reply,
    actions: Array.isArray(res?.data?.actions) ? res.data.actions : [],
    raw: res?.data,
    error: reply ? null : res?.error || 'No response received from Copilot.',
  };
}
