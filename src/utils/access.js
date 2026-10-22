/**
 * Devlomatix Mobile Access Control & RBAC Registry
 * Defines all modules, sub-components, roles, and permissions across the Devlomatix Mobile & Web Suite.
 *
 * Location: src/utils/access.js
 */

import {
  normalizeIdentifier,
  isSuperAdmin as checkSuperAdmin,
  isAdmin as checkAdmin,
  matchPermission,
  extractUserPermissions,
  extractUserRoles,
  canAccessModule as checkCanAccessModule,
} from './rbac';

/**
 * -----------------------------------------------------------------------------
 * 1. GRANULAR PERMISSION CONSTANTS
 * Single source of truth for all module & action permission strings.
 * -----------------------------------------------------------------------------
 */
export const PERMISSIONS = Object.freeze({
  // Global & System Permissions
  GLOBAL: {
    ALL: '*',
    ALL_WILDCARD: '*:*',
    ADMIN_PANEL: 'navbar:System:Parent',
    SHARED_PREF: 'system:sharedpref',
  },

  // 1. DevX CRM Suite
  CRM: {
    MODULE: 'navbar:DevX(CRM):Parent',
    MODULE_ALT: 'navbar:crm:Parent',
    DASHBOARD: 'navbar:DevX(CRM):Dashboard',
    // Deals & Pipelines
    DEALS_VIEW: 'read:deal',
    DEALS_CREATE: 'create:deal',
    DEALS_EDIT: 'update:deal',
    DEALS_DELETE: 'delete:deal',
    PIPELINE_VIEW: 'navbar:DevX(CRM):PipelinesDeals',
    // Contacts & Leads
    CONTACTS_VIEW: 'read:contact',
    CONTACTS_CREATE: 'create:contact',
    CONTACTS_EDIT: 'update:contact',
    CONTACTS_DELETE: 'delete:contact',
    // Daily Call Records (DCR)
    DCR_VIEW: 'read:dcr',
    DCR_CREATE: 'create:dcr',
    DCR_EDIT: 'update:dcr',
    DCR_DELETE: 'delete:dcr',
    // Mailbox & Messaging
    MAILBOX_VIEW: 'read:mailbox',
    MAILBOX_SEND: 'create:mailbox',
    MAILBOX_DELETE: 'delete:mailbox',
    CHAT_VIEW: 'read:chat',
    CALLS_EXECUTE: 'create:call',
    // Tools & Quotations
    COPILOT: 'read:copilot',
    QUOTATIONS_VIEW: 'read:quotation',
    QUOTATIONS_CREATE: 'create:quotation',
    QUOTATIONS_DELETE: 'delete:quotation',
    TASKS_VIEW: 'read:task',
    TASKS_CREATE: 'create:task',
    TASKS_EDIT: 'update:task',
    TASKS_DELETE: 'delete:task',
    // Analytics & Settings
    ANALYTICS: 'read:crm-analytics',
    SETTINGS: 'manage:crm-settings',
  },

  // 2. KonnectX (WhatsApp Cloud API & Campaigns)
  KONNECTX: {
    MODULE: 'navbar:KonnectX:Parent',
    CHATS_VIEW: 'read:konnectx-chats',
    CHATS_SEND: 'create:konnectx-chats',
    CONTACTS_VIEW: 'read:konnectx-contacts',
    CONTACTS_MANAGE: 'manage:konnectx-contacts',
    CAMPAIGNS_VIEW: 'read:campaign',
    CAMPAIGNS_CREATE: 'create:campaign',
    CAMPAIGNS_EDIT: 'update:campaign',
    CAMPAIGNS_DELETE: 'delete:campaign',
    TEMPLATES_VIEW: 'read:template',
    TEMPLATES_CREATE: 'create:template',
    TEMPLATES_DELETE: 'delete:template',
    FLOWS_VIEW: 'read:flow',
    FLOWS_MANAGE: 'manage:flow',
    CHATBOT_VIEW: 'read:chatbot',
    CHATBOT_MANAGE: 'manage:chatbot',
    CATALOG_VIEW: 'read:catalog',
    CATALOG_MANAGE: 'manage:catalog',
    REPORTS: 'read:konnectx-reports',
    ANALYTICS: 'read:konnectx-analytics',
    SYSTEM: 'manage:konnectx-system',
  },

  // 3. HireFlow (ATS & Candidate Tracking)
  HIREFLOW: {
    MODULE: 'navbar:HireFlow:Parent',
    MODULE_ALT: 'navbar:ATS:Parent',
    JOBS_VIEW: 'read:jobs',
    JOBS_CREATE: 'create:jobs',
    JOBS_EDIT: 'update:jobs',
    JOBS_DELETE: 'delete:jobs',
    CANDIDATES_VIEW: 'read:candidates',
    CANDIDATES_MANAGE: 'manage:candidates',
    PIPELINE_VIEW: 'read:ats-pipeline',
    DEPARTMENTS_VIEW: 'read:departments',
    ANALYTICS: 'read:ats-analytics',
  },

  // 4. CrystalAura (E-Commerce Store & Order Suite)
  CRYSTALAURA: {
    MODULE: 'navbar:eCommerce:Parent',
    PRODUCTS_VIEW: 'read:products',
    PRODUCTS_MANAGE: 'manage:products',
    ORDERS_VIEW: 'read:orders',
    ORDERS_MANAGE: 'manage:orders',
    CATEGORIES_VIEW: 'read:categories',
    CUSTOMERS_VIEW: 'read:clients',
    COUPONS_MANAGE: 'manage:coupons',
    ANALYTICS: 'read:ecommerce-analytics',
  },

  // 5. Curexa (Hospital & Healthcare Intelligence)
  CUREXA: {
    MODULE: 'navbar:Curexa:Parent',
    PATIENTS_VIEW: 'read:patients',
    PATIENTS_MANAGE: 'manage:patients',
    APPOINTMENTS_VIEW: 'read:appointments',
    APPOINTMENTS_MANAGE: 'manage:appointments',
    DOCTORS_VIEW: 'read:doctors',
    RECORDS_VIEW: 'read:records',
    DEPARTMENTS_VIEW: 'read:curexa-departments',
  },

  // 6. SolarBright (Solar Operations & Cleaning)
  SOLARBRIGHT: {
    MODULE: 'navbar:SolarBright:Parent',
    SITES_VIEW: 'read:solar-sites',
    AUDITS_VIEW: 'read:solar-audits',
    MAINTENANCE_MANAGE: 'manage:solar-maintenance',
    ENERGY_EXPLORER: 'read:energy-explorer',
  },

  // 7. KabadX (Doorstep Scrap & Eco Recycling)
  KABADX: {
    MODULE: 'navbar:KabadX:Parent',
    PICKUPS_VIEW: 'read:pickups',
    PICKUPS_MANAGE: 'manage:pickups',
    RATES_VIEW: 'read:scrap-rates',
    COLLECTORS_MANAGE: 'manage:collectors',
    ANALYTICS: 'read:kabadx-analytics',
  },

  // 8. Access Management & Security
  ACCESS_MANAGEMENT: {
    MODULE: 'navbar:System:Parent',
    USERS_VIEW: 'read:users',
    USERS_MANAGE: 'manage:users',
    ROLES_VIEW: 'read:roles',
    ROLES_MANAGE: 'manage:roles',
    PERMISSIONS_VIEW: 'read:permissions',
    PERMISSIONS_MANAGE: 'manage:permissions',
  },

  // 9. Ecosystem Bridges
  BRIDGES: {
    PAYFLOW: 'navbar:PayFlow:Parent',
    FLOWGENIX: 'navbar:FlowGenix:Parent',
    HIREFLOW: 'navbar:HireFlow:Parent',
    KONNECTX: 'navbar:KonnectX:Parent',
  },
});

