import konnectxClient from './client';

export async function getContacts(userId, params = {}) {
  const { data } = await konnectxClient.get('/contacts', { params: { userId, ...params } });
  return data;
}

export async function getContact(userId, id) {
  const { data } = await konnectxClient.get(`/contacts/${id}`, { params: { userId } });
  return data.data ?? data;
}

export async function saveContact(userId, body) {
  const { data } = await konnectxClient.post('/contacts', body, { params: { userId } });
  return data;
}

export async function updateContact(userId, id, body) {
  const { data } = await konnectxClient.patch(`/contacts/${id}`, body, { params: { userId } });
  return data;
}

export async function deleteContact(userId, id) {
  const { data } = await konnectxClient.delete(`/contacts/${id}`, { params: { userId } });
  return data;
}

export async function bulkDeleteContacts(userId, ids) {
  const { data } = await konnectxClient.post('/contacts/bulk-delete', { ids }, { params: { userId } });
  return data;
}

export async function bulkTagContacts(userId, ids, tag) {
  const { data } = await konnectxClient.post('/contacts/bulk-tag', { ids, tag }, { params: { userId } });
  return data;
}

export async function bulkCategoryContacts(contactIds, category) {
  const { data } = await konnectxClient.post('/contacts/bulk-category', { contactIds, category });
  return data;
}

export async function bulkGroupContacts(contactIds, groupId) {
  const { data } = await konnectxClient.post('/contacts/bulk-group', { contactIds, groupId });
  return data;
}

export async function bulkFormatContacts(ids) {
  const { data } = await konnectxClient.post('/contacts/bulk-format', { ids });
  return data;
}

export async function importContacts(userId, contactsData) {
  const { data } = await konnectxClient.post('/contacts/import', { contactsData }, { params: { userId } });
  return data;
}

export async function sendMessageToContact(userId, phone, message) {
  const { data } = await konnectxClient.post('/contacts/send-message', { phone, message }, { params: { userId } });
  return data;
}

export async function getGroups() {
  const { data } = await konnectxClient.get('/contact-groups');
  return data.data ?? data;
}

export async function saveGroup(userId, body) {
  const { data } = await konnectxClient.post('/contact-groups', body, { params: { userId } });
  return data;
}

export async function deleteGroup(id) {
  const { data } = await konnectxClient.delete(`/contact-groups/${id}`);
  return data;
}

export async function updateGroup(id, body) {
  const { data } = await konnectxClient.patch(`/contact-groups/${id}`, body);
  return data;
}

export async function getCategories(type = 'CONTACT') {
  const { data } = await konnectxClient.get('/categories', { params: { type } });
  return data.data ?? data;
}

export async function deleteCategory(id) {
  const { data } = await konnectxClient.delete(`/categories/${id}`);
  return data;
}
