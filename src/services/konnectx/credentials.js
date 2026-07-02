import konnectxClient from './client';

export async function getCredentials(userId) {
  const { data } = await konnectxClient.get('/credentials', { params: { userId } });
  return data.data ?? data;
}

export async function getDefaultCredential(userId) {
  const { data } = await konnectxClient.get('/credentials/default', { params: { userId } });
  return data.data ?? data;
}

export async function saveCredential(userId, body) {
  const { data } = await konnectxClient.post('/credentials', body, { params: { userId } });
  return data;
}

export async function deleteCredential(userId, id) {
  const { data } = await konnectxClient.delete(`/credentials/${id}`, { params: { userId } });
  return data;
}

export async function setDefaultCredential(userId, credentialId) {
  const { data } = await konnectxClient.patch(`/credentials/${credentialId}`, { isDefault: true }, { params: { userId } });
  return data;
}

export async function testCredential(body) {
  const { data } = await konnectxClient.post('/credentials/test', body);
  return data;
}

export async function testMetaApi(body) {
  const { data } = await konnectxClient.post('/credentials/meta-test', body);
  return data;
}