/**
 * -----------------------------------------------------------------------------
 * 2. SYSTEM ROLES REGISTRY
 * Standard roles available across the organization and workspace hierarchy.
 * -----------------------------------------------------------------------------
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: {
    id: 'superadmin',
    name: 'Super Admin',
    title: 'Super Admin',
    slug: 'super-admin',
    description: 'Complete unrestricted access across all suites, modules, tokens, and settings.',
    color: '#6366f1',
    isSuper: true,
    permissions: ['*'],
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    title: 'Admin',
    slug: 'admin',
    description: 'System administrator with permission management and user configuration.',
    color: '#0ea5e9',
    isAdmin: true,
    permissions: [
      'navbar:System:Parent',
      'manage:users',
      'manage:roles',
      'manage:permissions',
      'crm.*',
      'konnectx.*',
      'hireflow.*',
    ],
  },
  WORKSPACE: {
    id: 'workspace',
    name: 'Workspace',
    title: 'Workspace',
    slug: 'workspace',
    description: 'Workspace member with access to standard collaborative modules.',
    color: '#0d9488',
    permissions: [
      'navbar:workspace:Parent',
      'navbar:Workspace:Parent',
      'navbar:DevX(CRM):Parent',
      'navbar:KonnectX:Parent',
    ],
  },
  KONNECTX: {
    id: 'konnectx',
    name: 'KonnectX',
    title: 'KonnectX',
    slug: 'konnectx',
    description: 'KonnectX WhatsApp suite member.',
    color: '#0d9488',
    permissions: [
      'navbar:KonnectX:Parent',
      'read:konnectx-chats',
      'create:konnectx-chats',
      'read:konnectx-contacts',
    ],
  },
  SALES_MANAGER: {
    id: 'sales_manager',
    name: 'Sales Manager',
    title: 'Sales Manager',
    slug: 'sales-manager',
    description: 'Oversees team deals, pipelines, call logs, field activities and sales targets.',
    color: '#f59e0b',
    permissions: [
      'navbar:DevX(CRM):Parent',
      'read:deal',
      'create:deal',
      'update:deal',
      'delete:deal',
      'read:contact',
      'create:contact',
      'update:contact',
      'read:dcr',
      'create:dcr',
      'update:dcr',
      'read:crm-analytics',
      'read:mailbox',
      'create:mailbox',
    ],
  },
  DEVX_CRM: {
    id: 'devxcrm',
    name: 'DevX(CRM)',
    title: 'DevX(CRM)',
    slug: 'devxcrm',
    aliases: ['devxcrm', 'devx-crm', 'DevX(CRM)', 'Devx(CRM)', 'Sales Rep'],
    description: 'Creates deals, contacts, logs daily calls and communicates with leads.',
    color: '#10b981',
    permissions: [
      'navbar:DevX(CRM):Parent',
      'read:deal',
      'create:deal',
      'update:deal',
      'read:contact',
      'create:contact',
      'update:contact',
      'read:dcr',
      'create:dcr',
      'read:mailbox',
      'create:mailbox',
    ],
  },
  KONNECTX_ADMIN: {
    id: 'konnectx_admin',
    name: 'KonnectX Admin',
    title: 'KonnectX Admin',
    slug: 'konnectx-admin',
    description: 'Full management of WhatsApp Cloud campaigns, templates, chatbots and flows.',
    color: '#16a34a',
    permissions: [
      'navbar:KonnectX:Parent',
      'read:campaign',
      'create:campaign',
      'update:campaign',
      'delete:campaign',
      'read:template',
      'create:template',
      'read:flow',
      'manage:flow',
      'read:chatbot',
      'manage:chatbot',
      'read:catalog',
    ],
  },
  HR_MANAGER: {
    id: 'hr_manager',
    name: 'HR Manager',
    title: 'HR Manager',
    slug: 'hr-manager',
    description: 'Manages candidate recruiting, open positions, pipeline stages, and hiring.',
    color: '#4f46e5',
    permissions: [
      'navbar:HireFlow:Parent',
      'read:jobs',
      'create:jobs',
      'read:candidates',
      'manage:candidates',
      'read:ats-pipeline',
      'read:ats-analytics',
    ],
  },
  ECOMMERCE_MANAGER: {
    id: 'ecommerce_manager',
    name: 'E-Commerce Manager',
    title: 'E-Commerce Manager',
    slug: 'ecommerce-manager',
    aliases: ['ecommerce-manager', 'Store Manager', 'eCommerce', 'ecommerce'],
    description: 'Manages online store products, customer orders, coupons and catalog.',
    color: '#9333ea',
    permissions: [
      'navbar:eCommerce:Parent',
      'read:products',
      'manage:products',
      'read:orders',
      'manage:orders',
      'read:clients',
    ],
  },
  HEALTHCARE_ADMIN: {
    id: 'healthcare_admin',
    name: 'Healthcare Admin',
    title: 'Healthcare Admin',
    slug: 'healthcare-admin',
    description: 'Manages patient admissions, appointments, doctors and medical records.',
    color: '#059669',
    permissions: [
      'navbar:Curexa:Parent',
      'read:patients',
      'manage:patients',
      'read:appointments',
      'manage:appointments',
      'read:doctors',
    ],
  },
  SOLAR_OPERATOR: {
    id: 'solar_operator',
    name: 'Solar Operator',
    title: 'Solar Operator',
    slug: 'solar-operator',
    description: 'Oversees site audits, panel maintenance schedules, and energy exploration.',
    color: '#d97706',
    permissions: [
      'navbar:SolarBright:Parent',
      'read:solar-sites',
      'read:solar-audits',
      'manage:solar-maintenance',
    ],
  },
  RECYCLING_AGENT: {
    id: 'recycling_agent',
    name: 'Recycling Agent',
    title: 'Recycling Agent',
    slug: 'recycling-agent',
    description: 'Doorstep pickup coordinator, scrap material pricing and collector assigner.',
    color: '#0d9488',
    permissions: [
      'navbar:KabadX:Parent',
      'read:pickups',
      'manage:pickups',
      'read:scrap-rates',
      'manage:collectors',
    ],
  },
});

/**
 * -----------------------------------------------------------------------------
 * 3. MODULES REGISTRY
 * Complete catalog of all suites, modules, navigation links, and sub-components.
 * -----------------------------------------------------------------------------
 */
