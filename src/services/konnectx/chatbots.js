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

export async function getBots(arg1, extraParams = {}) {
  const userId = await resolveUserId(arg1);
  const queryParams = typeof extraParams === 'object' ? extraParams : { credentialId: extraParams };
  const params = userId ? { userId, ...queryParams } : { ...queryParams };
  const { data } = await konnectxClient.get('/chatbots', { params });
  return data.data ?? data;
}

export async function createBot(arg1, arg2) {
  const userId = await resolveUserId(arg2 !== undefined ? arg1 : null);
  const body = arg2 !== undefined ? arg2 : arg1;
  const params = userId ? { userId } : {};
  const { data } = await konnectxClient.post('/chatbots', body, { params });
  return data;
}

export async function saveBot(arg1, arg2) {
  return createBot(arg1, arg2);
}

export async function updateBot(arg1, arg2, arg3) {
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
  const { data } = await konnectxClient.put(`/chatbots/${id}`, body, { params });
  return data;
}

export async function deleteBot(arg1, arg2) {
  let userId, id;
  if (arg2 !== undefined) {
    userId = arg1;
    id = arg2;
  } else {
    id = arg1;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.delete(`/chatbots/${id}`, { params });
  return data;
}

export async function toggleBot(arg1, arg2, arg3) {
  let userId, id, active;
  if (arg3 !== undefined) {
    userId = arg1;
    id = arg2;
    active = arg3;
  } else {
    id = arg1;
    active = arg2;
  }
  const resolvedId = await resolveUserId(userId);
  const params = resolvedId ? { userId: resolvedId } : {};
  const { data } = await konnectxClient.patch(`/chatbots/${id}/toggle`, { active }, { params });
  return data;
}
