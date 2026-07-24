import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

export async function fetchAccessData() {
  const { data } = await api.get(apiUrls.accessManagement);
  return data;
}

export async function upsertUser(payload) {
  const { data } = await api.post(apiUrls.accessUser, payload);
  return data;
}

export async function deleteUser(userId) {
  const { data } = await api.delete(`${apiUrls.accessUserById}/${userId}`);
  return data;
}

export async function upsertRole(payload) {
  const { data } = await api.post(apiUrls.accessRole, payload);
  return data;
}

export async function deleteRole(roleId) {
  const { data } = await api.delete(`${apiUrls.accessRoleById}/${roleId}`);
  return data;
}

export async function upsertPermissions(actionsPayload) {
  const items = [];
  for (const item of actionsPayload) {
    const { category, module: mod, color, actions } = item;
    for (const [action, status] of Object.entries(actions)) {
      items.push({
        value: `${category}.${action}`,
        title: mod || category,
        category,
        color: color || '#FFFF',
        status: status ?? true,
      });
    }
  }

  const { data } = await api.post(apiUrls.accessPermission, { items });
  return data;
}

export async function deletePermission(permissionId) {
  const { data } = await api.delete(`${apiUrls.accessPermissionById}/${permissionId}`);
  return data;
}