export const MODULE_REGISTRY = Object.freeze({
  crm: {
    id: 'crm',
    name: 'DevX (CRM)',
    aliases: ['crm', 'devxcrm', 'devx(crm)', 'DevX(CRM)', 'CRM'],
    tagline: 'Lead Pipelines, Deals & Field Sales Suite',
    badge: 'Sales & Deals',
    route: '/(modules)/crm/(tabs)',
    icon: 'briefcase-outline',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    primaryPermission: 'navbar:DevX(CRM):Parent',
    allowedRoles: ['Super Admin', 'Admin', 'Sales Manager', 'DevX(CRM)', 'Devx(CRM)', 'devxcrm', 'Workspace'],
    components: {
      dashboard: { permission: 'navbar:DevX(CRM):Dashboard' },
      pipeline: { permission: 'read:deal', route: '/(modules)/crm/(tabs)/pipeline' },
      contacts: { permission: 'read:contact', route: '/(modules)/crm/(tabs)/contacts' },
      dcr: { permission: 'read:dcr', route: '/(modules)/crm/dcr' },
      mailbox: { permission: 'read:mailbox', route: '/(modules)/crm/mailbox' },
      chat: { permission: 'read:chat', route: '/(modules)/crm/chat' },
      copilot: { permission: 'read:copilot', route: '/(modules)/crm/copilot' },
      quotations: { permission: 'read:quotation', route: '/(misc)/quotation' },
      tasks: { permission: 'read:task', route: '/(modules)/crm/tasks' },
      analytics: { permission: 'read:crm-analytics', route: '/(modules)/crm/analytics' },
      settings: { permission: 'manage:crm-settings', route: '/(modules)/crm/settings' },
      deleteDeal: { permission: 'delete:deal' },
      deleteContact: { permission: 'delete:contact' },
      deleteDcr: { permission: 'delete:dcr' },
      deleteMailbox: { permission: 'delete:mailbox' },
    },
  },

  konnectx: {
    id: 'konnectx',
    name: 'KonnectX',
    aliases: ['konnectx', 'KonnectX', 'konnect', 'Konnect'],
    tagline: 'WhatsApp Cloud API & Campaigns',
    badge: 'WhatsApp',
    route: '/(modules)/konnectx',
    icon: 'logo-whatsapp',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
    primaryPermission: 'navbar:KonnectX:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'KonnectX Admin', 'KonnectX', 'konnectx', 'Workspace'],
    components: {
      chats: { permission: 'read:konnectx-chats' },
      contacts: { permission: 'read:konnectx-contacts' },
      campaigns: { permission: 'read:campaign' },
      templates: { permission: 'read:template' },
      flows: { permission: 'read:flow' },
      chatbot: { permission: 'read:chatbot' },
      catalog: { permission: 'read:catalog' },
      analytics: { permission: 'read:konnectx-analytics' },
      system: { permission: 'manage:konnectx-system' },
    },
  },

  hireflow: {
    id: 'hireflow',
    name: 'HireFlow (ATS)',
    aliases: ['hireflow', 'HireFlow', 'ats', 'ATS'],
    tagline: 'Recruitment & Candidate Tracking',
    badge: 'Recruiting',
    route: '/(modules)/hireflow',
    icon: 'briefcase-outline',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.12)',
    primaryPermission: 'navbar:HireFlow:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'HR Manager', 'HireFlow', 'Workspace'],
    components: {
      jobs: { permission: 'read:jobs' },
      candidates: { permission: 'read:candidates' },
      pipeline: { permission: 'read:ats-pipeline' },
      departments: { permission: 'read:departments' },
      analytics: { permission: 'read:ats-analytics' },
    },
  },

  crystalaura: {
    id: 'crystalaura',
    name: 'CrystalAura',
    aliases: ['crystalaura', 'CrystalAura', 'ecommerce', 'eCommerce'],
    tagline: 'E-Commerce Store & Order Suite',
    badge: 'E-Commerce',
    route: '/(modules)/crystalaura',
    icon: 'storefront-outline',
    color: '#9333ea',
    bg: 'rgba(147, 51, 234, 0.12)',
    primaryPermission: 'navbar:eCommerce:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'E-Commerce Manager', 'Store Manager', 'CrystalAura', 'eCommerce', 'ecommerce', 'Workspace'],
    components: {
      products: { permission: 'read:products' },
      orders: { permission: 'read:orders' },
      categories: { permission: 'read:categories' },
      clients: { permission: 'read:clients' },
    },
  },

  curexa: {
    id: 'curexa',
    name: 'Curexa',
    aliases: ['curexa', 'Curexa'],
    tagline: 'Hospital & Healthcare Intelligence',
    badge: 'Healthcare',
    route: '/(modules)/curexa',
    icon: 'medkit-outline',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    primaryPermission: 'navbar:Curexa:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'Healthcare Admin', 'Curexa'],
    components: {
      patients: { permission: 'read:patients' },
      appointments: { permission: 'read:appointments' },
      doctors: { permission: 'read:doctors' },
      records: { permission: 'read:records' },
    },
  },

  solarbright: {
    id: 'solarbright',
    name: 'SolarBright',
    aliases: ['solarbright', 'SolarBright'],
    tagline: 'Solar Panel Cleaning & Maintenance',
    badge: 'Solar Energy',
    route: '/(modules)/solarbright',
    icon: 'sunny-outline',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    primaryPermission: 'navbar:SolarBright:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'Solar Operator', 'SolarBright'],
    components: {
      sites: { permission: 'read:solar-sites' },
      audits: { permission: 'read:solar-audits' },
      maintenance: { permission: 'manage:solar-maintenance' },
      energyExplorer: { permission: 'read:energy-explorer' },
    },
  },

  kabadx: {
    id: 'kabadx',
    name: 'KabadX',
    aliases: ['kabadx', 'KabadX'],
    tagline: 'Doorstep Scrap & Eco Recycling',
    badge: 'Recycling',
    route: '/(modules)/kabadx',
    icon: 'leaf-outline',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.12)',
    primaryPermission: 'navbar:KabadX:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'Recycling Agent', 'KabadX'],
    components: {
      pickups: { permission: 'read:pickups' },
      rates: { permission: 'read:scrap-rates' },
      collectors: { permission: 'manage:collectors' },
      analytics: { permission: 'read:kabadx-analytics' },
    },
  },

  accessManagement: {
    id: 'access-management',
    name: 'Access Management',
    aliases: ['access-management', 'access_management', 'access', 'system'],
    tagline: 'Role-Based Access Control & Security Policies',
    badge: 'Security',
    route: '/(modules)/access-management',
    icon: 'shield-checkmark-outline',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.12)',
    primaryPermission: 'navbar:System:Parent',
    allowedRoles: ['Super Admin', 'Admin'],
    requireAdmin: true,
    components: {
      users: { permission: 'manage:users' },
      roles: { permission: 'manage:roles' },
      permissions: { permission: 'manage:permissions' },
    },
  },

  sharedpref: {
    id: 'sharedpref',
    name: 'Shared Preferences',
    aliases: ['sharedpref', 'shared_preferences', 'sharedpreferences'],
    tagline: 'Device storage cache, credentials & tokens',
    badge: 'Super Admin',
    route: '/(misc)/sharedpref',
    icon: 'file-tray-full-outline',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    primaryPermission: 'system:sharedpref',
    allowedRoles: ['Super Admin'],
    requireSuperAdmin: true,
  },

  payflow: {
    id: 'payflow',
    name: 'PayFlow Billing Bridge',
    aliases: ['payflow', 'PayFlow'],
    tagline: '1-Click Invoice & Quotations Bridge',
    badge: 'Billing',
    primaryPermission: 'navbar:PayFlow:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'PayFlow'],
  },

  flowgenix: {
    id: 'flowgenix',
    name: 'FlowGenix AI Agent',
    aliases: ['flowgenix', 'FlowGenix'],
    tagline: 'Sales Intelligence & Health Scoring',
    badge: 'AI Intelligence',
    primaryPermission: 'navbar:FlowGenix:Parent',
    allowedRoles: ['Super Admin', 'Admin', 'FlowGenix'],
  },
});

