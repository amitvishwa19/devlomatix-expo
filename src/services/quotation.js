import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

export async function getQuotations(params = {}) {
  const { data } = await api.get(apiUrls.quotation, { params });
  return data;
}

export async function getQuotation(id) {
  const { data } = await api.get(`${apiUrls.quotationById}/${id}`);
  return data;
}

export async function saveQuotation(body) {
  const { data } = await api.post(apiUrls.quotation, body);
  return data;
}

export async function updateQuotation(id, body) {
  const { data } = await api.put(`${apiUrls.quotationById}/${id}`, body);
  return data;
}

export async function deleteQuotation(id) {
  const { data } = await api.delete(`${apiUrls.quotationById}/${id}`);
  return data;
}
