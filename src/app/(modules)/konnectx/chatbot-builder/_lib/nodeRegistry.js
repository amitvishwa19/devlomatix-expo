import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Mobile mirror of the web chatbot node registry.
 *
 * The `name`, `type` and `properties` shape MUST stay identical to
 * `src/app/workspace/[workspaceId]/konnectx/chatbot/flow-builder/_lib/node-registry.js`
 * so a flow authored on either client produces nodes the other can render.
 * Only the icon and the grouping differ — `lucide-react` has no place here.
 */
export const WA_NODE_REGISTRY = {
    welcomeTrigger: {
        displayName: 'Welcome Trigger',
        name: 'welcome',
        icon: 'play-circle',
        color: '#10b981',
        group: 'Triggers',
        type: 'triggerNode',
        description: 'Triggered when a new user starts a chat',
        properties: []
    },
    keywordTrigger: {
        displayName: 'Keyword Trigger',
        name: 'keyword',
        icon: 'chatbubble-ellipses',
        color: '#10b981',
        group: 'Triggers',
        type: 'triggerNode',
        description: 'Start the flow when any of these keywords arrive',
        properties: [
            {
                displayName: 'Keywords',
                name: 'keywords',
                type: 'string',
                default: 'hello, hi, start, menu',
                description: 'Comma separated list of trigger keywords'
            },
            {
                displayName: 'Match mode',
                name: 'matchMode',
                type: 'options',
                options: [
                    { name: 'Contains', value: 'contains' },
                    { name: 'Exact match', value: 'exact' },
                    { name: 'Starts with', value: 'starts_with' }
                ],
                default: 'contains'
            }
        ]
    },
    responseTrigger: {
        displayName: 'Reply Trigger',
        name: 'any_response',
        icon: 'return-down-forward',
        color: '#10b981',
        group: 'Triggers',
        type: 'triggerNode',
        description: 'Continue on any reply or button tap',
        properties: [
            {
                displayName: 'Save reply to variable',
                name: 'variable',
                type: 'string',
                default: 'last_response'
            }
        ]
    },
    orderTrigger: {
        displayName: 'Order Created',
        name: 'orderCreated',
        icon: 'bag-handle',
        color: '#f59e0b',
        group: 'eCommerce Triggers',
        type: 'triggerNode',
        description: 'Triggered when a new order is placed',
        properties: [
            { displayName: 'Minimum order value', name: 'minValue', type: 'number', default: 0 }
        ]
    },
    abandonedCartTrigger: {
        displayName: 'Abandoned Cart',
        name: 'abandonedCart',
        icon: 'cart',
        color: '#f59e0b',
        group: 'eCommerce Triggers',
        type: 'triggerNode',
        description: 'Triggered when a customer abandons checkout',
        properties: [
            { displayName: 'Wait time (minutes)', name: 'waitTime', type: 'number', default: 30 }
        ]
    },
    textMessage: {
        displayName: 'Send Text',
        name: 'textMessage',
        icon: 'chatbubble',
        color: '#3b82f6',
        group: 'Messages',
        type: 'messageNode',
        description: 'Send a plain text message',
        properties: [
            {
                displayName: 'Message text',
                name: 'text',
                type: 'string',
                long: true,
                default: 'Hello! How can we help you today?'
            }
        ]
    },
    imageMessage: {
        displayName: 'Send Image',
        name: 'imageMessage',
        icon: 'image',
        color: '#3b82f6',
        group: 'Messages',
        type: 'messageNode',
        description: 'Send an image with an optional caption',
        properties: [
            { displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '' },
            { displayName: 'Caption', name: 'caption', type: 'string', default: '', long: true }
        ]
    },
    templateMessage: {
        displayName: 'Approved Template',
        name: 'templateMessage',
        icon: 'document-text',
        color: '#3b82f6',
        group: 'Messages',
        type: 'messageNode',
        description: 'Send a Meta approved template',
        properties: [
            { displayName: 'Template name', name: 'templateName', type: 'string', default: '' },
            { displayName: 'Language code', name: 'languageCode', type: 'string', default: 'en_US' }
        ]
    },
    conditionNode: {
        displayName: 'Condition',
        name: 'condition',
        icon: 'git-branch',
        color: '#8b5cf6',
        group: 'Logic & flow',
        type: 'logicNode',
        description: 'Branch the flow on the last reply',
        properties: [
            {
                displayName: 'Conditions',
                name: 'conditions',
                type: 'conditions',
                default: [
                    { id: 'cond_1', label: 'Result 1', variable: 'last_response', operation: 'contains', value: '1' },
                    { id: 'cond_2', label: 'Result 2', variable: 'last_response', operation: 'contains', value: '2' }
                ]
            }
        ]
    },
    waitForInput: {
        displayName: 'Wait for Input',
        name: 'waitForInput',
        icon: 'hourglass',
        color: '#8b5cf6',
        group: 'Logic & flow',
        type: 'logicNode',
        description: 'Pause and validate the next reply',
        properties: [
            { displayName: 'Store answer in variable', name: 'variable', type: 'string', default: 'last_response' },
            {
                displayName: 'Expected format',
                name: 'validation',
                type: 'options',
                options: [
                    { name: 'Any text', value: 'any' },
                    { name: 'Email', value: 'email' },
                    { name: 'Phone', value: 'phone' },
                    { name: 'Number', value: 'number' },
                    { name: 'Location', value: 'location' }
                ],
                default: 'any'
            },
            {
                displayName: 'Retry message',
                name: 'retryPrompt',
                type: 'string',
                default: 'Please enter a valid value to continue.',
                long: true
            }
        ]
    },
    setVariable: {
        displayName: 'Set Variable',
        name: 'setVariable',
        icon: 'options',
        color: '#8b5cf6',
        group: 'Logic & flow',
        type: 'logicNode',
        description: 'Store a value in flow memory',
        properties: [
            { displayName: 'Variable name', name: 'variable', type: 'string', default: 'custom_var' },
            { displayName: 'Value', name: 'value', type: 'string', default: 'true' }
        ]
    },
    delayNode: {
        displayName: 'Delay',
        name: 'delay',
        icon: 'time',
        color: '#8b5cf6',
        group: 'Logic & flow',
        type: 'logicNode',
        description: 'Wait before the next step',
        properties: [
            { displayName: 'Seconds', name: 'seconds', type: 'number', default: 5 }
        ]
    },
    aiAgent: {
        displayName: 'AI Agent',
        name: 'aiAgent',
        icon: 'sparkles',
        color: '#ec4899',
        group: 'AI & Knowledge',
        type: 'actionNode',
        description: 'Answer from your knowledge base with Gemini',
        properties: [
            { displayName: 'Knowledge scope', name: 'category', type: 'string', default: 'GENERAL' },
            {
                displayName: 'System instructions',
                name: 'systemPrompt',
                type: 'string',
                long: true,
                default: 'You are a helpful support agent. Answer concisely.'
            },
            {
                displayName: 'Fallback message',
                name: 'fallbackText',
                type: 'string',
                long: true,
                default: 'I am not sure about that. Let me connect you with our team.'
            }
        ]
    },
    deskflowHandoff: {
        displayName: 'Human Handoff',
        name: 'deskflowHandoff',
        icon: 'person-add',
        color: '#ec4899',
        group: 'Team & Support',
        type: 'actionNode',
        description: 'Transfer the chat to a human agent',
        properties: [
            { displayName: 'Department', name: 'department', type: 'string', default: 'Support' },
            {
                displayName: 'Handoff message',
                name: 'handoffMessage',
                type: 'string',
                long: true,
                default: 'Connecting you with a team representative right now...'
            }
        ]
    },
    crmTag: {
        displayName: 'Manage Tag',
        name: 'crmTag',
        icon: 'pricetag',
        color: '#ec4899',
        group: 'CRM & Contacts',
        type: 'actionNode',
        description: 'Add or remove a tag on the contact',
        properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Add tag', value: 'add' },
                    { name: 'Remove tag', value: 'remove' }
                ],
                default: 'add'
            },
            { displayName: 'Tag name', name: 'tag', type: 'string', default: 'Lead' }
        ]
    },
    httpRequest: {
        displayName: 'HTTP Request',
        name: 'http',
        icon: 'globe',
        color: '#6366f1',
        group: 'Integrations',
        type: 'actionNode',
        description: 'Call an external API',
        properties: [
            {
                displayName: 'Method',
                name: 'method',
                type: 'options',
                options: [
                    { name: 'GET', value: 'GET' },
                    { name: 'POST', value: 'POST' }
                ],
                default: 'GET'
            },
            { displayName: 'URL', name: 'url', type: 'string', default: '' }
        ]
    },
    productShowcase: {
        displayName: 'Product Showcase',
        name: 'productShowcase',
        icon: 'cube',
        color: '#6366f1',
        group: 'Commerce',
        type: 'actionNode',
        description: 'Send a product card from your store',
        properties: [
            {
                displayName: 'Selection',
                name: 'selectionMode',
                type: 'options',
                options: [
                    { name: 'Last viewed', value: 'last_viewed' },
                    { name: 'Specific SKU', value: 'sku' },
                    { name: 'Top sellers', value: 'top_sellers' }
                ],
                default: 'last_viewed'
            },
            { displayName: 'SKU', name: 'sku', type: 'string', default: '' }
        ]
    },
    paymentRequest: {
        displayName: 'Payment Link',
        name: 'paymentRequest',
        icon: 'card',
        color: '#6366f1',
        group: 'Commerce',
        type: 'actionNode',
        description: 'Send a secure payment link',
        properties: [
            {
                displayName: 'Gateway',
                name: 'gateway',
                type: 'options',
                options: [
                    { name: 'Razorpay', value: 'razorpay' },
                    { name: 'Stripe', value: 'stripe' },
                    { name: 'WhatsApp Pay', value: 'wa_pay' }
                ],
                default: 'razorpay'
            }
        ]
    }
};

