/**
 * Devlomatix CRM Design System & Color Palette
 * 
 * Edit colors in this file to customize the CRM appearance in both Light and Dark modes.
 * All CRM screens and components consume this palette.
 */
import { useAppTheme } from '~/theme/AppTheme';

export const crmColors = {
  light: {
    // Brand & Accents
    primary: '#2563eb',              // Executive Royal Blue (Cobalt) - Authoritative, crisp, professional
    primaryLight: '#2563eb',         // Royal Blue - High-contrast metrics & links
    primaryDark: '#1d4ed8',          // Deep Navy / Royal Blue 700
    primarySoft: '#eff6ff',          // Blue 50 - Fresh, airy tint
    primaryBorder: '#bfdbfe',        // Blue 200 - Crisp, clear border
    accent: '#0284c7',               // Sky 600 - Precision secondary
    accentSoft: '#f0f9ff',           // Sky 50
    accentBorder: '#bae6fd',         // Sky 200

    // Surfaces & Canvas
    background: '#f8fafc',           // Slate 50 - Clean, crisp page canvas
    card: '#ffffff',                 // Pure White - Elevated card surface
    cardAlt: '#f8fafc',              // Slate 50 - Fresh subtle contrast (replaces muddy gray)
    cardHover: '#f1f5f9',
    header: '#ffffff',
    headerBorder: '#e2e8f0',

    // Navigation & Tab Bar
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActiveBg: '#2563eb',       // Executive Royal Blue active pill (replaces black)
    tabBarActiveText: '#ffffff',
    tabBarInactive: '#64748b',       // Slate 500

    // Typography
    text: '#0f172a',                 // Slate 900 - High-contrast obsidian headings & titles
    textSecondary: '#334155',        // Slate 700 - Deep crisp body copy
    textMuted: '#64748b',            // Slate 500 - Timestamps & captions
    textSoft: '#94a3b8',             // Slate 400 - Subtle badges & placeholders
    textInverted: '#ffffff',

    // Borders & Dividers
    border: '#e2e8f0',               // Slate 200 - Clean crisp micro-borders
    borderLight: '#f1f5f9',          // Slate 100 - Inner divider lines
    divider: '#e2e8f0',

    // Input & Search Fields
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',          // Slate 300
    inputFocusBorder: '#2563eb',     // Royal Blue
    inputPlaceholder: '#94a3b8',

    // Action Channels
    whatsapp: '#16a34a',             // WhatsApp Emerald Green 600
    whatsappSoft: '#f0fdf4',
    whatsappBorder: '#bbf7d0',
    call: '#2563eb',                 // Royal Blue
    callSoft: '#eff6ff',
    callBorder: '#bfdbfe',
    copilot: '#7c3aed',              // Violet 600
    copilotSoft: '#f5f3ff',
    copilotBorder: '#ddd6fe',

    // Status Badges
    success: '#10b981',              // Emerald 500
    successSoft: '#ecfdf5',
    successBorder: '#a7f3d0',
    warning: '#f59e0b',              // Amber 500
    warningSoft: '#fffbeb',
    warningBorder: '#fde68a',
    danger: '#ef4444',               // Rose 500
    dangerSoft: '#fef2f2',
    dangerBorder: '#fecaca',
    info: '#0ea5e9',                 // Sky 500
    infoSoft: '#f0f9ff',
    infoBorder: '#bae6fd',

    // Priorities
    priority: {
      URGENT: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
      HIGH: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#f59e0b' },
      MEDIUM: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#2563eb' },
      LOW: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' },
    },

    // Task Types
    taskType: {
      CALL: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
      WHATSAPP: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
      MEETING: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
      EMAIL: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
      REVIEW: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    },

    // Metrics / KPI Cards
    kpi: {
      blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', gradient: ['#eff6ff', '#dbeafe'] },
      green: { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', gradient: ['#ecfdf5', '#d1fae5'] },
      amber: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', gradient: ['#fffbeb', '#fef3c7'] },
      purple: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', gradient: ['#f5f3ff', '#ede9fe'] },
    },

    // Sales Funnel Stage Accents
    funnel: [
      { id: 'lead', name: 'Lead', color: '#3b82f6', bg: '#eff6ff' },
      { id: 'meeting', name: 'Meeting', color: '#8b5cf6', bg: '#f5f3ff' },
      { id: 'proposal', name: 'Proposal', color: '#f59e0b', bg: '#fffbeb' },
      { id: 'negotiation', name: 'Negotiation', color: '#0284c7', bg: '#f0f9ff' },
      { id: 'won', name: 'Won', color: '#10b981', bg: '#ecfdf5' },
    ],

    // Card Elevation & Depth
    cardElevated: '#ffffff',
    cardBorderGlow: 'rgba(37, 99, 235, 0.12)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overlay: 'rgba(15, 23, 42, 0.5)',
  },

  dark: {
    // Brand & Accents
    primary: '#6366f1',              // Indigo 500 - Luminous Brand Accent
    primaryLight: '#818cf8',         // Indigo 400
    primaryDark: '#4f46e5',          // Indigo 600
    primarySoft: 'rgba(99, 102, 241, 0.16)',
    primaryBorder: 'rgba(99, 102, 241, 0.32)',
    accent: '#22d3ee',               // Cyan 400
    accentSoft: 'rgba(34, 211, 238, 0.14)',
    accentBorder: 'rgba(34, 211, 238, 0.3)',

    // Surfaces & Canvas
    background: '#090d16',           // Deep Obsidian Slate canvas
    card: '#0f172a',                 // Slate 900 - Elevated card surface
    cardAlt: '#1e293b',              // Slate 800 - Secondary surface / Pill container
    cardHover: '#1e293b',
    header: '#090d16',
    headerBorder: '#1e293b',

    // Navigation & Tab Bar
    tabBar: '#0f172a',
    tabBarBorder: '#1e293b',
    tabBarActiveBg: '#6366f1',
    tabBarActiveText: '#ffffff',
    tabBarInactive: '#64748b',       // Slate 500

    // Typography
    text: '#f8fafc',                 // Slate 50 - Pure crisp heading
    textSecondary: '#cbd5e1',        // Slate 300 - Clear body copy
    textMuted: '#94a3b8',            // Slate 400 - Subtitles & captions
    textSoft: '#64748b',             // Slate 500 - Metadata & hints
    textInverted: '#090d16',

    // Borders & Dividers
    border: '#1e293b',               // Slate 800 - Precise technical border
    borderLight: 'rgba(255, 255, 255, 0.08)',
    divider: '#1e293b',

    // Input & Search Fields
    inputBg: '#1e293b',              // Slate 800
    inputBorder: '#334155',          // Slate 700
    inputFocusBorder: '#818cf8',
    inputPlaceholder: '#64748b',

    // Action Channels
    whatsapp: '#22c55e',             // Green 500
    whatsappSoft: 'rgba(34, 197, 94, 0.15)',
    whatsappBorder: 'rgba(34, 197, 94, 0.3)',
    call: '#6366f1',
    callSoft: 'rgba(99, 102, 241, 0.15)',
    callBorder: 'rgba(99, 102, 241, 0.3)',
    copilot: '#a855f7',              // Purple 500
    copilotSoft: 'rgba(168, 85, 247, 0.15)',
    copilotBorder: 'rgba(168, 85, 247, 0.3)',

    // Status Badges
    success: '#34d399',              // Emerald 400
    successSoft: 'rgba(16, 185, 129, 0.15)',
    successBorder: 'rgba(16, 185, 129, 0.3)',
    warning: '#fbbf24',              // Amber 400
    warningSoft: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    danger: '#f87171',               // Red 400
    dangerSoft: 'rgba(239, 68, 68, 0.15)',
    dangerBorder: 'rgba(239, 68, 68, 0.3)',
    info: '#38bdf8',                 // Sky 400
    infoSoft: 'rgba(14, 165, 233, 0.15)',
    infoBorder: 'rgba(14, 165, 233, 0.3)',

    // Priorities
    priority: {
      URGENT: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171', dot: '#ef4444' },
      HIGH: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24', dot: '#f59e0b' },
      MEDIUM: { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.3)', text: '#38bdf8', dot: '#0ea5e9' },
      LOW: { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', text: '#94a3b8', dot: '#64748b' },
    },

    // Task Types
    taskType: {
      CALL: { color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.3)' },
      WHATSAPP: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
      MEETING: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' },
      EMAIL: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.3)' },
      REVIEW: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)' },
    },

    // Metrics / KPI Cards
    kpi: {
      blue: { bg: 'rgba(59, 130, 246, 0.14)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd', gradient: ['rgba(59, 130, 246, 0.18)', 'rgba(59, 130, 246, 0.06)'] },
      green: { bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7', gradient: ['rgba(16, 185, 129, 0.18)', 'rgba(16, 185, 129, 0.06)'] },
      amber: { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.3)', text: '#fde68a', gradient: ['rgba(245, 158, 11, 0.18)', 'rgba(245, 158, 11, 0.06)'] },
      purple: { bg: 'rgba(139, 92, 246, 0.14)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd', gradient: ['rgba(139, 92, 246, 0.18)', 'rgba(139, 92, 246, 0.06)'] },
    },

    // Sales Funnel Stage Accents
    funnel: [
      { id: 'lead', name: 'Lead', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
      { id: 'meeting', name: 'Meeting', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
      { id: 'proposal', name: 'Proposal', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
      { id: 'negotiation', name: 'Negotiation', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
      { id: 'won', name: 'Won', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    ],

    // Card Elevation & Depth
    cardElevated: '#111827',
    cardBorderGlow: 'rgba(99, 102, 241, 0.25)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
};

/**
 * Hook to consume CRM theme anywhere in the CRM module.
 * Returns { colors, isDark, themeMode }
 */
export function useCrmTheme() {
  const { themeMode } = useAppTheme();
  const isDark = themeMode === 'dark';
  const colors = isDark ? crmColors.dark : crmColors.light;
  return { colors, isDark, themeMode };
}

/**
 * Direct function to get colors for a given mode or boolean
 */
export function getCrmColors(modeOrIsDark) {
  const isDark = typeof modeOrIsDark === 'boolean' ? modeOrIsDark : modeOrIsDark === 'dark';
  return isDark ? crmColors.dark : crmColors.light;
}
