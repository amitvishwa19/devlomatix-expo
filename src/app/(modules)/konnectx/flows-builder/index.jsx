import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { KonnectxButton, KonnectxSection, statusTone } from '~/components/konnectx/KonnectxBadge';
import KonnectxField, { KonnectxChips } from '~/components/konnectx/KonnectxField';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as flowsService from '~/services/konnectx/flows';
import { useAppTheme } from '~/theme/AppTheme';

import {
    FLOW_VERSION,
    generateFlowDSL,
    parseFlowDSL,
    sanitizeIdentifier,
    validateFlowScreens
} from './_lib/flowUtils';

const INPUT_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Number', value: 'number' },
    { label: 'Password', value: 'password' }
];

const PALETTE = [
    { type: 'TextHeading', label: 'Heading', icon: 'text' },
    { type: 'TextSubheading', label: 'Subheading', icon: 'reader-outline' },
    { type: 'TextBody', label: 'Body text', icon: 'document-text-outline' },
    { type: 'TextCaption', label: 'Caption', icon: 'information-circle-outline' },
    { type: 'Image', label: 'Image', icon: 'image-outline' },
    { type: 'TextInput', label: 'Text answer', icon: 'create-outline' },
    { type: 'TextArea', label: 'Long answer', icon: 'reorder-four-outline' },
    { type: 'Select', label: 'Dropdown', icon: 'chevron-down-circle-outline' },
    { type: 'RadioButtons', label: 'Radio buttons', icon: 'radio-button-on-outline' },
    { type: 'CheckboxGroup', label: 'Checkboxes', icon: 'checkbox-outline' },
    { type: 'DatePicker', label: 'Date picker', icon: 'calendar-outline' },
    { type: 'ConsentCheckbox', label: 'Consent', icon: 'shield-checkmark-outline' }
];

function newComponent(type, index) {
    const id = `comp_${type.toLowerCase()}_${Date.now().toString(36)}_${index}`;

    switch (type) {
        case 'TextHeading':
            return { id, type, text: 'Heading Text', label: '' };
        case 'TextSubheading':
            return { id, type, text: 'Subheading Text', label: '' };
        case 'TextBody':
            return { id, type, text: 'Body text content description...', label: '' };
        case 'TextCaption':
            return { id, type, text: 'Caption or disclaimer text', label: '' };
        case 'Image':
            return { id, type, src: 'https://via.placeholder.com/600x300.png', altText: '' };
        case 'TextInput':
            return { id, type, name: `input_${index + 1}`, label: 'Text Input', inputType: 'text', required: true, helperText: '' };
        case 'TextArea':
            return { id, type, name: `textarea_${index + 1}`, label: 'Text Area', required: true, helperText: '' };
        case 'Select':
            return { id, type, name: `select_${index + 1}`, label: 'Select Option', required: true, options: [{ label: 'Option 1', value: 'opt_1' }] };
        case 'RadioButtons':
            return { id, type, name: `radio_${index + 1}`, label: 'Choose One', required: true, options: [{ label: 'Option 1', value: 'opt_1' }] };
        case 'CheckboxGroup':
            return { id, type, name: `check_${index + 1}`, label: 'Choose Multiple', required: false, options: [{ label: 'Option 1', value: 'opt_1' }] };
        case 'DatePicker':
            return { id, type, name: `date_${index + 1}`, label: 'Select Date', required: true };
        case 'ConsentCheckbox':
            return { id, type, name: `consent_${index + 1}`, label: 'I agree to the terms', required: true };
        default:
            return { id, type: 'TextBody', text: 'New content', label: '' };
    }
}

function describeComponent(component) {
    if (!component) return '';
    if (['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'].includes(component.type)) {
        return component.text || component.label || 'Empty text';
    }
    if (component.type === 'Image') return component.src || 'No image URL';
    return component.label || component.name || component.type;
}

/**
 * Mobile-native WhatsApp Flow editor.
 *
 * The desktop builder is a multi-pane canvas; on a phone the same flow is
 * edited as screens containing components, which is exactly the structure the
 * persisted `screens` column already holds. The DSL, validation and simulator
 * all run through the same `flowUtils` the web builder uses, so a flow saved
 * here is byte-compatible with the desktop editor.
 */