/**
 * -----------------------------------------------------------------------------
 * 4. COMPONENT-LEVEL ACCESS MAP
 * Directly check access for specific interactive widgets, buttons, and views.
 * -----------------------------------------------------------------------------
 */
export const COMPONENT_ACCESS_MAP = Object.freeze({
  // Global & Admin Components
  AccessManagementScreen: { requireAdmin: true },
  SharedPrefCard: { requireSuperAdmin: true },
  SharedPrefScreen: { requireSuperAdmin: true },

  // CRM Components
  DealDeleteButton: { permission: PERMISSIONS.CRM.DEALS_DELETE },
  ContactDeleteButton: { permission: PERMISSIONS.CRM.CONTACTS_DELETE },
  DcrDeleteButton: { permission: PERMISSIONS.CRM.DCR_DELETE },
  MailboxDeleteButton: { permission: PERMISSIONS.CRM.MAILBOX_DELETE },
  TaskDeleteButton: { permission: PERMISSIONS.CRM.TASKS_DELETE },
  QuotationDeleteButton: { permission: PERMISSIONS.CRM.QUOTATIONS_DELETE },
  WhatsAppSyncButton: { module: 'konnectx', permission: PERMISSIONS.KONNECTX.MODULE },
  DcrCard: { module: 'crm', permission: PERMISSIONS.CRM.DCR_VIEW },
  CrmHierarchyFilter: { module: 'crm' },

  // Bridge Components
  PayFlowBridge: { module: 'payflow', permission: PERMISSIONS.BRIDGES.PAYFLOW },
  FlowGenixBridge: { module: 'flowgenix', permission: PERMISSIONS.BRIDGES.FLOWGENIX },
  HireflowBridge: { module: 'hireflow', permission: PERMISSIONS.BRIDGES.HIREFLOW },

  // KonnectX Components
  CampaignCreateButton: { module: 'konnectx', permission: PERMISSIONS.KONNECTX.CAMPAIGNS_CREATE },
  CampaignDeleteButton: { module: 'konnectx', permission: PERMISSIONS.KONNECTX.CAMPAIGNS_DELETE },
  TemplateCreateButton: { module: 'konnectx', permission: PERMISSIONS.KONNECTX.TEMPLATES_CREATE },
  ChatbotEditor: { module: 'konnectx', permission: PERMISSIONS.KONNECTX.CHATBOT_MANAGE },
});

