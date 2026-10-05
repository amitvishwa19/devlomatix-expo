import konnectxClient from './client';

export async function getStores(userId, params = {}) {
  const { data } = await konnectxClient.get('/ecommerce', { params: { userId, ...params } });
  return data.data ?? data;
}

export async function saveStore(userId, body) {
  const { data } = await konnectxClient.post('/ecommerce', body, { params: { userId, workspaceId: body.workspaceId } });
  return data;
}

export async function deleteStore(userId, id) {
  const { data } = await konnectxClient.delete('/ecommerce', { params: { userId, id } });
  return data;
}