// Aliases kept in sync with the web registry so either spelling resolves.
WA_NODE_REGISTRY.welcome = WA_NODE_REGISTRY.welcomeTrigger;
WA_NODE_REGISTRY.keywordTrigger = WA_NODE_REGISTRY.keywordTrigger;
WA_NODE_REGISTRY.anyResponse = WA_NODE_REGISTRY.responseTrigger;
WA_NODE_REGISTRY.response = WA_NODE_REGISTRY.responseTrigger;
WA_NODE_REGISTRY.responseTrigger = WA_NODE_REGISTRY.responseTrigger;
WA_NODE_REGISTRY.orderCreated = WA_NODE_REGISTRY.orderTrigger;
WA_NODE_REGISTRY.abandonedCart = WA_NODE_REGISTRY.abandonedCartTrigger;
WA_NODE_REGISTRY.conditionNode = WA_NODE_REGISTRY.conditionNode;
WA_NODE_REGISTRY.delayNode = WA_NODE_REGISTRY.delayNode;
WA_NODE_REGISTRY.httpRequest = WA_NODE_REGISTRY.httpRequest;
WA_NODE_REGISTRY.deskflow = WA_NODE_REGISTRY.deskflowHandoff;
WA_NODE_REGISTRY.tag = WA_NODE_REGISTRY.crmTag;