/**
 * -----------------------------------------------------------------------------
 * 5. COMPONENT & MODULE ACCESS EVALUATION API
 * Pure functions to manage access cleanly in any React component or hook.
 * -----------------------------------------------------------------------------
 */

/**
 * Checks whether a user can access a specific named component or permission rule.
 *
 * @param {string|object} componentKeyOrRule - Key from COMPONENT_ACCESS_MAP or custom rule object
 * @param {object|null} userOrContext - User object from authStorage OR context from usePermissions()
 * @returns {boolean}
 */
export function canAccessComponent(componentKeyOrRule, userOrContext) {
  if (!userOrContext) return false;

  // Resolve user and permissions from context or user object
  const isSuper = userOrContext.isSuperAdmin !== undefined
    ? userOrContext.isSuperAdmin
    : checkSuperAdmin(userOrContext);

  if (isSuper) return true;

  const isAdmin = userOrContext.isAdmin !== undefined
    ? userOrContext.isAdmin
    : checkAdmin(userOrContext);

  const permissions = Array.isArray(userOrContext.permissions)
    ? userOrContext.permissions
    : extractUserPermissions(userOrContext);

  const roles = Array.isArray(userOrContext.roles)
    ? userOrContext.roles
    : extractUserRoles(userOrContext);

  // Resolve rule
  let rule = null;
  if (typeof componentKeyOrRule === 'string') {
    rule = COMPONENT_ACCESS_MAP[componentKeyOrRule];
    if (!rule) {
      // Treat string as direct permission check
      rule = { permission: componentKeyOrRule };
    }
  } else if (typeof componentKeyOrRule === 'object' && componentKeyOrRule !== null) {
    rule = componentKeyOrRule;
  }

  if (!rule) return true;

  // 1. Super Admin requirement
  if (rule.requireSuperAdmin && !isSuper) {
    return false;
  }

  // 2. Admin requirement
  if (rule.requireAdmin && !isAdmin && !isSuper) {
    return false;
  }

  // 3. Module accessibility requirement
  if (rule.module) {
    const rawUser = userOrContext.user || userOrContext;
    if (!checkCanAccessModule(rule.module, rawUser)) {
      return false;
    }
  }

  // 4. Specific role requirement
  if (rule.roles && Array.isArray(rule.roles) && rule.roles.length > 0) {
    const normRoles = rule.roles.map(normalizeIdentifier);
    const hasRole = roles.some((r) => normRoles.includes(normalizeIdentifier(r)));
    if (!hasRole && !isAdmin) {
      return false;
    }
  }

  // 5. Specific permission requirement
  if (rule.permission) {
    return matchPermission(permissions, rule.permission);
  }

  return true;
}

