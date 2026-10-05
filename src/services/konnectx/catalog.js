import konnectxClient from './client';

export async function getCatalog(userId, params = {}) {
  const { data } = await konnectxClient.get('/catalog', { params: { userId, ...params } });
  return data.data ?? data;
}

export async function getCatalogProducts(userId, params = {}) {
  const { data } = await konnectxClient.get('/catalog/products', { params: { userId, ...params } });
  return data;
}

export async function saveCatalogProduct(userId, body) {
  const { data } = await konnectxClient.post('/catalog/products', body, { params: { userId } });
  return data;
}

export async function deleteCatalogProduct(userId, id) {
  const { data } = await konnectxClient.delete('/catalog/products', {
    params: { userId, id }
  });
  return data;
}

export async function importCatalog(userId, body = {}) {
  const { data } = await konnectxClient.post('/catalog', body, { params: { userId } });
  return data;
}

export async function sendCatalogMessage(userId, body) {
  const { data } = await konnectxClient.post('/catalog/send', body, { params: { userId } });
  return data;
}

export async function getCommerceSettings(userId) {
  const { data } = await konnectxClient.get('/catalog/commerce-settings', { params: { userId } });
  return data.data ?? data;
}

export async function updateCommerceSettings(userId, body) {
  const { data } = await konnectxClient.post('/catalog/commerce-settings', body, { params: { userId } });
  return data;
}

export async function linkCatalog(userId, body) {
  const { data } = await konnectxClient.post('/catalog/link', body, { params: { userId } });
  return data;
}

export async function unlinkCatalog(userId, body = {}) {
  const { data } = await konnectxClient.post('/catalog/unlink', body, { params: { userId } });
  return data;
}