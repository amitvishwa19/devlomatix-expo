import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { KonnectxButton, KonnectxSection } from '~/components/konnectx/KonnectxBadge';
import KonnectxField, { KonnectxChips } from '~/components/konnectx/KonnectxField';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as chatbotsService from '~/services/konnectx/chatbots';
import { useAppTheme } from '~/theme/AppTheme';

import { getNodeGroups } from './_lib/nodeRegistry';
import {
    appendStep,
    describeStep,
    moveStep,
    stepsFromBot,
    stepsToPayload,
    updateStepData
} from './_lib/graph';

const CONDITIONS = [
    { name: 'Contains', value: 'contains' },
    { name: 'Equals', value: 'equals' },
    { name: 'Not equals', value: 'not_equals' },
    { name: 'Starts with', value: 'starts_with' },
    { name: 'Greater than', value: 'gt' },
    { name: 'Less than', value: 'lt' }
];

const NODE_TONE = {
    triggerNode: 'success',
    messageNode: 'info',
    logicNode: 'violet',
    actionNode: 'warning'
};

/**
 * Mobile-native chatbot flow editor.
 *
 * The desktop canvas is unusable on a phone, so this screen edits the same
 * `nodes` / `edges` graph as a linear step list: one card per step, explicit
 * reorder controls, and a property sheet driven by the shared node registry.
 */
