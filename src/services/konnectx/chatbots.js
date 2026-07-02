import konnectxClient from './client';

export async function getBots(userId) {
  const { data } = await konnectxClient.get('/chatbots', { params: { userId } });
  return data.data ?? data;
}

export async function saveBot(userId, body) {
  const { data } = await konnectxClient.post('/chatbots', body, { params: { userId } });
  return data;
}

export async function updateBot(userId, id, body) {
  const { data } = await konnectxClient.put(`/chatbots/${id}`, body, { params: { userId } });
  return data;
}

export async function deleteBot(userId, id) {
  const { data } = await konnectxClient.delete(`/chatbots/${id}`, { params: { userId } });
  return data;
}

export async function toggleBot(userId, id, active) {
  const { data } = await konnectxClient.patch(`/chatbots/${id}/toggle`, { active }, { params: { userId } });
  return data;
}
