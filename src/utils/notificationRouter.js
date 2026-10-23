const MODULE_META = {
  crm: { module: 'crm', icon: 'briefcase', color: '#0284c7' },
  konnectx: { module: 'konnectx', icon: 'chatbubble-ellipses', color: '#0284c7' },
  curexa: { module: 'curexa', icon: 'medkit', color: '#059669' },
  crystalaura: { module: 'crystalaura', icon: 'storefront', color: '#9333ea' },
  solarbright: { module: 'solarbright', icon: 'sunny', color: '#d97706' },
  hireflow: { module: 'hireflow', icon: 'briefcase', color: '#4f46e5' },
  kabadx: { module: 'kabadx', icon: 'leaf', color: '#0d9488' },
};

export function resolveNotificationRoute(data = {}) {
  if (!data || typeof data !== 'object') return null;

  const type = String(data.type || data.notificationType || data.kind || '').toLowerCase();

  switch (type) {
    case 'incoming_call':
    case 'call':
      return null;
    case 'crm_email':
    case 'email':
    case 'mail':
      return data.threadId ? `/mailbox/${data.threadId}` : '/mailbox';
    case 'deal':
    case 'crm_deal':
      return data.dealId ? `/deals/${data.dealId}` : '/pipeline';
    case 'contact':
    case 'crm_contact':
    case 'lead':
      return data.contactId ? `/contacts/${data.contactId}` : '/contacts';
    case 'account':
    case 'crm_account':
      return data.accountId ? `/accounts/${data.accountId}` : '/accounts';
    case 'task':
    case 'crm_task':
    case 'reminder':
      return '/tasks';
    case 'quotation':
      return data.quotationId ? `/quotations/${data.quotationId}` : '/quotations';
    case 'candidate':
    case 'hireflow_candidate':
      return data.candidateId ? `/candidates/${data.candidateId}` : '/candidates';
    case 'chat':
    case 'message':
    case 'konnectx_message':
      return data.chatId ? `/chat/${data.chatId}` : '/chat';
    default:
      break;
  }

  if (typeof data.route === 'string' && data.route.startsWith('/')) return data.route;
  if (typeof data.link === 'string' && data.link.startsWith('/')) return data.link;
  return null;
}

export function handleNotificationData(data, router, fallback = '/(misc)/notifications') {
  if (!router) return false;
  const route = resolveNotificationRoute(data) || fallback;
  if (!route) return false;
  try {
    router.push(route);
    return true;
  } catch (_) {
    return false;
  }
}

export function notificationEntryFromRemote(remoteMessage = {}) {
  const data = remoteMessage.data || {};
  const content = remoteMessage.notification || {};
  const type = String(data.type || '').toLowerCase();
  const meta =
    MODULE_META[String(data.module || '').toLowerCase()] ||
    (type.includes('email')
      ? MODULE_META.crm
      : type.includes('deal') || type.includes('contact')
      ? MODULE_META.crm
      : MODULE_META.crm);

  return {
    module: meta.module,
    title: content.title || data.title || 'New notification',
    description: content.body || data.body || data.description || '',
    icon: data.icon || meta.icon,
    color: data.color || meta.color,
    time: new Date().toISOString(),
    route: resolveNotificationRoute(data),
    data,
    dedupeKey: remoteMessage.messageId || data.dedupeKey || null,
  };
}
