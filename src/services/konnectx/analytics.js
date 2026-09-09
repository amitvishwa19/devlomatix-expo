import konnectxClient from './client';

export async function getAnalytics(userId, days = 30, params = {}) {
  const queryParams = typeof params === 'object' ? { userId, days, ...params } : { userId, days, credentialId: params };
  const { data } = await konnectxClient.get('/analytics', { params: queryParams });
  return data.data ?? data;
}

export async function getStats(userId, params = {}) {
  const queryParams = typeof params === 'object' ? { userId, ...params } : { userId, credentialId: params };
  const { data } = await konnectxClient.get('/stats', { params: queryParams });
  return data.data ?? data;
}

export async function getActivities(userId, page = 1, pageSize = 10, params = {}) {
  const extraParams = typeof params === 'object' ? params : { credentialId: params };
  const { data } = await konnectxClient.get('/activities', {
    params: { userId, page, pageSize, ...extraParams }
  });
  return data.data ?? data;
}
