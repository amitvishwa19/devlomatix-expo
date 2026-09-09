import konnectxClient from './client';

export async function getTemplates(userId, params = {}) {
  const queryParams = typeof params === 'object' ? { userId, ...params } : { userId, credentialId: params };
  const { data } = await konnectxClient.get('/templates', { params: queryParams });
  return data.data ?? data;
}

export async function saveTemplate(userId, body) {
  const { data } = await konnectxClient.post('/templates', body, { params: { userId } });
  return data;
}

export async function updateTemplate(id, body) {
  const { data } = await konnectxClient.put(`/templates/${id}`, body);
  return data;
}

export async function deleteTemplate(userId, id) {
  const { data } = await konnectxClient.delete(`/templates/${id}`, { params: { userId } });
  return data;
}

export async function syncTemplates(userId, params = {}) {
  const queryParams = typeof params === 'object' ? { userId, ...params } : { userId, credentialId: params };
  const { data } = await konnectxClient.post('/templates/sync', {}, { params: queryParams });
  return data;
}

export async function submitTemplate(userId, id, wabaId) {
  const { data } = await konnectxClient.post(`/templates/${id}/submit`, { wabaId }, { params: { userId } });
  return data;
}

export async function checkTemplateStatus(userId, id, wabaId) {
  const { data } = await konnectxClient.post(`/templates/${id}/check-status`, { wabaId }, { params: { userId } });
  return data;
}

export async function getTemplateAiSuggestion(userId, body) {
  const { data } = await konnectxClient.post('/templates/ai-suggestion', body, { params: { userId } });
  return data;
}

export async function cloneTemplate(userId, id) {
  const { data } = await konnectxClient.post(`/templates/${id}/clone`, {}, { params: { userId } });
  return data;
}

export async function shareTemplate(userId, templateId, email) {
  const { data } = await konnectxClient.post(`/templates/${templateId}/share`, { email }, { params: { userId } });
  return data;
}

export async function removeTemplateShare(userId, templateId, sharedWithUserId) {
  const { data } = await konnectxClient.post(`/templates/${templateId}/remove-share`, { sharedWithUserId }, { params: { userId } });
  return data;
}

export async function searchUsers(userId, workspaceId, query) {
  const { data } = await konnectxClient.get('/templates/search-users', { params: { userId, workspaceId, query } });
  return data.data ?? data;
}
