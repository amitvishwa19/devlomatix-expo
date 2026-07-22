import konnectxClient from './client';

export async function getTemplates(userId) {
  const { data } = await konnectxClient.get('/templates', { params: { userId } });
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

export async function syncTemplates(userId) {
  const { data } = await konnectxClient.post('/templates/sync', {}, { params: { userId } });
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
