import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';
import { resolveWorkspaceId } from '~/utils/workspace';

async function prepareParams(params = {}) {
  const workspaceId = params.workspaceId || (await resolveWorkspaceId());
  return { ...params, ...(workspaceId ? { workspaceId } : {}) };
}

/**
 * Fetch paginated email threads with folder counts
 */
export async function getMailboxThreads(params = {}) {
  try {
    const mailboxEmail =
      typeof params.mailboxEmail === 'string' && params.mailboxEmail.trim()
        ? params.mailboxEmail.trim()
        : 'ALL';
    const resolvedParams = await prepareParams({ ...params, mailboxEmail });
    const res = await api.get(apiUrls.crmMailbox, { params: resolvedParams });
    const payload = res.data;
    return {
      success: true,
      data: payload?.data || [],
      counts: payload?.counts || { unread: 0, inbox: 0, starred: 0, sent: 0, archive: 0, trash: 0 },
      pagination: payload?.pagination || { page: 1, limit: 30, total: 0, totalPages: 1 },
      mailboxes: payload?.mailboxes || [],
    };
  } catch (error) {
    console.warn('[MAILBOX_FETCH_WARN]', error?.response?.data || error?.message);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to fetch mailbox threads',
      data: [],
      counts: { unread: 0, inbox: 0, starred: 0, sent: 0, archive: 0, trash: 0 },
      mailboxes: [],
    };
  }
}

/**
 * Fetch full thread conversation detail with all messages and mark as read
 */
export async function getMailboxThreadDetail(threadId, params = {}) {
  if (!threadId) return { success: false, error: 'threadId is required' };
  try {
    const resolvedParams = await prepareParams(params);
    const res = await api.get(`${apiUrls.crmMailbox}/${threadId}`, { params: resolvedParams });
    return {
      success: true,
      data: res.data?.data || null,
    };
  } catch (error) {
    console.warn('[MAILBOX_DETAIL_WARN]', error?.response?.data || error?.message);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to load email thread',
      data: null,
    };
  }
}

/**
 * Send an email message via Resend
 */
export async function sendMailboxEmail(body = {}, params = {}) {
  try {
    const workspaceId = body.workspaceId || params.workspaceId || (await resolveWorkspaceId());
    const payload = { ...body, workspaceId };
    const res = await api.post(apiUrls.crmMailboxSend, payload);
    return {
      success: true,
      data: res.data?.data || null,
    };
  } catch (error) {
    console.warn('[MAILBOX_SEND_WARN]', error?.response?.data || error?.message);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to send email',
    };
  }
}

/**
 * Update thread status (star/unstar, move folder)
 */
export async function updateMailboxThread(threadId, actionPayload = {}, params = {}) {
  if (!threadId) return { success: false, error: 'threadId is required' };
  try {
    const workspaceId = actionPayload.workspaceId || params.workspaceId || (await resolveWorkspaceId());
    const payload = { ...actionPayload, workspaceId };
    const res = await api.patch(`${apiUrls.crmMailbox}/${threadId}`, payload);
    return {
      success: true,
      data: res.data?.data || null,
    };
  } catch (error) {
    console.warn('[MAILBOX_UPDATE_WARN]', error?.response?.data || error?.message);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to update thread',
    };
  }
}

/**
 * Delete a thread (moves to TRASH, or permanently deletes if already in TRASH)
 */
export async function deleteMailboxThread(threadId, params = {}) {
  if (!threadId) return { success: false, error: 'threadId is required' };
  try {
    const resolvedParams = await prepareParams(params);
    const res = await api.delete(`${apiUrls.crmMailbox}/${threadId}`, { params: resolvedParams });
    return {
      success: true,
      data: res.data?.data || null,
    };
  } catch (error) {
    console.warn('[MAILBOX_DELETE_WARN]', error?.response?.data || error?.message);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to delete thread',
    };
  }
}
