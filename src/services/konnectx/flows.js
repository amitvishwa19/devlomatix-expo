import konnectxClient from './client';
import { getSession } from '~/utils/authStorage';

async function resolveUserId(providedUserId) {
  if (providedUserId) return providedUserId;
  try {
    const session = await getSession();
    return session?.user?.userId || session?.user?.id || null;
  } catch (e) {
    return null;
  }
}

export async function getFlows(arg1, extraParams = {}) {
  const userId = await resolveUserId(arg1);
  const queryParams = typeof extraParams === 'object' ? extraParams : { credentialId: extraParams };
  const params = userId ? { userId, ...queryParams } : { ...queryParams };
  const { data } = await konnectxClient.get('/flows', { params });
  return data.data ?? data;
}

export async function createFlow(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const body = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post('/flows', body, { params });
  return data;
}

export async function saveFlow(arg1, arg2) {
  return createFlow(arg1, arg2);
}

export async function updateFlow(arg1, arg2, arg3) {
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
  const { data } = await konnectxClient.put(`/flows/${id}`, body, { params });
  return data;
}

export async function deleteFlow(arg1, arg2) {
  let userId, id;
  if (arg2 !== undefined) {
    userId = arg1;
    id = arg2;
  } else {
    id = arg1;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.delete(`/flows/${id}`, { params });
  return data;
}

export async function cloneFlow(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const id = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post(`/flows/${id}/clone`, {}, { params });
  return data;
}

export async function pushFlowToMeta(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const id = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post(`/flows/${id}/push`, {}, { params });
  return data;
}

export async function publishFlow(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const id = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post(`/flows/${id}/publish`, {}, { params });
  return data;
}

export async function publishFlowMeta(arg1, arg2) {
  return publishFlow(arg1, arg2);
}

export async function syncMetaFlows(arg1) {
  const userId = await resolveUserId(arg1);
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post('/flows/sync-meta', {}, { params });
  return data;
}
