/**
 * Devlomatix CRM Constants
 */

export const CRM_TAG_FILTERS = ['ALL', 'LEAD', 'CLIENT', 'ENTERPRISE', 'ATS_CANDIDATE'];

export const CRM_TASK_TYPES = ['ALL', 'CALL', 'WHATSAPP', 'MEETING', 'EMAIL', 'REVIEW'];

export const CRM_STAGE_DEFAULTS = [
  { id: 'lead', name: 'Lead', color: '#3b82f6' },
  { id: 'contactMade', name: 'Contact Made', color: '#06b6d4' },
  { id: 'qualified', name: 'Qualified', color: '#8b5cf6' },
  { id: 'proposalSent', name: 'Proposal Sent', color: '#f59e0b' },
  { id: 'negotiation', name: 'Negotiation', color: '#ec4899' },
  { id: 'closedWon', name: 'Closed Won', color: '#10b981' },
  { id: 'closedLost', name: 'Closed Lost', color: '#ef4444' },
];

export const CRM_COPILOT_SUGGESTED_PROMPTS = [
  '⚡ Analyze pipeline risks & stalled deals',
  '🔥 How can I revive ghosted / dormant deals?',
  '🎯 Which top deals have the highest close momentum?',
  '✍️ Draft an irresistible WhatsApp follow-up pitch',
  '💡 How to overcome enterprise pricing objections?',
  '📊 Give me an executive revenue forecast & leaderboard summary',
];