export default function FlowBuilderScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [flow, setFlow] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [screens, setScreens] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const [adding, setAdding] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [showJson, setShowJson] = useState(false);
    const [showSimulator, setShowSimulator] = useState(false);
    const [busyAction, setBusyAction] = useState(null);

    const load = useCallback(async () => {
        if (!userId || !id) return;
        try {
            setLoading(true);
            const response = await flowsService.getFlow(userId, id);
            const record = response?.flow || response;
            setFlow(record);
            setName(record?.name || '');
            setDescription(record?.description || '');

            const parsed = parseFlowDSL(record?.screens).length
                ? parseFlowDSL(record?.screens)
                : [{ id: 'WELCOME', title: 'Welcome', terminal: true, children: [], footerAction: { type: 'complete', label: 'Finish' } }];

            setScreens(parsed);
            setActiveId(parsed[0]?.id || null);
            setDirty(false);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setLoading(false);
        }
    }, [userId, id]);

    useEffect(() => { load(); }, [load]);

    const activeIndex = screens.findIndex((screen) => screen.id === activeId);
    const activeScreen = screens[activeIndex];

    const validation = useMemo(() => validateFlowScreens(screens), [screens]);
    const dsl = useMemo(
        () => generateFlowDSL(screens, { version: FLOW_VERSION, endpointUrl: flow?.endpointUrl }),
        [screens, flow?.endpointUrl]
    );

    const mutate = useCallback((updater) => {
        setScreens((prev) => updater(prev));
        setDirty(true);
    }, []);

    const updateActive = useCallback(
        (patch) => {
            mutate((prev) => prev.map((screen, i) => (i === activeIndex ? { ...screen, ...patch } : screen)));
        },
        [activeIndex, mutate]
    );

    const addScreen = () => {
        const nextNumber = screens.length + 1;
        const screenId = sanitizeIdentifier(`SCREEN_${nextNumber}`, `SCREEN_${nextNumber}`, true);
        if (screens.some((screen) => screen.id === screenId)) {
            Toast.show({ type: 'error', text1: 'Duplicate', text2: `${screenId} already exists` });
            return;
        }

        const next = [...screens, { id: screenId, title: `Screen ${nextNumber}`, terminal: false, children: [], footerAction: { type: 'navigate', label: 'Continue', screen: '' } }];

        // The previous last screen can no longer be terminal.
        if (next.length > 1 && next[next.length - 2].terminal) {
            next[next.length - 2] = { ...next[next.length - 2], terminal: false };
        }

        setScreens(next);
        setActiveId(screenId);
        setDirty(true);
    };

    const deleteScreen = () => {
        if (screens.length <= 1) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'A flow needs at least one screen' });
            return;
        }

        const remaining = screens.filter((screen) => screen.id !== activeId);
        // Keep exactly one terminal screen.
        if (activeScreen?.terminal && remaining.length && !remaining.some((s) => s.terminal)) {
            remaining[remaining.length - 1] = { ...remaining[remaining.length - 1], terminal: true };
        }

        setScreens(remaining);
        setActiveId(remaining[0]?.id || null);
        setDirty(true);
    };

    const moveScreen = (delta) => {
        const target = activeIndex + delta;
        if (target < 0 || target >= screens.length) return;

        const copy = [...screens];
        const [item] = copy.splice(activeIndex, 1);
        copy.splice(target, 0, item);
        setScreens(copy);
        setDirty(true);
    };

    const handleSave = useCallback(async () => {
        if (!validation.valid) {
            Toast.show({ type: 'error', text1: 'Cannot save', text2: validation.errors[0] });
            return;
        }

        try {
            setSaving(true);
            await flowsService.updateFlow(userId, id, {
                name: name.trim() || 'Untitled flow',
                description,
                screens: dsl.screens,
                definition: dsl
            });
            Toast.show({ type: 'success', text1: 'Flow saved' });
            setDirty(false);
            load();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setSaving(false);
        }
    }, [description, dsl, id, load, name, userId, validation]);

    const runAction = useCallback(
        async (label, action) => {
            try {
                setBusyAction(label);
                const response = await action();
                const result = response?.data || response;
                Toast.show({
                    type: result?.metaFlowId || result?.flowId || result?.success !== false ? 'success' : 'error',
                    text1: `${label} done`,
                    text2: result?.error || `Status: ${flow?.status || 'DRAFT'}`
                });
                load();
            } catch (err) {
                Toast.show({ type: 'error', text1: `${label} failed`, text2: err?.response?.data?.error || err.message });
            } finally {
                setBusyAction(null);
            }
        },
        [flow?.status, load]
    );

    if (loading) {
        return (
            <KonnectxScreen title="Flow Builder" backTo="/(modules)/konnectx/(tabs)">
                <SkeletonCard />
                <SkeletonCard />
            </KonnectxScreen>
        );
    }

    return (
        <KonnectxScreen
            title="Flow Builder"
            subtitle={dirty ? 'Unsaved changes' : flow?.name || 'Saved'}
            backTo="/(modules)/konnectx/(tabs)"
            onAction={handleSave}
            actionLabel="Save"
            actionIcon="save-outline">
            <View className="mb-3 flex-row flex-wrap gap-1.5">
                <KonnectxBadge label={flow?.status || 'DRAFT'} tone={statusTone(flow?.status)} />
                <KonnectxBadge label={`v${FLOW_VERSION}`} tone="info" />
                <KonnectxBadge label={`${screens.length} screens`} tone="violet" />
                {validation.errors.length ? (
                    <KonnectxBadge label={`${validation.errors.length} errors`} tone="danger" icon="alert-circle" />
                ) : (
                    <KonnectxBadge label="Valid" tone="success" icon="checkmark-circle" />
                )}
            </View>

            {validation.errors.length ? (
                <View className="mb-3 rounded-[16px] border p-3" style={{ borderColor: '#dc262655', backgroundColor: '#dc262611' }}>
                    {validation.errors.slice(0, 4).map((error) => (
                        <Text key={error} className="text-[11px] text-red-600">• {error}</Text>
                    ))}
                </View>
            ) : null}

            <KonnectxSection title="Flow details">
                <KonnectxField label="Name" required value={name} onChangeText={(text) => { setName(text); setDirty(true); }} />
                <KonnectxField label="Description" multiline value={description} onChangeText={(text) => { setDescription(text); setDirty(true); }} />
            </KonnectxSection>

            <KonnectxSection
                title="Screens"
                action={
                    <TouchableOpacity onPress={addScreen} className="flex-row items-center gap-1">
                        <Ionicons name="add-circle" size={15} color="#0284c7" />
                        <Text className="text-[11px] font-bold text-sky-600">Add screen</Text>
                    </TouchableOpacity>
                }>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                    {screens.map((screen, index) => (
                        <TouchableOpacity
                            key={screen.id}
                            onPress={() => setActiveId(screen.id)}
                            className="rounded-[12px] border px-2.5 py-1.5"
                            style={{
                                backgroundColor: screen.id === activeId ? '#0284c71f' : palette.colors.surface,
                                borderColor: screen.id === activeId ? '#0284c7' : palette.colors.border
                            }}>
                            <Text className="text-[11px] font-bold" style={{ color: screen.id === activeId ? '#0284c7' : palette.textColor }}>
                                {index + 1}. {screen.title || screen.id}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {activeScreen ? (
                    <View className="mt-1 gap-2">
                        <KonnectxField label="Screen title" value={activeScreen.title || ''} onChangeText={(text) => updateActive({ title: text })} />
                        <KonnectxField label="Screen ID" value={activeScreen.id} onChangeText={(text) => updateActive({ id: sanitizeIdentifier(text, 'SCREEN', true) })} hint="Must be unique and A-Z 0-9 _ only" />

                        <View className="mt-1">
                            <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Continue action</Text>
                            <KonnectxChips
                                options={[
                                    { label: 'Go to screen', value: 'navigate' },
                                    { label: 'Complete flow', value: 'complete' }
                                ]}
                                value={activeScreen.footerAction?.type || 'navigate'}
                                onChange={(value) => updateActive({ footerAction: { ...(activeScreen.footerAction || {}), type: value }, terminal: value === 'complete' })}
                            />
                        </View>

                        {(activeScreen.footerAction?.type || 'navigate') === 'navigate' ? (
                            <View className="gap-1.5">
                                {screens
                                    .filter((screen) => screen.id !== activeScreen.id)
                                    .map((screen) => (
                                        <TouchableOpacity
                                            key={screen.id}
                                            onPress={() => updateActive({ footerAction: { ...(activeScreen.footerAction || {}), type: 'navigate', screen: screen.id } })}
                                            className="flex-row items-center gap-1.5 rounded-[10px] border px-2 py-1.5"
                                            style={{ borderColor: palette.colors.border }}>
                                            <Ionicons
                                                name={activeScreen.footerAction?.screen === screen.id ? 'radio-button-on' : 'radio-button-off'}
                                                size={13}
                                                color={activeScreen.footerAction?.screen === screen.id ? '#0284c7' : palette.textMutedColor}
                                            />
                                            <Text className={`text-[11px] ${palette.text}`}>{screen.title || screen.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        ) : null}

                        <KonnectxField label="Footer button label" value={activeScreen.footerAction?.label || ''} onChangeText={(text) => updateActive({ footerAction: { ...(activeScreen.footerAction || {}), label: text } })} />
                    </View>
                ) : null}
            </KonnectxSection>

            <KonnectxSection
                title={activeScreen ? `Content — ${activeScreen.title || activeScreen.id}` : 'Content'}
                action={
                    activeScreen ? (
                        <TouchableOpacity onPress={() => setAdding(true)} className="flex-row items-center gap-1">
                            <Ionicons name="add-circle" size={15} color="#0284c7" />
                            <Text className="text-[11px] font-bold text-sky-600">Add</Text>
                        </TouchableOpacity>
                    ) : null
                }>
                {!activeScreen || !(activeScreen.children || []).length ? (
                    <Text className={`py-3 text-center text-[11px] ${palette.textSoft}`}>
                        No content yet. Add a heading or an answer field.
                    </Text>
                ) : (
                    <View className="gap-1.5">
                        {activeScreen.children.map((child, index) => (
                            <TouchableOpacity
                                key={child.id || `${child.type}_${index}`}
                                onPress={() => setEditingChild({ index, component: child })}
                                className="flex-row items-center gap-2 rounded-[12px] border p-2"
                                style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border }}>
                                <Ionicons name="ellipse" size={7} color={palette.textMutedColor} />
                                <View className="flex-1">
                                    <Text className={`text-[11px] font-bold ${palette.text}`}>{child.type}</Text>
                                    <Text className={`text-[10px] ${palette.textSoft}`} numberOfLines={1}>
                                        {describeComponent(child)}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={13} color={palette.textMutedColor} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activeScreen ? (
                    <View className="mt-2 flex-row gap-2">
                        <KonnectxButton label="Up" icon="arrow-up" variant="secondary" className="flex-1" onPress={() => moveScreen(-1)} disabled={activeIndex <= 0} />
                        <KonnectxButton label="Down" icon="arrow-down" variant="secondary" className="flex-1" onPress={() => moveScreen(1)} disabled={activeIndex >= screens.length - 1} />
                        <KonnectxButton label="Delete" icon="trash-outline" variant="danger" className="flex-1" onPress={deleteScreen} />
                    </View>
                ) : null}
            </KonnectxSection>

            <View className="mb-3 gap-2">
                <View className="flex-row gap-2">
                    <KonnectxButton label="DSL JSON" icon="code-slash-outline" variant="secondary" className="flex-1" onPress={() => setShowJson(true)} />
                    <KonnectxButton label="Simulator" icon="phone-portrait-outline" variant="secondary" className="flex-1" onPress={() => setShowSimulator(true)} />
                </View>
                <View className="flex-row gap-2">
                    <KonnectxButton label="Clone" icon="copy-outline" variant="secondary" className="flex-1" loading={busyAction === 'Clone'} onPress={() => runAction('Clone', () => flowsService.cloneFlow(userId, id))} />
                    <KonnectxButton label="Push" icon="cloud-upload-outline" variant="secondary" className="flex-1" loading={busyAction === 'Push'} onPress={() => runAction('Push', () => flowsService.pushFlowToMeta(userId, id))} />
                    <KonnectxButton label="Publish" icon="rocket-outline" className="flex-1" loading={busyAction === 'Publish'} onPress={() => runAction('Publish', () => flowsService.publishFlow(userId, id))} />
                </View>
            </View>

            <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)}>
                <Sheet title="Add content" onClose={() => setAdding(false)}>
                    <View className="gap-2">
                        {PALETTE.map((item) => (
                            <TouchableOpacity
                                key={item.type}
                                onPress={() => {
                                    mutate((prev) =>
                                        prev.map((screen, i) =>
                                            i === activeIndex
                                                ? { ...screen, children: [...(screen.children || []), newComponent(item.type, (screen.children || []).length)] }
                                                : screen
                                        )
                                    );
                                    setAdding(false);
                                }}
                                className="flex-row items-center gap-2 rounded-[14px] border p-2.5"
                                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                <Ionicons name={item.icon} size={16} color="#0284c7" />
                                <Text className={`flex-1 text-[13px] font-semibold ${palette.text}`}>{item.label}</Text>
                                <Text className={`text-[10px] ${palette.textMuted}`}>{item.type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Sheet>
            </Modal>

            <ComponentEditorModal
                state={editingChild}
                onClose={() => setEditingChild(null)}
                onChange={(component) => {
                    if (!editingChild) return;
                    mutate((prev) =>
                        prev.map((screen, i) =>
                            i === activeIndex
                                ? { ...screen, children: (screen.children || []).map((c, ci) => (ci === editingChild.index ? component : c)) }
                                : screen
                        )
                    );
                }}
                onDelete={() => {
                    if (!editingChild) return;
                    mutate((prev) =>
                        prev.map((screen, i) =>
                            i === activeIndex
                                ? { ...screen, children: (screen.children || []).filter((_, ci) => ci !== editingChild.index) }
                                : screen
                        )
                    );
                    setEditingChild(null);
                }}
            />

            <Modal visible={showJson} animationType="slide" onRequestClose={() => setShowJson(false)}>
                <Sheet title="Flow DSL" onClose={() => setShowJson(false)}>
                    <Text selectable className="text-[10px]" style={{ color: palette.textColor, fontFamily: 'monospace' }}>
                        {JSON.stringify(dsl, null, 2)}
                    </Text>
                </Sheet>
            </Modal>

            <SimulatorModal visible={showSimulator} screens={screens} onClose={() => setShowSimulator(false)} />
        </KonnectxScreen>
    );
}

/** Shared full-screen sheet chrome for the builder's modals. */
function Sheet({ title, onClose, children }) {
    const { palette } = useAppTheme();

    return (
        <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <View className="flex-row items-center justify-between border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                    <Ionicons name="close" size={20} color={palette.textMutedColor} />
                </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-3" contentContainerStyle={{ paddingBottom: 40 }}>
                {children}
            </ScrollView>
        </View>
    );
}

/** Property sheet for a single screen component, driven by its type. */
function ComponentEditorModal({ state, onClose, onChange, onDelete }) {
    const { palette } = useAppTheme();
    if (!state) return null;

    const { component } = state;
    const isText = ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'].includes(component.type);
    const isChoice = ['Select', 'RadioButtons', 'CheckboxGroup'].includes(component.type);
    const options = Array.isArray(component.options) ? component.options : [];
    const isAnswer = ['TextInput', 'TextArea', 'Select', 'RadioButtons', 'CheckboxGroup', 'DatePicker', 'ConsentCheckbox'].includes(component.type);

    return (
        <Modal visible animationType="slide" onRequestClose={onClose}>
            <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                    <TouchableOpacity onPress={onClose} hitSlop={10}>
                        <Ionicons name="chevron-back" size={20} color={palette.textMutedColor} />
                    </TouchableOpacity>
                    <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>{component.type}</Text>
                </View>

                <ScrollView className="flex-1 p-3" contentContainerStyle={{ paddingBottom: 40, gap: 2 }}>
                    {isText ? (
                        <KonnectxField
                            label="Text"
                            multiline
                            value={component.text || ''}
                            onChangeText={(text) => onChange({ ...component, text })}
                        />
                    ) : null}

                    {component.type === 'Image' ? (
                        <>
                            <KonnectxField label="Image URL" value={component.src || ''} onChangeText={(src) => onChange({ ...component, src })} />
                            <KonnectxField label="Alt text" value={component.altText || ''} onChangeText={(altText) => onChange({ ...component, altText })} />
                        </>
                    ) : null}

                    {isAnswer ? (
                        <>
                            <KonnectxField
                                label="System name"
                                required
                                value={component.name || ''}
                                onChangeText={(name) => onChange({ ...component, name: sanitizeIdentifier(name, 'field_1') })}
                                hint="Used in the DSL payload, A-Z 0-9 _ only"
                            />
                            <KonnectxField
                                label="Label"
                                value={component.label || ''}
                                onChangeText={(label) => onChange({ ...component, label })}
                            />

                            {component.type === 'TextInput' ? (
                                <View>
                                    <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                        Input type
                                    </Text>
                                    <KonnectxChips
                                        options={INPUT_TYPES}
                                        value={component.inputType || 'text'}
                                        onChange={(inputType) => onChange({ ...component, inputType })}
                                    />
                                </View>
                            ) : null}

                            {['TextInput', 'TextArea'].includes(component.type) ? (
                                <KonnectxField
                                    label="Helper text"
                                    value={component.helperText || ''}
                                    onChangeText={(helperText) => onChange({ ...component, helperText })}
                                />
                            ) : null}

                            <KonnectxChips
                                options={[
                                    { label: 'Required', value: true },
                                    { label: 'Optional', value: false }
                                ]}
                                value={component.required !== false}
                                onChange={(value) => onChange({ ...component, required: value })}
                            />
                        </>
                    ) : null}

                    {isChoice ? (
                        <View className="gap-2">
                            <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Options</Text>
                            {options.map((option, index) => (
                                <View
                                    key={index}
                                    className="flex-row gap-1.5 rounded-[12px] border p-2"
                                    style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surfaceAlt }}>
                                    <TextInput
                                        value={option.label || ''}
                                        onChangeText={(label) =>
                                            onChange({
                                                ...component,
                                                options: options.map((o, i) => (i === index ? { ...o, label } : o))
                                            })
                                        }
                                        placeholder="Label"
                                        placeholderTextColor={palette.textMutedColor}
                                        className="flex-[3] rounded-[10px] border px-2 py-1 text-[12px]"
                                        style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                    />
                                    <TextInput
                                        value={option.value || ''}
                                        onChangeText={(value) =>
                                            onChange({
                                                ...component,
                                                options: options.map((o, i) => (i === index ? { ...o, value: sanitizeIdentifier(value, `opt_${index + 1}`) } : o))
                                            })
                                        }
                                        placeholder="value"
                                        placeholderTextColor={palette.textMutedColor}
                                        className="flex-1 rounded-[10px] border px-2 py-1 text-[12px]"
                                        style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => onChange({ ...component, options: options.filter((_, i) => i !== index) })}
                                        hitSlop={8}>
                                        <Ionicons name="trash-outline" size={15} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={() =>
                                    onChange({
                                        ...component,
                                        options: [...options, { label: `Option ${options.length + 1}`, value: `opt_${options.length + 1}` }]
                                    })
                                }
                                className="flex-row items-center justify-center gap-1 rounded-[12px] border py-1.5"
                                style={{ borderColor: palette.colors.border }}>
                                <Ionicons name="add" size={14} color="#0284c7" />
                                <Text className="text-[11px] font-bold text-sky-600">Add option</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <View className="mt-2">
                        <KonnectxButton label="Delete component" icon="trash-outline" variant="danger" onPress={onDelete} />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

/** Read-only walk-through of the screens, following the footer actions. */
function SimulatorModal({ visible, screens, onClose }) {
    const { palette } = useAppTheme();
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        if (visible) {
            setIndex(0);
            setAnswers({});
        }
    }, [visible]);

    const screen = screens[index];

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                    <TouchableOpacity onPress={onClose} hitSlop={10}>
                        <Ionicons name="close" size={20} color={palette.textMutedColor} />
                    </TouchableOpacity>
                    <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>Simulator</Text>
                    <Text className={`text-[11px] ${palette.textMuted}`}>
                        {screens.length ? index + 1 : 0}/{screens.length}
                    </Text>
                </View>

                {!screen ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className={`text-[12px] ${palette.textSoft}`}>No screens to preview</Text>
                    </View>
                ) : (
                    <ScrollView className="flex-1 p-3" contentContainerStyle={{ paddingBottom: 24 }}>
                        <Text className={`mb-1 text-[16px] font-bold ${palette.text}`}>{screen.title || screen.id}</Text>

                        <View className="gap-2">
                            {(screen.children || []).map((child, childIndex) => (
                                <View key={child.id || childIndex} className="rounded-[14px] border p-3" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                    {['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'].includes(child.type) ? (
                                        <Text className={`text-[12px] ${child.type === 'TextCaption' ? palette.textSoft : palette.text}`}>
                                            {child.text}
                                        </Text>
                                    ) : child.type === 'Image' ? (
                                        <Text className={`text-[11px] ${palette.textSoft}`}>Image · {child.src}</Text>
                                    ) : (
                                        <>
                                            <Text className={`mb-1 text-[11px] font-bold ${palette.text}`}>
                                                {child.label || child.type}
                                                {child.required ? <Text className="text-red-500"> *</Text> : null}
                                            </Text>
                                            {child.helperText ? (
                                                <Text className={`mb-1 text-[10px] ${palette.textMuted}`}>{child.helperText}</Text>
                                            ) : null}
                                            {child.type === 'TextInput' ? (
                                                <TextInput
                                                    value={answers[child.name] || ''}
                                                    onChangeText={(text) => setAnswers((prev) => ({ ...prev, [child.name]: text }))}
                                                    placeholder={child.inputType === 'email' ? 'name@example.com' : 'Type here...'}
                                                    placeholderTextColor={palette.textMutedColor}
                                                    keyboardType={child.inputType === 'phone' ? 'phone-pad' : child.inputType === 'number' ? 'numeric' : 'default'}
                                                    className="rounded-[10px] border px-2 py-1.5 text-[12px]"
                                                    style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                                />
                                            ) : child.type === 'TextArea' ? (
                                                <TextInput
                                                    multiline
                                                    value={answers[child.name] || ''}
                                                    onChangeText={(text) => setAnswers((prev) => ({ ...prev, [child.name]: text }))}
                                                    placeholder="Type here..."
                                                    placeholderTextColor={palette.textMutedColor}
                                                    className="rounded-[10px] border px-2 py-1.5 text-[12px]"
                                                    style={{ color: palette.textColor, borderColor: palette.colors.border, minHeight: 56, textAlignVertical: 'top' }}
                                                />
                                            ) : ['Select', 'RadioButtons', 'CheckboxGroup'].includes(child.type) ? (
                                                <View className="gap-1">
                                                    {(child.options || []).map((option, optionIndex) => {
                                                        const selected = Array.isArray(answers[child.name])
                                                            ? answers[child.name].includes(option.value)
                                                            : answers[child.name] === option.value;
                                                        const icon = child.type === 'Select' ? 'chevron-down-circle-outline' : selected ? 'checkbox' : 'square-outline';
                                                        return (
                                                            <Text
                                                                key={optionIndex}
                                                                onPress={() =>
                                                                    setAnswers((prev) => ({
                                                                        ...prev,
                                                                        [child.name]:
                                                                            child.type === 'CheckboxGroup'
                                                                                ? selected
                                                                                    ? prev[child.name].filter((v) => v !== option.value)
                                                                                    : [...(prev[child.name] || []), option.value]
                                                                                : option.value
                                                                    }))
                                                                }
                                                                className="flex-row items-center gap-1.5 text-[12px]"
                                                                style={{ color: palette.textColor }}
                                                            >
                                                                <Ionicons name={icon} size={14} color={selected ? '#0284c7' : palette.textMutedColor} />
                                                                {option.label}
                                                            </Text>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <Text className={`text-[11px] ${palette.textSoft}`}>
                                                    {child.type === 'DatePicker' ? 'Date field' : 'Consent checkbox'}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                            ))}
                        </View>

                        <View className="mt-4 flex-row gap-2">
                            <KonnectxButton label="Back" icon="chevron-back" variant="secondary" className="flex-1" onPress={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} />
                            <KonnectxButton
                                label={screen.footerAction?.type === 'complete' ? 'Submit' : 'Next'}
                                icon="chevron-forward"
                                className="flex-1"
                                onPress={() => {
                                    if (screen.footerAction?.type === 'complete') {
                                        Toast.show({ type: 'success', text1: 'Flow complete', text2: JSON.stringify(answers) });
                                        onClose();
                                        return;
                                    }
                                    const targetId = screen.footerAction?.screen;
                                    const targetIndex = screens.findIndex((s) => s.id === targetId);
                                    setIndex(targetIndex >= 0 ? targetIndex : Math.min(index + 1, screens.length - 1));
                                }}
                            />
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}