import konnectxClient from './client';
import { getSession } from '~/utils/authStorage';

async function resolveUserId(providedUserId) {
  if (providedUserId) return providedUserId;
  try {
    const session = await getSession();
    const u = session?.user;
    return u?.userId || u?.id || u?._id || u?.sub || null;
  } catch (e) {
    return null;
  }
}

export async function getCampaigns(arg1) {
  const userId = await resolveUserId(arg1);
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.get('/campaigns', { params });
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.data)) list = data.data;
  else if (Array.isArray(data?.campaigns)) list = data.campaigns;
  else if (Array.isArray(data?.data?.campaigns)) list = data.data.campaigns;
  else list = Array.isArray(data?.data) ? data.data : [];

  return list.filter((c) => c && c.status !== 'DELETED' && !c.isDeleted && !c.deletedAt);
}

export async function getCampaignDetails(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const id = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.get(`/campaigns/${id}`, { params });
  return data.data ?? data;
}

export async function saveCampaign(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const body = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post('/campaigns', body, { params });
  return data;
}

export async function updateCampaign(arg1, arg2, arg3) {
  let userId, id, body;
  if (arg3 !== undefined) {
    userId = arg1;
    id = arg2;
    body = arg3;
  } else {
    id = arg1;
    body = arg2;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.patch(`/campaigns/${id}`, body, { params });
  return data;
}

export async function deleteCampaign(arg1, arg2) {
  let userId, id;
  if (arg2 !== undefined) {
    userId = arg1;
    id = arg2;
  } else {
    id = arg1;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.delete(`/campaigns/${id}`, { params });
  return data;
}

export async function triggerCampaign(arg1, arg2, arg3) {
  let userId, id, action;
  if (arg3 !== undefined) {
    userId = arg1;
    id = arg2;
    action = arg3;
  } else {
    id = arg1;
    action = arg2;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.post(`/campaigns/${id}/trigger`, { action }, { params });
  return data;
}

export async function bulkSend(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const body = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post('/bulk-sender', body, { params });
  return data;
}