export default function ChatbotBuilderScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [bot, setBot] = useState(null);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const [editingIndex, setEditingIndex] = useState(null);
    const [picking, setPicking] = useState(false);
    const [showJson, setShowJson] = useState(false);

    const load = useCallback(async () => {
        if (!userId || !id) return;
        try {
            setLoading(true);
            const data = await chatbotsService.getBot(userId, id);
            const record = data?.bot || data;
            setBot(record);
            setSteps(stepsFromBot(record));
            setDirty(false);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setLoading(false);
        }
    }, [userId, id]);

    useEffect(() => { load(); }, [load]);

    const mutate = useCallback((updater) => {
        setSteps((prev) => updater(prev));
        setDirty(true);
    }, []);

    const handleAdd = useCallback(
        (definition) => {
            mutate((prev) => appendStep(prev, definition));
            setPicking(false);
        },
        [mutate]
    );

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            const payload = stepsToPayload(steps);
            await chatbotsService.updateBot(userId, id, {
                name: bot?.name,
                description: bot?.description,
                active: bot?.active,
                ...payload
            });
            Toast.show({ type: 'success', text1: 'Flow saved' });
            setDirty(false);
            load();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setSaving(false);
        }
    }, [bot, id, load, steps, userId]);

    const nodeGroups = useMemo(() => getNodeGroups(), []);

    if (loading) {
        return (
            <KonnectxScreen title="Flow Builder" backTo="/(modules)/konnectx/(tabs)">
                <SkeletonCard />
                <SkeletonCard />
            </KonnectxScreen>
        );
    }

    const editing = editingIndex !== null ? steps[editingIndex] : null;
    const stats = bot?.executionStats;

    return (
        <KonnectxScreen
            title={bot?.name || 'Flow Builder'}
            subtitle={dirty ? 'Unsaved changes' : 'All changes saved'}
            backTo="/(modules)/konnectx/(tabs)"
            onAction={handleSave}
            actionLabel="Save"
            actionIcon="save-outline">
            <View className="mb-3 flex-row flex-wrap gap-1.5">
                <KonnectxBadge label={bot?.active ? 'Active' : 'Paused'} tone={bot?.active ? 'success' : 'warning'} icon="power" />
                <KonnectxBadge label={`${steps.length} steps`} tone="info" icon="layers-outline" />
                {stats?.total ? (
                    <KonnectxBadge
                        label={`${stats.successRate}% ok`}
                        tone={stats.successRate >= 80 ? 'success' : 'warning'}
                        icon="pulse-outline"
                    />
                ) : null}
            </View>

            <KonnectxSection
                title="Steps"
                action={
                    <TouchableOpacity onPress={() => setPicking(true)} className="flex-row items-center gap-1">
                        <Ionicons name="add-circle" size={15} color="#0284c7" />
                        <Text className="text-[11px] font-bold text-sky-600">Add step</Text>
                    </TouchableOpacity>
                }>
                {steps.length === 0 ? (
                    <View className="items-center gap-1 py-5">
                        <Ionicons name="git-branch-outline" size={22} color={palette.textMutedColor} />
                        <Text className={`text-[12px] ${palette.textMuted}`}>No steps yet</Text>
                        <Text className={`text-[11px] ${palette.textSoft}`}>Add a trigger to start the flow</Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {steps.map((step, index) => (
                            <TouchableOpacity
                                key={step.id}
                                onPress={() => setEditingIndex(index)}
                                className="flex-row items-center gap-2 rounded-[14px] border p-2"
                                style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border }}>
                                <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${step.definition.color}22` }}>
                                    <Ionicons name={step.definition.icon} size={14} color={step.definition.color} />
                                </View>

                                <View className="flex-1">
                                    <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                                        {step.data?.label || step.definition.displayName}
                                    </Text>
                                    <Text className={`text-[10px] ${palette.textSoft}`} numberOfLines={1}>
                                        {describeStep(step)}
                                    </Text>
                                </View>

                                <View className="items-end gap-0.5">
                                    <Text className="text-[9px] font-bold text-sky-600">#{index + 1}</Text>
                                    <View className="flex-row gap-1">
                                        <Ionicons name="chevron-forward" size={13} color={palette.textMutedColor} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </KonnectxSection>

            <View className="mb-3 flex-row gap-2">
                <KonnectxButton
                    label="Add step"
                    icon="add"
                    onPress={() => setPicking(true)}
                    className="flex-1"
                />
                <KonnectxButton
                    label="Logs"
                    icon="list-outline"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => router.push(`/konnectx/chatbot-builder/executions?id=${id}`)}
                />
            </View>

            <KonnectxButton
                label="View flow JSON"
                icon="code-slash-outline"
                variant="secondary"
                onPress={() => setShowJson(true)}
            />

            <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <Text className={`text-[15px] font-bold ${palette.text}`}>Add step</Text>
                        <TouchableOpacity onPress={() => setPicking(false)} hitSlop={10}>
                            <Ionicons name="close" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-3 py-3" contentContainerStyle={{ paddingBottom: 40 }}>
                        {nodeGroups.map((group) => (
                            <View key={group.group} className="mb-3">
                                <Text className={`mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                    {group.group}
                                </Text>
                                <View className="gap-2">
                                    {group.items.map((definition) => (
                                        <TouchableOpacity
                                            key={definition.name}
                                            onPress={() => handleAdd(definition)}
                                            className="flex-row items-center gap-2 rounded-[14px] border p-2.5"
                                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                            <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${definition.color}22` }}>
                                                <Ionicons name={definition.icon} size={16} color={definition.color} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className={`text-[13px] font-bold ${palette.text}`}>{definition.displayName}</Text>
                                                <Text className={`text-[10px] ${palette.textSoft}`} numberOfLines={2}>
                                                    {definition.description}
                                                </Text>
                                            </View>
                                            <Ionicons name="add-circle" size={18} color="#0284c7" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            <StepEditorModal
                step={editing}
                index={editingIndex}
                total={steps.length}
                visible={editingIndex !== null}
                onClose={() => setEditingIndex(null)}
                onChange={(patch) => mutate((prev) => updateStepData(prev, editingIndex, patch))}
                onMove={(delta) => mutate((prev) => moveStep(prev, editingIndex, delta))}
                onDelete={() => {
                    mutate((prev) => prev.filter((_, i) => i !== editingIndex));
                    setEditingIndex(null);
                }}
            />

            <Modal visible={showJson} animationType="slide" onRequestClose={() => setShowJson(false)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <Text className={`text-[15px] font-bold ${palette.text}`}>Flow JSON</Text>
                        <TouchableOpacity onPress={() => setShowJson(false)} hitSlop={10}>
                            <Ionicons name="close" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="flex-1 p-3">
                        <Text
                            selectable
                            className="text-[10px]"
                            style={{ color: palette.textColor, fontFamily: 'monospace' }}>
                            {JSON.stringify(stepsToPayload(steps), null, 2)}
                        </Text>
                    </ScrollView>
                </View>
            </Modal>
        </KonnectxScreen>
    );
}

/** Property sheet for a single step: registry-driven fields plus step controls. */
function StepEditorModal({ step, index, total, visible, onClose, onChange, onMove, onDelete }) {
    const { palette } = useAppTheme();

    if (!step) return null;

    const conditions = Array.isArray(step.data.conditions) ? step.data.conditions : [];

    const setCondition = (condIndex, patch) => {
        const next = conditions.map((condition, i) => (i === condIndex ? { ...condition, ...patch } : condition));
        onChange({ conditions: next });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                    <TouchableOpacity onPress={onClose} hitSlop={10}>
                        <Ionicons name="chevron-back" size={20} color={palette.textMutedColor} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className={`text-[15px] font-bold ${palette.text}`} numberOfLines={1}>
                            {step.definition.displayName}
                        </Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>Step {index + 1} of {total}</Text>
                    </View>
                    <KonnectxBadge label={step.definition.group} tone={NODE_TONE[step.definition.type] || 'neutral'} />
                </View>

                <ScrollView className="flex-1 px-3 py-3" contentContainerStyle={{ paddingBottom: 48 }}>
                    <Text className={`mb-2 text-[11px] ${palette.textSoft}`}>{step.definition.description}</Text>

                    <View className="mb-3 gap-2 rounded-[16px] border p-3" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                        <KonnectxField
                            label="Step name"
                            value={step.data?.label || ''}
                            onChangeText={(text) => onChange({ label: text })}
                            placeholder="Shown on the canvas"
                        />

                        {step.definition.properties.map((property) => {
                            if (property.type === 'options') {
                                return (
                                    <View key={property.name}>
                                        <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                            {property.displayName}
                                        </Text>
                                        <KonnectxChips
                                            options={(property.options || []).map((option) => ({
                                                label: option.name,
                                                value: option.value
                                            }))}
                                            value={step.data?.[property.name]}
                                            onChange={(value) => onChange({ [property.name]: value })}
                                        />
                                    </View>
                                );
                            }

                            if (property.type === 'conditions') {
                                return (
                                    <View key={property.name} className="gap-2">
                                        <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                            {property.displayName}
                                        </Text>

                                        {conditions.map((condition, condIndex) => (
                                            <View
                                                key={condition.id || `cond_${condIndex}`}
                                                className="gap-2 rounded-[14px] border p-2"
                                                style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surfaceAlt }}>
                                                <View className="flex-row items-center gap-1.5">
                                                    <TextInput
                                                        value={condition.label || ''}
                                                        onChangeText={(text) => setCondition(condIndex, { label: text })}
                                                        placeholder="Branch label"
                                                        placeholderTextColor={palette.textMutedColor}
                                                        className="flex-1 rounded-[10px] border px-2 py-1 text-[12px]"
                                                        style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                                    />
                                                    <TouchableOpacity
                                                        onPress={() => onChange({
                                                            conditions: conditions.filter((_, i) => i !== condIndex)
                                                        })}
                                                        hitSlop={8}>
                                                        <Ionicons name="trash-outline" size={15} color="#dc2626" />
                                                    </TouchableOpacity>
                                                </View>

                                                <View className="flex-row gap-1.5">
                                                    <TextInput
                                                        value={condition.variable || ''}
                                                        onChangeText={(text) => setCondition(condIndex, { variable: text })}
                                                        placeholder="Variable"
                                                        placeholderTextColor={palette.textMutedColor}
                                                        className="flex-1 rounded-[10px] border px-2 py-1 text-[12px]"
                                                        style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                                    />
                                                    <TextInput
                                                        value={condition.value || ''}
                                                        onChangeText={(text) => setCondition(condIndex, { value: text })}
                                                        placeholder="Value"
                                                        placeholderTextColor={palette.textMutedColor}
                                                        className="flex-1 rounded-[10px] border px-2 py-1 text-[12px]"
                                                        style={{ color: palette.textColor, borderColor: palette.colors.border }}
                                                    />
                                                </View>

                                                <KonnectxChips
                                                    options={CONDITIONS.map((option) => ({ label: option.name, value: option.value }))}
                                                    value={condition.operation}
                                                    onChange={(value) => setCondition(condIndex, { operation: value })}
                                                />
                                            </View>
                                        ))}

                                        <TouchableOpacity
                                            onPress={() =>
                                                onChange({
                                                    conditions: [
                                                        ...conditions,
                                                        {
                                                            id: `cond_${Date.now().toString(36)}`,
                                                            label: `Result ${conditions.length + 1}`,
                                                            variable: 'last_response',
                                                            operation: 'contains',
                                                            value: ''
                                                        }
                                                    ]
                                                })
                                            }
                                            className="flex-row items-center justify-center gap-1 rounded-[12px] border py-1.5"
                                            style={{ borderColor: palette.colors.border }}>
                                            <Ionicons name="add" size={14} color="#0284c7" />
                                            <Text className="text-[11px] font-bold text-sky-600">Add branch</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }

                            return (
                                <KonnectxField
                                    key={property.name}
                                    label={property.displayName}
                                    value={
                                        step.data?.[property.name] === undefined || step.data?.[property.name] === null
                                            ? ''
                                            : String(step.data[property.name])
                                    }
                                    onChangeText={(text) =>
                                        onChange({
                                            [property.name]:
                                                property.type === 'number' ? Number(text.replace(/[^0-9.]/g, '')) || 0 : text
                                        })
                                    }
                                    multiline={!!property.long}
                                    keyboardType={property.type === 'number' ? 'numeric' : 'default'}
                                />
                            );
                        })}
                    </View>

                    <View className="flex-row gap-2">
                        <KonnectxButton label="Move up" icon="arrow-up" variant="secondary" className="flex-1" onPress={() => onMove(-1)} disabled={index === 0} />
                        <KonnectxButton label="Move down" icon="arrow-down" variant="secondary" className="flex-1" onPress={() => onMove(1)} disabled={index >= total - 1} />
                    </View>

                    <View className="mt-2">
                        <KonnectxButton label="Delete step" icon="trash-outline" variant="danger" onPress={onDelete} />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}