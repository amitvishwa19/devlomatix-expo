import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useCrystalAura } from '~/providers/CrystalAuraProvider';
import CrystalAuraCard from '~/components/crystalaura/CrystalAuraCard';
import StoreCard from '~/components/crystalaura/StoreCard';
import { SkeletonCard } from '~/components/crystalaura/CrystalAuraLoadingSkeleton';
import * as storesService from '~/services/crystalaura/stores';

export default function CrystalAuraSettingsScreen() {
  const { palette } = useAppTheme();
  const { userId } = useCrystalAura();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [connectForm, setConnectForm] = useState({
    name: '', platform: 'shopify', storeUrl: '', apiKey: '', apiSecret: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const data = await storesService.getStores(userId);
      setStores(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleSync = async (store) => {
    setSyncing(store.id);
    try {
      await storesService.syncStore(userId, store.id);
      Toast.show({ type: 'success', text1: `${store.name} synced` });
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Sync failed', text2: err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = (store) => {
    Alert.alert('Disconnect Store', `Disconnect "${store.name}"? Data will stop syncing.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: async () => {
        await storesService.disconnectStore(userId, store.id);
        Toast.show({ type: 'info', text1: 'Store disconnected' });
        fetchData();
      }}
    ]);
  };

  const handleConnect = async () => {
    if (!connectForm.name.trim() || !connectForm.storeUrl.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Store name and URL are required' });
      return;
    }
    await storesService.connectStore(userId, connectForm);
    Toast.show({ type: 'success', text1: 'Store connected' });
    setShowConnect(false);
    setConnectForm({ name: '', platform: 'shopify', storeUrl: '', apiKey: '', apiSecret: '' });
    fetchData();
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <View className="mb-2 self-start rounded-full bg-purple-600 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">SETTINGS</Text>
            </View>
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Store Management</Text>
            <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>{stores.filter((s) => s.status === 'connected').length} connected</Text>
          </View>
          <TouchableOpacity onPress={() => setShowConnect(true)}
            className="flex-row items-center gap-2 rounded-full bg-purple-600 px-5 py-3">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-[13px] font-bold text-white">Connect</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
          {loading ? (
            <><SkeletonCard /><SkeletonCard /></>
          ) : stores.length > 0 ? (
            stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onSync={handleSync}
                onDisconnect={handleDisconnect} />
            ))
          ) : (
            <CrystalAuraCard title="No stores connected"
              description="Connect your Shopify or WooCommerce store to start managing products and orders." />
          )}

          <View className={`mt-6 rounded-[24px] border p-5 ${palette.surface} ${palette.border}`}>
            <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Quick Stats</Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className={`text-[13px] ${palette.textSoft}`}>Total Stores</Text>
                <Text className={`text-[15px] font-bold ${palette.text}`}>{stores.length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[13px] ${palette.textSoft}`}>Connected</Text>
                <Text className="text-[15px] font-bold text-green-600">{stores.filter((s) => s.status === 'connected').length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[13px] ${palette.textSoft}`}>Disconnected</Text>
                <Text className="text-[15px] font-bold text-red-500">{stores.filter((s) => s.status !== 'connected').length}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showConnect} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowConnect(false)}>
        <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>Connect Store</Text>
            <TouchableOpacity onPress={() => setShowConnect(false)} className="p-2">
              <Text className="text-[16px] font-bold text-purple-600">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6">
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Platform</Text>
            <View className="mb-4 flex-row gap-2">
              {['shopify', 'woocommerce'].map((p) => (
                <TouchableOpacity key={p} onPress={() => setConnectForm({ ...connectForm, platform: p })}
                  className={`flex-1 items-center rounded-xl py-3 ${connectForm.platform === p ? 'bg-purple-600' : 'border'}`}
                  style={connectForm.platform !== p ? { borderColor: palette.colors.border } : {}}>
                  <Ionicons name={p === 'shopify' ? 'bag-handle' : 'cart'} size={20}
                    color={connectForm.platform === p ? '#fff' : palette.textMutedColor} />
                  <Text className={`mt-1 text-[12px] font-bold ${connectForm.platform === p ? 'text-white' : palette.text}`}>
                    {p === 'shopify' ? 'Shopify' : 'WooCommerce'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Store Name *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="My Store" placeholderTextColor={palette.textMutedColor}
              value={connectForm.name} onChangeText={(v) => setConnectForm({ ...connectForm, name: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Store URL *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="https://mystore.myshopify.com" placeholderTextColor={palette.textMutedColor}
              value={connectForm.storeUrl} onChangeText={(v) => setConnectForm({ ...connectForm, storeUrl: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>API Key</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Optional" placeholderTextColor={palette.textMutedColor}
              value={connectForm.apiKey} onChangeText={(v) => setConnectForm({ ...connectForm, apiKey: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>API Secret</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Optional" placeholderTextColor={palette.textMutedColor}
              value={connectForm.apiSecret} onChangeText={(v) => setConnectForm({ ...connectForm, apiSecret: v })}
              secureTextEntry />

            <TouchableOpacity onPress={handleConnect}
              className="mb-8 items-center rounded-xl bg-purple-600 py-4 shadow-lg">
              <Text className="text-[16px] font-bold text-white">Connect Store</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
