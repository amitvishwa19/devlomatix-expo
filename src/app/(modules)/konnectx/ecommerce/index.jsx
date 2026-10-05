import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxBadge, { KonnectxButton, KonnectxSection } from '~/components/konnectx/KonnectxBadge';
import { KonnectxChips, KonnectxField, KonnectxSwitchRow } from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import KonnectxModal from '~/components/konnectx/KonnectxModal';
import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxStatCard from '~/components/konnectx/KonnectxStatCard';
import { useAppTheme } from '~/theme/AppTheme';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as ecommerceService from '~/services/konnectx/ecommerce';
import { resolveWorkspaceId } from '~/utils/workspace';

const PLATFORMS = [
    { label: 'Shopify', value: 'shopify' },
    { label: 'WooCommerce', value: 'woocommerce' },
    { label: 'Manual', value: 'manual' }
];

const SECRET_FIELDS = {
    shopify: [
        { key: 'storeUrl', label: 'Store URL', placeholder: 'https://your-store.myshopify.com' },
        { key: 'accessToken', label: 'Admin access token', secure: true },
        { key: 'apiSecret', label: 'API secret', secure: true }
    ],
    woocommerce: [
        { key: 'storeUrl', label: 'Store URL', placeholder: 'https://your-store.com' },
        { key: 'apiKey', label: 'Consumer key', secure: true },
        { key: 'apiSecret', label: 'Consumer secret', secure: true }
    ],
    manual: [
        { key: 'storeUrl', label: 'Store URL', placeholder: 'https://your-store.com' }
    ]
};

const EMPTY_FORM = {
    id: null,
    name: '',
    platform: 'manual',
    storeUrl: '',
    description: '',
    currency: 'INR',
    isDefault: false,
    accessToken: '',
    apiKey: '',
    apiSecret: ''
};

