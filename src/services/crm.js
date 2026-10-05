import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';
import { resolveWorkspaceId } from '~/utils/workspace';

function extractData(response) {
  if (!response) return null;
  if (response.data !== undefined) return response.data;
  return response;
}

function extractPayload(response) {
  const data = extractData(response);
  if (data && typeof data === 'object' && data.data !== undefined) {
    return data.data;
  }
  return data;
}

function extractArray(response) {
  const data = extractPayload(response);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.deals)) return data.deals;
    if (Array.isArray(data.contacts)) return data.contacts;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.tasks)) return data.tasks;
    if (Array.isArray(data.activities)) return data.activities;
    if (Array.isArray(data.pipelines)) return data.pipelines;
    if (Array.isArray(data.result)) return data.result;
  }
  return [];
}

async function prepareParams(params = {}) {
  const workspaceId = params.workspaceId || (await resolveWorkspaceId());
  return { ...params, ...(workspaceId ? { workspaceId } : {}) };
}

// ==========================================
// 🎯 DEALS & COMMERCIAL BILLING
// ==========================================

export async function getDeals(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmDeals, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function getDeal(dealId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(`${apiUrls.crmDeals}/${dealId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function createDeal(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmDeals, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function updateDeal(dealId, body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.patch(`${apiUrls.crmDeals}/${dealId}`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function deleteDeal(dealId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.delete(`${apiUrls.crmDeals}/${dealId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function updateDealStage(dealId, stageId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(`${apiUrls.crmDeals}/${dealId}/stage`, { stageId }, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function generateDealQuotation(dealId, body = {}, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(`${apiUrls.crmDeals}/${dealId}/quotation`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function createDealInvoice(dealId, body = {}, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(`${apiUrls.crmDeals}/${dealId}/invoice`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 👤 CONTACTS (PEOPLE) & WHATSAPP
// ==========================================

export async function getContacts(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmContacts, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function getContact(contactId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(`${apiUrls.crmContacts}/${contactId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function createContact(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmContacts, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function updateContact(contactId, body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.patch(`${apiUrls.crmContacts}/${contactId}`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function deleteContact(contactId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.delete(`${apiUrls.crmContacts}/${contactId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function sendContactWhatsApp(contactId, body = {}, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(`${apiUrls.crmContacts}/${contactId}/whatsapp`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 🏢 ACCOUNTS (COMPANIES)
// ==========================================

export async function getAccounts(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmAccounts, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function getAccount(accountId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(`${apiUrls.crmAccounts}/${accountId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function createAccount(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmAccounts, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function updateAccount(accountId, body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.patch(`${apiUrls.crmAccounts}/${accountId}`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function deleteAccount(accountId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.delete(`${apiUrls.crmAccounts}/${accountId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 🔀 PIPELINES & STAGES
// ==========================================

export async function getPipelines(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmPipelines, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function createPipeline(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmPipelines, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 📋 TASKS & REMINDERS
// ==========================================

export async function getTasks(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmTasks, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function createTask(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmTasks, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function updateTask(taskId, body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.patch(`${apiUrls.crmTasks}/${taskId}`, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function deleteTask(taskId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.delete(`${apiUrls.crmTasks}/${taskId}`, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// ⚡ UNIVERSAL ACTIVITIES STREAM
// ==========================================

export async function getActivities(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmActivities, { params: resolvedParams });
  return { success: true, data: extractArray(res.data), raw: extractPayload(res.data) };
}

export async function createActivity(body, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmActivities, body, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 📊 FORECASTING & LEADERBOARD
// ==========================================

export async function getForecast(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmForecast, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function getLeaderboard(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.get(apiUrls.crmLeaderboard, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 📥 BULK IMPORT & WHATSAPP SYNC
// ==========================================

export async function bulkImport(rows = [], options = {}, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmBulkImport, { rows, options }, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function syncWhatsAppChats(params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmWhatsAppSync, {}, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

// ==========================================
// 🤖 FLOWGENIX AI SALES INTELLIGENCE
// ==========================================

export async function getDealHealthScore(dealId, params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmCopilotScore, { dealId }, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}

export async function askCopilotChat(message, chatHistory = [], params = {}) {
  const resolvedParams = await prepareParams(params);
  const res = await api.post(apiUrls.crmCopilotChat, { message, chatHistory }, { params: resolvedParams });
  return { success: true, data: extractPayload(res.data) };
}
