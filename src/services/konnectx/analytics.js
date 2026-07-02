import konnectxClient from './client';

export async function getAnalytics(userId, days = 30) {
  const { data } = await konnectxClient.get('/analytics', { params: { userId, days } });
  return data.data ?? data;
}

export async function getStats(userId) {
  const { data } = await konnectxClient.get('/stats', { params: { userId } });
  return data.data ?? data;
}

export async function getActivities(userId, page = 1, pageSize = 10) {
  const { data } = await konnectxClient.get('/activities', {
    params: { userId, page, pageSize }
  });
  return data.data ?? data;
}
