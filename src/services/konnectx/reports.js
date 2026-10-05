import konnectxClient from './client';

export const REPORT_TYPES = ['messages', 'campaigns', 'templates', 'contacts'];

export async function getReports(userId, params = {}) {
  const { data } = await konnectxClient.get('/reports', {
    params: { userId, ...params }
  });
  return data.data ?? data;
}

export async function getReportMessages(userId, params = {}) {
  return getReports(userId, { ...params, reportType: 'messages' });
}

export async function getReportCampaigns(userId, params = {}) {
  return getReports(userId, { ...params, reportType: 'campaigns' });
}

export async function getReportTemplates(userId, params = {}) {
  return getReports(userId, { ...params, reportType: 'templates' });
}

export async function getReportContacts(userId, params = {}) {
  return getReports(userId, { ...params, reportType: 'contacts' });
}