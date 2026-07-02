import konnectxClient from './client';

export async function getCampaigns(userId) {
  const { data } = await konnectxClient.get('/campaigns', { params: { userId } });
  return data.data ?? data;
}

export async function getCampaignDetails(userId, id) {
  const { data } = await konnectxClient.get(`/campaigns/${id}`, { params: { userId } });
  return data.data ?? data;
}

export async function saveCampaign(userId, body) {
  const { data } = await konnectxClient.post('/campaigns', body, { params: { userId } });
  return data;
}

export async function updateCampaign(userId, id, body) {
  const { data } = await konnectxClient.patch(`/campaigns/${id}`, body, { params: { userId } });
  return data;
}

export async function deleteCampaign(userId, id) {
  const { data } = await konnectxClient.delete(`/campaigns/${id}`, { params: { userId } });
  return data;
}

export async function triggerCampaign(userId, id, action) {
  const { data } = await konnectxClient.post(`/campaigns/${id}/trigger`, { action }, { params: { userId } });
  return data;
}

export async function bulkSend(userId, body) {
  const { data } = await konnectxClient.post('/bulk-sender', body, { params: { userId } });
  return data;
}
