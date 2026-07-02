import konnectxClient from './client';

export async function getMetadata() {
  const { data } = await konnectxClient.get('/settings/metadata');
  return data.data ?? data;
}

export async function updateMetadata(body) {
  const { data } = await konnectxClient.patch('/settings/metadata', body);
  return data;
}

export async function processOAuthCode(userId, code) {
  const { data } = await konnectxClient.post('/settings/oauth/process', { code }, { params: { userId } });
  return data;
}

export async function saveTestNumbers(userId, testNumbers) {
  const { data } = await konnectxClient.post('/settings/test-numbers', { testNumbers }, { params: { userId } });
  return data;
}

export async function getAutoResponder() {
  const { data } = await konnectxClient.get('/auto-responder');
  return data.data ?? data;
}

export async function saveAutoResponder(userId, body) {
  const { data } = await konnectxClient.post('/auto-responder', body, { params: { userId } });
  return data;
}

export async function deleteAutoResponder(id) {
  const { data } = await konnectxClient.delete(`/auto-responder?id=${id}`);
  return data;
}

export async function getDocs(category) {
  const { data } = await konnectxClient.get('/docs', { params: { category } });
  return data.data ?? data;
}

export async function saveDoc(userId, body) {
  const { data } = await konnectxClient.post('/docs', body, { params: { userId } });
  return data;
}

export async function deleteDoc(id) {
  const { data } = await konnectxClient.delete(`/docs?id=${id}`);
  return data;
}