/**
 * Checks whether a user can access an entire high-level module.
 *
 * @param {string} moduleIdOrName - e.g. 'crm', 'konnectx', 'hireflow'
 * @param {object|null} userOrContext
 * @returns {boolean}
 */
export function canAccessModuleByRegistry(moduleIdOrName, userOrContext) {
  if (!userOrContext) return false;

  const isSuper = userOrContext.isSuperAdmin !== undefined
    ? userOrContext.isSuperAdmin
    : checkSuperAdmin(userOrContext);

  if (isSuper) return true;

  const rawUser = userOrContext.user || userOrContext;
  const modMeta = getModuleMetadata(moduleIdOrName);

  if (modMeta?.requireSuperAdmin) {
    return isSuper;
  }

  if (modMeta?.requireAdmin) {
    const isAdmin = userOrContext.isAdmin !== undefined
      ? userOrContext.isAdmin
      : checkAdmin(userOrContext);
    return isAdmin || isSuper;
  }

  // Check aliases and module identifiers against RBAC engine
  const candidates = modMeta
    ? [modMeta.id, modMeta.name, ...(modMeta.aliases || []), modMeta.primaryPermission]
    : [moduleIdOrName];

  for (const candidate of candidates) {
    if (candidate && checkCanAccessModule(candidate, rawUser)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns module metadata by ID or name from MODULE_REGISTRY.
 *
 * @param {string} moduleIdOrName
 * @returns {object|null}
 */
export function getModuleMetadata(moduleIdOrName) {
  if (!moduleIdOrName) return null;
  const norm = normalizeIdentifier(moduleIdOrName);

  for (const mod of Object.values(MODULE_REGISTRY)) {
    if (normalizeIdentifier(mod.id) === norm || normalizeIdentifier(mod.name) === norm) {
      return mod;
    }
    if (mod.aliases?.some((alias) => normalizeIdentifier(alias) === norm)) {
      return mod;
    }
  }

  return null;
}

/**
 * Returns all registered modules as an array.
 *
 * @returns {Array<object>}
 */
export function getAllModules() {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Returns all registered system roles as an array.
 *
 * @returns {Array<object>}
 */
export function getAllRoles() {
  return Object.values(ROLES);
}

export default {
  PERMISSIONS,
  ROLES,
  MODULE_REGISTRY,
  COMPONENT_ACCESS_MAP,
  canAccessComponent,
  canAccessModuleByRegistry,
  getModuleMetadata,
  getAllModules,
  getAllRoles,
};
