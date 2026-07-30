import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

export async function searchLeads(params) {
  const { data } = await api.post(apiUrls.leadgen, params);
  return data;
}

export async function saveLeads(body) {
  const { data } = await api.post(apiUrls.leadgenSave, body);
  return data;
}
