import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';
import { resolveWorkspaceId } from '~/utils/workspace';

async function prepareParams(params = {}) {
  const workspaceId = params.workspaceId || (await resolveWorkspaceId());
  return { ...params, ...(workspaceId ? { workspaceId } : {}) };
}

export async function getQuotations(params = {}) {
  const resolvedParams = await prepareParams(params);
  const { data } = await api.get(apiUrls.quotation, { params: resolvedParams });
  return data;
}

export async function getQuotation(id) {
  const { data } = await api.get(`${apiUrls.quotationById}/${id}`);
  return data;
}

export async function saveQuotation(body) {
  const workspaceId = body.workspaceId || (await resolveWorkspaceId());
  const payload = { ...body, ...(workspaceId ? { workspaceId } : {}) };
  const { data } = await api.post(apiUrls.quotation, payload);
  return data;
}

export async function updateQuotation(id, body) {
  const workspaceId = body.workspaceId || (await resolveWorkspaceId());
  const payload = { ...body, ...(workspaceId ? { workspaceId } : {}) };
  const { data } = await api.put(`${apiUrls.quotationById}/${id}`, payload);
  return data;
}

export async function updateQuotationStatus(id, status) {
  return updateQuotation(id, { status });
}

export async function deleteQuotation(id) {
  const { data } = await api.delete(`${apiUrls.quotationById}/${id}`);
  return data;
}

/**
 * Calculates KPI metrics for a list of quotations
 */
export function computeQuotationMetrics(quotations = []) {
  if (!Array.isArray(quotations)) {
    return { totalCount: 0, totalValue: 0, acceptedValue: 0, sentValue: 0, draftCount: 0, acceptedCount: 0 };
  }

  const totalValue = quotations.reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0);
  const acceptedValue = quotations
    .filter((q) => (q.status || '').toLowerCase() === 'accepted')
    .reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0);
  const sentValue = quotations
    .filter((q) => (q.status || '').toLowerCase() === 'sent')
    .reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0);
  const draftCount = quotations.filter((q) => (q.status || '').toLowerCase() === 'draft').length;
  const acceptedCount = quotations.filter((q) => (q.status || '').toLowerCase() === 'accepted').length;

  return {
    totalCount: quotations.length,
    totalValue,
    acceptedValue,
    sentValue,
    draftCount,
    acceptedCount,
  };
}

/**
 * Formats a clean, high-conversion WhatsApp proposal message
 */
export function formatQuotationWhatsAppText(quotation) {
  if (!quotation) return '';
  const qData = quotation.data || {};
  const clientName = quotation.clientName || qData.client?.name || 'Client';
  const qNum = quotation.quotationNumber || 'QT-DRAFT';
  const total = (parseFloat(quotation.total) || 0).toLocaleString('en-IN');
  const currency = qData.quotation?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

  const items = Array.isArray(qData.items) ? qData.items : [];
  const itemsText = items.length > 0
    ? items.map((it, idx) => `  ${idx + 1}. *${it.name || 'Item'}* — ${it.quantity || 1}x @ ${currencySymbol}${it.unitPrice || 0}`).join('\n')
    : '  • Scope deliverables as discussed';

  const validUntil = qData.quotation?.validUntil || '30 days from issue';

  return `*Devlomatix Solutions — Commercial Proposal*\n\n` +
    `Hello *${clientName}*,\n` +
    `Here is the quotation *#${qNum}* as per our discussion:\n\n` +
    `📦 *Scope of Work:*\n${itemsText}\n\n` +
    `💰 *Grand Total:* *${currencySymbol} ${total}* (all inclusive)\n` +
    `⏱️ *Valid Until:* ${validUntil}\n\n` +
    `Please review and reply with *ACCEPT* or let us know if any adjustments are needed.\n\n` +
    `Warm regards,\n*Devlomatix Sales & Commercial Team*`;
}

