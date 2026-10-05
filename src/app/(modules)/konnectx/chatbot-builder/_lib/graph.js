import { defaultNodeData, getNodeDefinition } from './nodeRegistry';

/**
 * Translation layer between the linear step list the mobile editor works with
 * and the `nodes` / `edges` graph the web canvas editor reads and writes.
 *
 * Both clients persist the same two columns on `BotFlow`, so a flow authored on
 * either one opens correctly in the other.
 */

const COLUMN_X = 120;
const ROW_HEIGHT = 140;
const EDGE_COLOR = '#10b981';

let idCounter = 0;
/** Collision-free step id. Kept readable so graph JSON stays debuggable. */
function nextStepId(prefix = 'step') {
    idCounter += 1;
    return `${prefix}_${Date.now().toString(36)}${idCounter}`;
}

function definitionFor(subTypeOrType) {
    const definition = getNodeDefinition(subTypeOrType);
    if (definition) return definition;
    return getNodeDefinition('textMessage');
}

/** Normalizes any incoming node/step payload into the editor's step shape. */
export function normalizeStep(raw = {}, index = 0) {
    const data = raw.data ?? raw.config ?? {};
    const subType = data.subType || data.type || raw.subType || raw.type || 'textMessage';
    const definition = definitionFor(subType);

    return {
        id: raw.id || nextStepId(definition.type === 'triggerNode' ? 'trigger' : 'step'),
        definition,
        subType: definition.name,
        data: { ...defaultNodeData(definition), ...data, subType: definition.name }
    };
}

function positionOf(node, index) {
    const y = Number(node?.position?.y);
    const x = Number(node?.position?.x);
    return {
        x: Number.isFinite(x) ? x : COLUMN_X,
        y: Number.isFinite(y) ? y : index * ROW_HEIGHT
    };
}

/**
 * Builds the editor's ordered step list from a bot record.
 * Canvas nodes win over the legacy `steps` projection because they carry the
 * full property set; `steps` is only used when a bot has never been opened in
 * the canvas builder.
 */
export function stepsFromBot(bot) {
    const nodes = Array.isArray(bot?.nodes) ? bot.nodes.filter(Boolean) : [];
    if (nodes.length) {
        return [...nodes]
            .sort((a, b) => {
                const pa = positionOf(a, 0);
                const pb = positionOf(b, 0);
                return pa.y - pb.y || pa.x - pb.x;
            })
            .map((node, index) => normalizeStep(node, index));
    }

    const steps = Array.isArray(bot?.steps) ? bot.steps.filter(Boolean) : [];
    if (steps.length) {
        return steps
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((step, index) => normalizeStep(step, index));
    }

    return [
        normalizeStep({ data: { ...defaultNodeData(definitionFor('keyword')), keywords: 'hello, hi, start' } }),
        normalizeStep({ data: { ...defaultNodeData(definitionFor('textMessage')), text: 'Hi! How can we help you today?' } })
    ];
}

function isTrigger(step) {
    return step.definition?.type === 'triggerNode';
}

/**
 * Projects the ordered step list into canvas nodes stacked in one column.
 * Branching steps such as conditions keep a stable y so their outgoing edges
 * stay readable when the canvas opens the flow.
 */
export function stepsToNodes(steps) {
    return steps.map((step, index) => ({
        id: step.id,
        type: step.definition.type,
        position: { x: COLUMN_X, y: index * ROW_HEIGHT },
        data: {
            ...step.data,
            label: step.data?.label || step.definition.displayName,
            subType: step.definition.name,
            type: step.definition.name,
            configured: true
        }
    }));
}

/** Chains steps in order; condition steps fan out one edge per branch. */
export function stepsToEdges(steps) {
    const edges = [];

    for (let index = 0; index < steps.length - 1; index += 1) {
        const source = steps[index];
        const target = steps[index + 1];
        const subType = source.definition.name;
        const conditions = source.data?.conditions;

        if (subType === 'condition' && Array.isArray(conditions) && conditions.length) {
            conditions.forEach((condition, branchIndex) => {
                const handle = condition?.id || `cond_${branchIndex + 1}`;
                edges.push({
                    id: `${source.id}-${target.id}-${handle}`,
                    source: source.id,
                    target: target.id,
                    sourceHandle: handle,
                    type: 'step',
                    animated: false,
                    label: condition?.label || `Result ${branchIndex + 1}`,
                    style: { stroke: EDGE_COLOR, strokeWidth: 2 }
                });
            });
            continue;
        }

        edges.push({
            id: `${source.id}-${target.id}`,
            source: source.id,
            target: target.id,
            type: 'step',
            animated: true,
            style: { stroke: EDGE_COLOR, strokeWidth: 2 }
        });
    }

    return edges;
}

/** Payload for PUT /chatbots/[id] — graph plus its linear projection. */
export function stepsToPayload(steps) {
    const nodes = stepsToNodes(steps);
    const edges = stepsToEdges(steps);

    return {
        nodes,
        edges,
        steps: steps.map((step, index) => ({
            type: step.definition.type?.replace('Node', '').toUpperCase() || 'MESSAGE',
            config: Object.fromEntries(
                Object.entries(step.data).filter(([key]) => key !== 'configured')
            ),
            positionX: COLUMN_X,
            positionY: index * ROW_HEIGHT,
            order: index
        }))
    };
}

/** Adds a blank step of the chosen definition at the end of the list. */
export function appendStep(steps, definition) {
    return [
        ...steps,
        {
            id: nextStepId(definition.type === 'triggerNode' ? 'trigger' : 'step'),
            definition,
            subType: definition.name,
            data: defaultNodeData(definition)
        }
    ];
}

export function moveStep(steps, index, delta) {
    const target = index + delta;
    if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) return steps;

    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    return next;
}

export function updateStepData(steps, index, patch) {
    if (index < 0 || index >= steps.length) return steps;
    const next = [...steps];
    next[index] = { ...next[index], data: { ...next[index].data, ...patch } };
    return next;
}

/** One-line preview of the configured value shown on each step row. */
export function describeStep(step) {
    const data = step.data || {};

    switch (step.definition.name) {
        case 'keyword':
            return data.keywords || 'No keywords set';
        case 'textMessage':
            return data.text || 'Empty message';
        case 'imageMessage':
            return data.imageUrl || 'No image URL';
        case 'templateMessage':
            return data.templateName ? `${data.templateName} · ${data.languageCode || 'en_US'}` : 'No template';
        case 'condition': {
            const count = Array.isArray(data.conditions) ? data.conditions.length : 0;
            return `${count} branch${count === 1 ? '' : 'es'}`;
        }
        case 'waitForInput':
            return `${data.variable || 'last_response'} · ${data.validation || 'any'}`;
        case 'setVariable':
            return `${data.variable || 'var'} = ${data.value ?? ''}`;
        case 'delay':
            return `${data.seconds ?? 0}s delay`;
        case 'aiAgent':
            return data.category || 'GENERAL';
        case 'deskflowHandoff':
            return data.department || 'Support';
        case 'crmTag':
            return `${data.action === 'remove' ? 'Remove' : 'Add'} ${data.tag || 'tag'}`;
        case 'http':
            return `${data.method || 'GET'} ${data.url || 'no url'}`;
        case 'productShowcase':
            return data.sku ? `${data.selectionMode} · ${data.sku}` : data.selectionMode || 'last_viewed';
        case 'paymentRequest':
            return data.gateway || 'razorpay';
        default:
            return isTrigger(step) ? 'Entry point' : step.definition.description || '';
    }
}