/** Registry entries that are flow entry points rather than steps. */
export const TRIGGER_TYPES = ['triggerNode'];

/**
 * Resolves a definition from any of the identifiers a node might carry:
 * registry alias, canonical `name`, coarse `type`, or display name.
 */
export function getNodeDefinition(subTypeOrType) {
    if (!subTypeOrType) return null;
    if (WA_NODE_REGISTRY[subTypeOrType]) return WA_NODE_REGISTRY[subTypeOrType];
    return (
        Object.values(WA_NODE_REGISTRY).find(
            (node) =>
                node.name === subTypeOrType ||
                node.type === subTypeOrType ||
                node.displayName?.toLowerCase() === String(subTypeOrType).toLowerCase()
        ) || null
    );
}

/** Definitions grouped for the "add step" picker, entry points first. */
export function getNodeGroups() {
    const order = [
        'Triggers',
        'Messages',
        'Logic & flow',
        'AI & Knowledge',
        'Team & Support',
        'CRM & Contacts',
        'Commerce',
        'Integrations',
        'eCommerce Triggers'
    ];

    const seen = new Set();
    const buckets = {};

    for (const node of Object.values(WA_NODE_REGISTRY)) {
        if (!node?.name || seen.has(node.name)) continue;
        seen.add(node.name);
        if (!buckets[node.group]) buckets[node.group] = [];
        buckets[node.group].push(node);
    }

    return order
        .filter((group) => buckets[group]?.length)
        .map((group) => ({ group, items: buckets[group] }));
}

/** Default property bag for a freshly added node. */
export function defaultNodeData(definition) {
    const data = {
        label: definition.displayName,
        subType: definition.name,
        type: definition.name,
        configured: true
    };

    for (const property of definition.properties ?? []) {
        data[property.name] = Array.isArray(property.default)
            ? property.default.map((item) => ({ ...item }))
            : property.default;
    }

    return data;
}