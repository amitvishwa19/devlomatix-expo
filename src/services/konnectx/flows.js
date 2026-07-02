import konnectxClient from './client';

export async function getFlows() {
  const { data } = await konnectxClient.get('/flows');
  return data.data ?? data;
}

export async function saveFlow(userId, body) {
  const { data } = await konnectxClient.post('/flows', body, { params: { userId } });
  return data;
}

export async function updateFlow(id, body) {
  const { data } = await konnectxClient.put(`/flows/${id}`, body);
  return data;
}

export async function deleteFlow(id) {
  const { data } = await konnectxClient.delete(`/flows/${id}`);
  return data;
}

export async function cloneFlow(userId, id) {
  const { data } = await konnectxClient.post(`/flows/${id}/clone`, {}, { params: { userId } });
  return data;
}

export async function pushFlowToMeta(userId, id) {
  const { data } = await konnectxClient.post(`/flows/${id}/push`, {}, { params: { userId } });
  return data;
}

export async function publishFlowMeta(userId, id) {
  const { data } = await konnectxClient.post(`/flows/${id}/publish`, {}, { params: { userId } });
  return data;
}

export async function syncMetaFlows(userId) {
  const { data } = await konnectxClient.post('/flows/sync-meta', {}, { params: { userId } });
  return data;
}
