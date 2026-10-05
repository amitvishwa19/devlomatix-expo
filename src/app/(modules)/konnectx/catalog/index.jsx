import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxBadge, { KonnectxButton, KonnectxSection, statusTone } from '~/components/konnectx/KonnectxBadge';
import { KonnectxChips, KonnectxField, KonnectxSwitchRow } from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import KonnectxModal from '~/components/konnectx/KonnectxModal';
import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxStatCard from '~/components/konnectx/KonnectxStatCard';
import { useAppTheme } from '~/theme/AppTheme';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as catalogService from '~/services/konnectx/catalog';

const CURRENCY_OPTIONS = [
    { label: 'INR', value: 'INR' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
    { label: 'AED', value: 'AED' }
];

const EMPTY_FORM = {
    title: '',
    description: '',
    price: '',
    currency: 'INR',
    sku: '',
    inventoryCount: '',
    status: 'ACTIVE'
};

export default function CatalogScreen() {
    const { palette } = useAppTheme();
    const { userId, selectedCredential } = useKonnectx();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);

    const [search, setSearch] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({ is_catalog_visible: false, is_cart_enabled: false, catalog_id: '' });
    const [selectedCatalogId, setSelectedCatalogId] = useState(null);

    const load = useCallback(async () => {
        try {
            const result = await catalogService.getCatalog(userId);
            setData(result);
            setSettings({
                is_catalog_visible: !!result?.commerceSettings?.is_catalog_visible,
                is_cart_enabled: !!result?.commerceSettings?.is_cart_enabled,
                catalog_id: result?.commerceSettings?.catalog_id || result?.stats?.activeCatalogId || ''
            });
            setSelectedCatalogId(result?.stats?.activeCatalogId ?? null);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Could not load catalog',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        load();
    }, [load, selectedCredential?.id]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const products = (data?.products ?? []).filter((product) => {
        if (!search.trim()) return true;
        const needle = search.trim().toLowerCase();
        return (
            product.title?.toLowerCase().includes(needle) ||
            product.sku?.toLowerCase().includes(needle)
        );
    });

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setEditorOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setForm({
            title: product.title ?? '',
            description: product.description ?? '',
            price: product.price != null ? String(product.price) : '',
            currency: product.currency ?? 'INR',
            sku: product.sku ?? '',
            inventoryCount:
                product.inventoryCount != null ? String(product.inventoryCount) : '',
            status: product.status ?? 'ACTIVE'
        });
        setFormError(null);
        setEditorOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            setFormError('Title is required');
            return;
        }
        const price = Number(form.price);
        if (!Number.isFinite(price) || price < 0) {
            setFormError('Enter a valid price of 0 or more');
            return;
        }

        setBusy(true);
        try {
            const result = await catalogService.saveCatalogProduct(userId, {
                id: editing?.id,
                title: form.title.trim(),
                description: form.description.trim() || null,
                price,
                currency: form.currency,
                sku: form.sku.trim() || null,
                inventoryCount: form.inventoryCount === '' ? null : Number(form.inventoryCount),
                status: form.status
            });

            if (!result?.metaSynced && result?.metaError) {
                Toast.show({
                    type: 'info',
                    text1: 'Saved locally',
                    text2: `Meta sync failed: ${result.metaError}`
                });
            } else {
                Toast.show({ type: 'success', text1: editing ? 'Product updated' : 'Product created' });
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

    const handleDelete = async (product) => {
        try {
            await catalogService.deleteCatalogProduct(userId, product.id);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error?.response?.data?.error || error.message
            });
        }
    };

    const handleImport = async () => {
        setBusy(true);
        try {
            const result = await catalogService.importCatalog(userId, { catalogId: selectedCatalogId });
            Toast.show({
                type: 'success',
                text1: 'Catalog synced',
                text2: `${result?.data?.imported ?? 0} new, ${result?.data?.refreshed ?? 0} updated`
            });
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Sync failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const handleSaveSettings = async () => {
        setBusy(true);
        try {
            await catalogService.updateCommerceSettings(userId, settings);
            Toast.show({ type: 'success', text1: 'Commerce settings updated' });
            setSettingsOpen(false);
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const handleLink = async () => {
        if (!selectedCatalogId) return;
        setBusy(true);
        try {
            const result = await catalogService.linkCatalog(userId, {
                catalogId: selectedCatalogId,
                isCatalogVisible: true
            });
            if (result?.data?.settingsError) {
                Toast.show({
                    type: 'info',
                    text1: 'Catalog linked',
                    text2: `Visibility update failed: ${result.data.settingsError}`
                });
            } else {
                Toast.show({ type: 'success', text1: 'Catalog linked' });
            }
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Link failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const handleUnlink = async () => {
        setBusy(true);
        try {
            await catalogService.unlinkCatalog(userId, { catalogId: selectedCatalogId });
            Toast.show({ type: 'success', text1: 'Catalog hidden' });
            load();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Unlink failed',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setBusy(false);
        }
    };

    const stats = data?.stats ?? {};

    return (
        <KonnectxScreen
            title="Catalog"
            subtitle={data?.profile ? data.profile : 'WhatsApp products'}
            actionLabel="Add"
            onAction={openCreate}
            onRefresh={onRefresh}
            refreshing={refreshing}>
            {loading ? null : (
                <>
                    <View className="mb-3 flex-row flex-wrap gap-2">
                        <View className="w-[48%]">
                            <KonnectxStatCard label="Products" value={String(stats.totalProducts ?? 0)} tone={palette.skySoft} />
                        </View>
                        <View className="w-[48%]">
                            <KonnectxStatCard label="In stock" value={String(stats.inStockCount ?? 0)} tone={palette.successSoft} />
                        </View>
                    </View>

                    {!data?.hasCredentials ? (
                        <KonnectxEmptyState
                            icon="cloud-offline-outline"
                            title="No account connected"
                            description="Connect a WhatsApp Cloud account to sync a Meta product catalog."
                        />
                    ) : (
                        <>
                            <KonnectxSection
                                title="Meta catalog"
                                action={
                                    <TouchableOpacity onPress={() => setSettingsOpen(true)}>
                                        <Text className="text-[11px] font-bold text-sky-600">Settings</Text>
                                    </TouchableOpacity>
                                }>
                                {data?.metaCatalogs?.length ? (
                                    <KonnectxChips
                                        options={data.metaCatalogs.map((c) => ({
                                            label: `${c.name} (${c.product_count ?? 0})`,
                                            value: c.id
                                        }))}
                                        value={selectedCatalogId}
                                        onChange={setSelectedCatalogId}
                                    />
                                ) : (
                                    <Text className={`text-[12px] ${palette.textSoft}`}>
                                        No catalogs found on this account.
                                    </Text>
                                )}

                                <View className="mt-1 flex-row gap-2">
                                    <KonnectxButton
                                        label="Link"
                                        icon="link"
                                        variant="secondary"
                                        className="flex-1"
                                        disabled={!selectedCatalogId}
                                        loading={busy}
                                        onPress={handleLink}
                                    />
                                    <KonnectxButton
                                        label="Sync"
                                        icon="sync"
                                        className="flex-1"
                                        disabled={!selectedCatalogId}
                                        loading={busy}
                                        onPress={handleImport}
                                    />
                                    <KonnectxButton
                                        label="Hide"
                                        icon="eye-off"
                                        variant="secondary"
                                        className="flex-1"
                                        loading={busy}
                                        onPress={handleUnlink}
                                    />
                                </View>

                                {settings.is_catalog_visible ? (
                                    <KonnectxBadge label="Visible on WhatsApp" tone="success" icon="eye" />
                                ) : (
                                    <KonnectxBadge label="Hidden on WhatsApp" tone="warning" icon="eye-off" />
                                )}
                            </KonnectxSection>
                        </>
                    )}

                    <KonnectxSection title="Products">
                        <KonnectxField
                            icon="search"
                            placeholder="Search products"
                            value={search}
                            onChangeText={setSearch}
                        />

                        {products.length === 0 ? (
                            <Text className={`py-6 text-center text-[12px] ${palette.textSoft}`}>
                                {search ? 'No products match your search.' : 'No products yet.'}
                            </Text>
                        ) : (
                            products.map((product) => {
                                const image = Array.isArray(product.imageUrls) ? product.imageUrls[0] : null;
                                return (
                                    <View
                                        key={product.id}
                                        className={`flex-row items-center gap-2.5 rounded-[14px] border p-2 ${palette.surfaceAlt} ${palette.border}`}>
                                        {image ? (
                                            <Image
                                                source={{ uri: image }}
                                                className="h-10 w-10 rounded-[10px]"
                                            />
                                        ) : (
                                            <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-sky-600/10">
                                                <Ionicons name="cube-outline" size={17} color="#0284c7" />
                                            </View>
                                        )}

                                        <View className="flex-1">
                                            <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                                                {product.title}
                                            </Text>
                                            <Text className={`text-[11px] ${palette.textSoft}`}>
                                                {product.currency} {Number(product.price ?? 0).toLocaleString()}
                                                {product.sku ? ` · ${product.sku}` : ''}
                                            </Text>
                                        </View>

                                        <View className="items-end gap-1">
                                            <KonnectxBadge label={product.status} tone={statusTone(product.status)} />
                                            <View className="flex-row gap-2">
                                                <TouchableOpacity onPress={() => openEdit(product)} hitSlop={8}>
                                                    <Ionicons name="create-outline" size={15} color="#0284c7" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(product)} hitSlop={8}>
                                                    <Ionicons name="trash-outline" size={15} color="#dc2626" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </KonnectxSection>
                </>
            )}

            <KonnectxModal
                visible={editorOpen}
                onClose={() => !busy && setEditorOpen(false)}
                title={editing ? 'Edit product' : 'New product'}>
                <KonnectxField
                    label="Title"
                    required
                    value={form.title}
                    onChangeText={(v) => setForm({ ...form, title: v })}
                    error={formError && !form.title.trim() ? 'Title is required' : null}
                />
                <KonnectxField
                    label="Description"
                    multiline
                    value={form.description}
                    onChangeText={(v) => setForm({ ...form, description: v })}
                    className="mt-2"
                />
                <View className="mt-2 flex-row gap-2">
                    <KonnectxField
                        label="Price"
                        required
                        keyboardType="decimal-pad"
                        className="flex-1"
                        value={form.price}
                        onChangeText={(v) => setForm({ ...form, price: v })}
                        error={formError && form.title.trim() ? formError : null}
                    />
                    <KonnectxField
                        label="Stock"
                        keyboardType="number-pad"
                        className="flex-1"
                        value={form.inventoryCount}
                        onChangeText={(v) => setForm({ ...form, inventoryCount: v })}
                    />
                </View>
                <View className="mt-2">
                    <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                        Currency
                    </Text>
                    <KonnectxChips options={CURRENCY_OPTIONS} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
                </View>
                <KonnectxField
                    label="SKU"
                    className="mt-2"
                    value={form.sku}
                    onChangeText={(v) => setForm({ ...form, sku: v })}
                />
                <View className="mt-3">
                    <KonnectxButton label={editing ? 'Save changes' : 'Create product'} loading={busy} onPress={handleSave} />
                </View>
            </KonnectxModal>

            <KonnectxModal
                visible={settingsOpen}
                onClose={() => !busy && setSettingsOpen(false)}
                title="Commerce settings">
                <KonnectxSwitchRow
                    label="Show catalog in chat"
                    description="Adds the catalog bubble to your WhatsApp profile"
                    value={settings.is_catalog_visible}
                    onValueChange={(v) => setSettings({ ...settings, is_catalog_visible: v })}
                />
                <KonnectxSwitchRow
                    label="Enable cart"
                    description="Lets customers build a cart before checkout"
                    className="mt-2"
                    value={settings.is_cart_enabled}
                    onValueChange={(v) => setSettings({ ...settings, is_cart_enabled: v })}
                />
                <View className="mt-3">
                    <KonnectxButton label="Save settings" loading={busy} onPress={handleSaveSettings} />
                </View>
            </KonnectxModal>
        </KonnectxScreen>
    );
}