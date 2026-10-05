import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import IosConfirmModal from '~/components/IosConfirmModal';
import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { KonnectxButton } from '~/components/konnectx/KonnectxBadge';
import KonnectxField from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as settingsService from '~/services/konnectx/settings';
import { useAppTheme } from '~/theme/AppTheme';

const CATEGORIES = ['GENERAL', 'PRODUCTS', 'SUPPORT', 'SHIPPING', 'RETURNS', 'PRICING'];
const EMPTY_FORM = { id: null, name: '', category: 'GENERAL', description: '', content: '' };

/**
 * Knowledge base documents.
 *
 * These are what the AI Agent node (`aiAgent` in the chatbot builder) and the
 * product catalogue assistant ground their answers in, so keeping them
 * editable from the phone is the point of this screen.
 */
export default function DocsScreen() {
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [docs, setDocs] = useState([]);
    const [category, setCategory] = useState('ALL');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const load = useCallback(async () => {
        try {
            const data = await settingsService.getDocs(category === 'ALL' ? undefined : category);
            const rows = Array.isArray(data) ? data : data?.documents ?? [];
            setDocs(rows);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [category]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
    }, [load]);

    const filtered = docs.filter((doc) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
            (doc.name || '').toLowerCase().includes(term) ||
            (doc.description || '').toLowerCase().includes(term) ||
            (doc.content || '').toLowerCase().includes(term)
        );
    });

    const handleSave = useCallback(async () => {
        if (!form.name.trim() || !form.content.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Title and content are required' });
            return;
        }

        try {
            setSaving(true);
            await settingsService.saveDoc(userId, {
                id: form.id || undefined,
                name: form.name.trim(),
                description: form.description.trim() || null,
                category: form.category,
                content: form.content.trim()
            });
            Toast.show({ type: 'success', text1: form.id ? 'Document updated' : 'Document added' });
            setForm(null);
            load();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setSaving(false);
        }
    }, [form, load, userId]);

    const handleDelete = useCallback(async () => {
        if (!deleteTargetId) return;
        const id = deleteTargetId;
        try {
            await settingsService.deleteDoc(id);
            setDocs((prev) => prev.filter((doc) => doc.id !== id));
            Toast.show({ type: 'success', text1: 'Document deleted' });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setDeleteTargetId(null);
        }
    }, [deleteTargetId]);

    return (
        <KonnectxScreen
            title="Knowledge Base"
            subtitle={`${filtered.length} document${filtered.length === 1 ? '' : 's'}`}
            actionLabel="Add"
            onAction={() => setForm({ ...EMPTY_FORM })}
            onRefresh={onRefresh}
            refreshing={refreshing}>
            <KonnectxField
                icon="search"
                placeholder="Search documents"
                value={search}
                onChangeText={setSearch}
                className="mb-2"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
                {['ALL', ...CATEGORIES].map((option) => (
                    <TouchableOpacity
                        key={option}
                        onPress={() => setCategory(option)}
                        className="rounded-full border px-2.5 py-1"
                        style={{
                            backgroundColor: category === option ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                            borderColor: category === option ? '#0284c7' : palette.colors.border
                        }}>
                        <Text
                            className="text-[11px] font-bold"
                            style={{ color: category === option ? '#0284c7' : palette.textColor }}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <SkeletonCard />
            ) : filtered.length === 0 ? (
                <KonnectxEmptyState
                    icon="book-outline"
                    title="No documents"
                    description="Add product, shipping or policy documents so your AI agent can answer accurately."
                    ctaLabel="Add document"
                    onCtaPress={() => setForm({ ...EMPTY_FORM })}
                />
            ) : (
                <View className="gap-2">
                    {filtered.map((doc) => (
                        <TouchableOpacity
                            key={doc.id}
                            onPress={() =>
                                setForm({
                                    id: doc.id,
                                    name: doc.name || '',
                                    category: doc.category || 'GENERAL',
                                    description: doc.description || '',
                                    content: doc.content || ''
                                })
                            }
                            className="rounded-[16px] border p-3"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                            <View className="flex-row items-start justify-between gap-2">
                                <View className="flex-1">
                                    <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                                        {doc.name}
                                    </Text>
                                    {doc.description ? (
                                        <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`} numberOfLines={2}>
                                            {doc.description}
                                        </Text>
                                    ) : null}
                                    <Text className={`mt-1 text-[10px] ${palette.textMuted}`} numberOfLines={2}>
                                        {(doc.content || '').slice(0, 120)}
                                    </Text>
                                </View>
                                <KonnectxBadge label={doc.category || 'GENERAL'} tone="info" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Modal visible={!!form} animationType="slide" onRequestClose={() => setForm(null)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <TouchableOpacity onPress={() => setForm(null)} hitSlop={10}>
                            <Ionicons name="chevron-back" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>
                            {form?.id ? 'Edit document' : 'Add document'}
                        </Text>
                        {form?.id ? (
                            <TouchableOpacity onPress={() => setDeleteTargetId(form.id)} hitSlop={10}>
                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {form ? (
                        <ScrollView className="flex-1 px-3 py-3" contentContainerStyle={{ paddingBottom: 40 }}>
                            <View className="gap-2">
                                <KonnectxField
                                    label="Title"
                                    required
                                    value={form.name}
                                    onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
                                    placeholder="Shipping policy"
                                />

                                <View>
                                    <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                        Category
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                        {CATEGORIES.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => setForm((prev) => ({ ...prev, category: option }))}
                                                className="rounded-full border px-2.5 py-1"
                                                style={{
                                                    backgroundColor: form.category === option ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                                    borderColor: form.category === option ? '#0284c7' : palette.colors.border
                                                }}>
                                                <Text
                                                    className="text-[11px] font-bold"
                                                    style={{ color: form.category === option ? '#0284c7' : palette.textColor }}>
                                                    {option}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <KonnectxField
                                    label="Summary"
                                    value={form.description}
                                    onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
                                    placeholder="Short description shown in search results"
                                />

                                <KonnectxField
                                    label="Content"
                                    required
                                    multiline
                                    value={form.content}
                                    onChangeText={(content) => setForm((prev) => ({ ...prev, content }))}
                                    placeholder="Paste the policy, FAQ answer or product detail the AI should use."
                                    inputStyle={{ minHeight: 220 }}
                                />

                                <KonnectxButton label="Save document" icon="save-outline" loading={saving} onPress={handleSave} />
                            </View>
                        </ScrollView>
                    ) : null}
                </View>
            </Modal>

            <IosConfirmModal
                visible={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDelete}
                title="Delete document?"
                message="This document will no longer be available to the AI agent."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive
            />
        </KonnectxScreen>
    );
}