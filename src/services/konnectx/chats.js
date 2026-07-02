import konnectxClient from './client';

export async function getConversations(userId) {
  const { data } = await konnectxClient.get('/chats', { params: { userId } });
  return data.data ?? data;
}

export async function getMessages(userId, jid, params = {}) {
  const { data } = await konnectxClient.get(`/chats/${jid}`, {
    params: { userId, ...params }
  });
  return data.data ?? data;
}

export async function sendMessage(userId, body) {
  const { data } = await konnectxClient.post('/chats/send', body, { params: { userId } });
  return data;
}

export async function deleteConversation(userId, jid) {
  const { data } = await konnectxClient.delete(`/chats/${jid}`, { params: { userId } });
  return data;
}

export async function getAiSuggestions(messages) {
  const { data } = await konnectxClient.post('/chats/ai-suggestions', { messages });
  return data.data ?? data;
}