export default function EcommerceScreen() {
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [stores, setStores] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [editorOpen, setEditorOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        resolveWorkspaceId()
            .then(setWorkspaceId)
            .catch(() => {});
    }, []);

    const load = useCallback(async () => {
        try {
            const result = await ecommerceService.getStores(userId, { workspaceId });
            setStores(result?.stores ?? []);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Could not load stores',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    }, [userId, workspaceId]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError(null);
        setEditorOpen(true);
    };

    const openEdit = (store) => {
        setForm({
            id: store.id,
            name: store.name ?? '',
            platform: store.platform ?? 'manual',
            storeUrl: store.storeUrl ?? '',
            description: store.description ?? '',
            currency: store.currency ?? 'INR',
            isDefault: !!store.isDefault,
            // Secrets are never returned by the API; leave blank to keep as-is.
            accessToken: '',
            apiKey: '',
            apiSecret: ''
        });
        setFormError(null);
        setEditorOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setFormError('Store name is required');
            return;
        }

        const body = {
            id: form.id ?? undefined,
            name: form.name.trim(),
            platform: form.platform,
            storeUrl: form.storeUrl.trim(),
            description: form.description.trim() || null,
            currency: form.currency,
            isDefault: form.isDefault,
            workspaceId
        };

        // Only send secrets the user actually typed, so an edit never wipes
        // credentials that the API deliberately does not return.
        for (const field of SECRET_FIELDS[form.platform] ?? []) {
            if (field.secure && form[field.key]?.trim()) {
                body[field.key] = form[field.key].trim();
            }
        }

        setBusy(true);
        try {
            const result = await ecommerceService.saveStore(userId, body);
            if (result?.data?.categoryError) {
                Toast.show({
                    type: 'info',
                    text1: 'Store saved',
                    text2: `Category not created: ${result.data.categoryError}`
                });
            } else {
                Toast.show({ type: 'success', text1: form.id ? 'Store updated' : 'Store created' });
            }
            setEditorOpen(false);
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Save failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (store) => {
        setBusy(true);
        try {
            await ecommerceService.deleteStore(userId, store.id);
            Toast.show({ type: 'success', text1: 'Store deleted' });
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const totals = stores.reduce(
        (acc, store) => {
            acc.products += store._count?.products ?? 0;
            acc.orders += store._count?.orders ?? 0;
            acc.abandoned += store._count?.abandonedCarts ?? 0;
            return acc;
        },
        { products: 0, orders: 0, abandoned: 0 }
    );

    return (
        <KonnectxScreen
            title="Stores"
            subtitle={`${stores.length} connected`}
            actionLabel="Add"
            onAction={openCreate}
            onRefresh={onRefresh}
            refreshing={refreshing}>
            <View className="mt-3 flex-row flex-wrap gap-2">
                <View className="w-[32%]">
                    <KonnectxStatCard label="Stores" value={String(stores.length)} tone={palette.skySoft} />
                </View>
                <View className="w-[32%]">
                    <KonnectxStatCard label="Products" value={String(totals.products)} tone={palette.successSoft} />
                </View>
                <View className="w-[32%]">
                    <KonnectxStatCard label="Orders" value={String(totals.orders)} tone={palette.amberSoft} />
                </View>
            </View>

            <View className="mt-3 gap-1.5">
                {loading ? (
                    <Text className={`py-6 text-center text-[12px] ${palette.textSoft}`}>Loading…</Text>
                ) : stores.length === 0 ? (
                    <KonnectxEmptyState
                        icon="storefront-outline"
                        title="No stores connected"
                        description="Link a Shopify, WooCommerce or manual store to sync products and orders."
                        ctaLabel="Add store"
                        onCtaPress={openCreate}
                    />
                ) : (
                    stores.map((store) => (
                        <View
                            key={store.id}
                            className={`rounded-[16px] border p-3 ${palette.surface} ${palette.border}`}>
                            <View className="flex-row items-center gap-2.5">
                                <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-teal-600/10">
                                    <Ionicons
                                        name={store.platform === 'woocommerce' ? 'cart-outline' : 'storefront-outline'}
                                        size={16}
                                        color="#0d9488"
                                    />
                                </View>

                                <View className="flex-1">
                                    <Text className={`text-[14px] font-bold ${palette.text}`} numberOfLines={1}>
                                        {store.name}
                                    </Text>
                                    <Text className={`text-[11px] ${palette.textSoft}`} numberOfLines={1}>
                                        {store.storeUrl || 'No URL set'}
                                    </Text>
                                </View>

                                <View className="items-end gap-1">
                                    <KonnectxBadge label={store.platform} tone="info" />
                                    {store.isDefault ? <KonnectxBadge label="Default" tone="success" /> : null}
                                </View>
                            </View>

                            <View className="mt-2 flex-row items-center gap-1.5">
                                <KonnectxBadge label={`${store._count?.products ?? 0} products`} />
                                <KonnectxBadge label={`${store._count?.orders ?? 0} orders`} />
                                {store._count?.abandonedCarts ? (
                                    <KonnectxBadge label={`${store._count.abandonedCarts} abandoned`} tone="warning" />
                                ) : null}
                                {store.hasAccessToken || store.hasApiKey ? (
                                    <KonnectxBadge label="Connected" tone="success" icon="lock-closed" />
                                ) : null}
                            </View>

                            <View className="mt-2 flex-row gap-2">
                                <KonnectxButton
                                    label="Edit"
                                    variant="secondary"
                                    icon="create-outline"
                                    className="flex-1"
                                    onPress={() => openEdit(store)}
                                />
                                <KonnectxButton
                                    label="Delete"
                                    variant="secondary"
                                    icon="trash-outline"
                                    className="flex-1"
                                    loading={busy}
                                    onPress={() => handleDelete(store)}
                                />
                            </View>
                        </View>
                    ))
                )}
            </View>

            <KonnectxModal
                visible={editorOpen}
                onClose={() => !busy && setEditorOpen(false)}
                title={form.id ? 'Edit store' : 'New store'}>
                <KonnectxField
                    label="Store name"
                    required
                    value={form.name}
                    onChangeText={(v) => setForm({ ...form, name: v })}
                    error={formError && !form.name.trim() ? formError : null}
                />

                <View className="mt-2">
                    <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                        Platform
                    </Text>
                    <KonnectxChips
                        options={PLATFORMS}
                        value={form.platform}
                        onChange={(v) => setForm({ ...form, platform: v })}
                    />
                </View>

                {(SECRET_FIELDS[form.platform] ?? []).map((field) => (
                    <KonnectxField
                        key={field.key}
                        className="mt-2"
                        label={field.label}
                        secureTextEntry={field.secure}
                        autoCapitalize="none"
                        placeholder={field.placeholder}
                        placeholderTextColor={palette.textMutedColor}
                        value={form[field.key]}
                        onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                        hint={
                            field.secure && form.id
                                ? 'Leave blank to keep the saved value'
                                : undefined
                        }
                    />
                ))}

                <KonnectxField
                    className="mt-2"
                    label="Description"
                    multiline
                    value={form.description}
                    onChangeText={(v) => setForm({ ...form, description: v })}
                />

                <KonnectxSwitchRow
                    className="mt-2"
                    label="Default store"
                    description="Used when picking a store for a campaign"
                    value={form.isDefault}
                    onValueChange={(v) => setForm({ ...form, isDefault: v })}
                />

                <View className="mt-3">
                    <KonnectxButton
                        label={form.id ? 'Save changes' : 'Create store'}
                        loading={busy}
                        onPress={handleSave}
                    />
                </View>
            </KonnectxModal>

            <View className="mt-2">
                <KonnectxSection title="How credentials are stored">
                    <Text className={`text-[11px] ${palette.textSoft}`}>
                        API keys and tokens are encrypted before they are written to the database and are
                        never returned to this app. Re-enter them here only if you need to rotate them.
                    </Text>
                </KonnectxSection>
            </View>
        </KonnectxScreen>
    );
}