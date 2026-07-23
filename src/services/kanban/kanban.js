import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

export async function fetchBoard(workspaceId) {
  const { data } = await api.get(apiUrls.kanban, { params: { workspaceId } });
  return data;
}

export async function createColumn(payload) {
  const { data } = await api.post(apiUrls.kanbanColumns, payload);
  return data;
}

export async function deleteColumn(id) {
  const { data } = await api.delete(apiUrls.kanbanColumnById + `/${id}`);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post(apiUrls.kanbanTasks, payload);
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.patch(apiUrls.kanbanTaskById + `/${id}`, payload);
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(apiUrls.kanbanTaskById + `/${id}`);
  return data;
}

export async function createChecklistItem(taskId, payload) {
  const { data } = await api.post(apiUrls.kanbanChecklists + `/${taskId}/checklists`, payload);
  return data;
}

export async function updateChecklistItem(taskId, itemId, payload) {
  const { data } = await api.patch(apiUrls.kanbanChecklistItem + `/${taskId}/checklists/${itemId}`, payload);
  return data;
}

export async function deleteChecklistItem(taskId, itemId) {
  const { data } = await api.delete(apiUrls.kanbanChecklistItem + `/${taskId}/checklists/${itemId}`);
  return data;
}

export async function generateAiDescription(payload) {
  const { data } = await api.post(apiUrls.kanbanAiDescription, payload);
  return data;
}
