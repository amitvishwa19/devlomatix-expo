import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import IosConfirmModal from '~/components/IosConfirmModal';
import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { KonnectxButton, KonnectxSection } from '~/components/konnectx/KonnectxBadge';
import KonnectxField from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as credentialsService from '~/services/konnectx/credentials';
import { useAppTheme } from '~/theme/AppTheme';

const EMPTY_FORM = { id: null, profile: '', phoneNumberId: '', wabaId: '', accessToken: '' };

/** WhatsApp Cloud accounts: create, test, promote to default, remove. */
export default function AccountsScreen() {
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const load = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await credentialsService.getCredentials(userId);
            setAccounts(Array.isArray(data) ? data : data?.credentials ?? []);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
    }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (account) => {
        // The token is never echoed back into the form; leaving it blank keeps
        // the stored value on save.
        setForm({
            id: account.id,
            profile: account.profile || account.name || '',
            phoneNumberId: account.phoneNumberId || '',
            wabaId: account.wabaId || '',
            accessToken: ''
        });
        setShowForm(true);
    };

    const handleSave = useCallback(async () => {
        if (!form.phoneNumberId.trim() || !form.wabaId.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Phone number ID and WABA ID are required' });
            return;
        }
        if (!form.id && !form.accessToken.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Access token is required for a new account' });
            return;
        }

        try {
            setSaving(true);
            await credentialsService.saveCredential(userId, {
                id: form.id || undefined,
                profile: form.profile.trim(),
                phoneNumberId: form.phoneNumberId.trim(),
                wabaId: form.wabaId.trim(),
                accessToken: form.accessToken.trim()
            });
            Toast.show({ type: 'success', text1: form.id ? 'Account updated' : 'Account added' });
            setShowForm(false);
            load();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setSaving(false);
        }
    }, [form, load, userId]);

    const handleTest = useCallback(async () => {
        try {
            setTesting(true);
            const response = await credentialsService.testCredential({
                phoneNumberId: form.phoneNumberId.trim(),
                accessToken: form.accessToken.trim()
            });
            const result = response?.data || response;
            Toast.show({
                type: result?.success ? 'success' : 'error',
                text1: result?.success ? 'Connection OK' : 'Connection failed',
                text2: result?.message || result?.error
            });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Test failed', text2: err?.response?.data?.error || err.message });
        } finally {
            setTesting(false);
        }
    }, [form]);

    const handleSetDefault = useCallback(async (account) => {
        try {
            await credentialsService.setDefaultCredential(userId, account.id);
            Toast.show({ type: 'success', text1: 'Default account updated' });
            load();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        }
    }, [load, userId]);

    const handleDelete = useCallback(async () => {
        if (!deleteTargetId) return;
        const id = deleteTargetId;
        try {
            await credentialsService.deleteCredential(userId, id);
            setAccounts((prev) => prev.filter((account) => account.id !== id));
            Toast.show({ type: 'success', text1: 'Account removed' });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setDeleteTargetId(null);
        }
    }, [deleteTargetId, userId]);

    return (
        <KonnectxScreen
            title="Accounts"
            subtitle={`${accounts.length} connected`}
            actionLabel="Add"
            onAction={openCreate}
            onRefresh={onRefresh}
            refreshing={refreshing}>
            {loading ? (
                <SkeletonCard />
            ) : accounts.length === 0 ? (
                <KonnectxEmptyState
                    icon="cloud-offline-outline"
                    title="No WhatsApp accounts"
                    description="Connect a Meta WhatsApp Cloud account to start sending."
                    ctaLabel="Add account"
                    onCtaPress={openCreate}
                />
            ) : (
                <View className="gap-2">
                    {accounts.map((account) => (
                        <View
                            key={account.id}
                            className="rounded-[16px] border p-3"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                            <View className="flex-row items-center justify-between gap-2">
                                <View className="flex-1">
                                    <Text className={`text-[14px] font-bold ${palette.text}`} numberOfLines={1}>
                                        {account.profile || account.name || 'WhatsApp account'}
                                    </Text>
                                    <Text className={`text-[10px] ${palette.textSoft}`} numberOfLines={1}>
                                        WABA {account.wabaId || '—'}
                                    </Text>
                                    <Text className={`text-[10px] ${palette.textMuted}`} numberOfLines={1}>
                                        Phone {account.phoneNumberId || '—'}
                                    </Text>
                                </View>
                                <KonnectxBadge
                                    label={account.isDefault ? 'Default' : account.status || 'Connected'}
                                    tone={account.isDefault ? 'success' : 'info'}
                                />
                            </View>

                            <View className="mt-2 flex-row flex-wrap gap-1.5">
                                <TouchableOpacity
                                    onPress={() => openEdit(account)}
                                    className="flex-row items-center gap-1 rounded-[12px] border px-2.5 py-1"
                                    style={{ borderColor: palette.colors.border }}>
                                    <Ionicons name="create-outline" size={12} color={palette.textMutedColor} />
                                    <Text className={`text-[11px] font-semibold ${palette.text}`}>Edit</Text>
                                </TouchableOpacity>

                                {!account.isDefault ? (
                                    <TouchableOpacity
                                        onPress={() => handleSetDefault(account)}
                                        className="flex-row items-center gap-1 rounded-[12px] border px-2.5 py-1"
                                        style={{ borderColor: palette.colors.border }}>
                                        <Ionicons name="star-outline" size={12} color="#16a34a" />
                                        <Text className="text-[11px] font-semibold text-green-600">Make default</Text>
                                    </TouchableOpacity>
                                ) : null}

                                <TouchableOpacity
                                    onPress={() => setDeleteTargetId(account.id)}
                                    className="flex-row items-center gap-1 rounded-[12px] border px-2.5 py-1"
                                    style={{ borderColor: palette.colors.border }}>
                                    <Ionicons name="trash-outline" size={12} color="#dc2626" />
                                    <Text className="text-[11px] font-semibold text-red-600">Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={10}>
                            <Ionicons name="chevron-back" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>
                            {form.id ? 'Edit account' : 'Add account'}
                        </Text>
                    </View>

                    <ScrollView className="flex-1 px-3 py-3" contentContainerStyle={{ paddingBottom: 40 }}>
                        <KonnectxSection title="Cloud API credentials">
                            <KonnectxField
                                label="Profile name"
                                value={form.profile}
                                onChangeText={(profile) => setForm((prev) => ({ ...prev, profile }))}
                                placeholder="Main store"
                            />
                            <KonnectxField
                                label="Phone number ID"
                                required
                                value={form.phoneNumberId}
                                onChangeText={(phoneNumberId) => setForm((prev) => ({ ...prev, phoneNumberId }))}
                                placeholder="123456789012345"
                            />
                            <KonnectxField
                                label="WABA ID"
                                required
                                value={form.wabaId}
                                onChangeText={(wabaId) => setForm((prev) => ({ ...prev, wabaId }))}
                                placeholder="987654321098765"
                            />
                            <KonnectxField
                                label="Permanent access token"
                                required={!form.id}
                                value={form.accessToken}
                                onChangeText={(accessToken) => setForm((prev) => ({ ...prev, accessToken }))}
                                placeholder={form.id ? 'Leave blank to keep the stored token' : 'EAAG...'}
                                secureTextEntry
                                hint={form.id ? 'Leave blank to keep the current token' : 'Stored encrypted, never shown again'}
                            />
                        </KonnectxSection>

                        <View className="gap-2">
                            <KonnectxButton label="Save account" icon="save-outline" loading={saving} onPress={handleSave} />
                            <KonnectxButton
                                label="Test connection"
                                icon="pulse-outline"
                                variant="secondary"
                                loading={testing}
                                disabled={!form.accessToken.trim()}
                                onPress={handleTest}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <IosConfirmModal
                visible={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDelete}
                title="Remove account?"
                message="Messages sent from this account will no longer work. This cannot be undone."
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive
            />
        </KonnectxScreen>
    );
}