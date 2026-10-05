import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../../_components/CrmHeader';
import DealCard from '../../_components/DealCard';
import ContactCard from '../../_components/ContactCard';
import QuickWhatsAppModal from '../../_components/QuickWhatsAppModal';
import * as crmService from '~/services/crm';

export default function AccountDetailScreen() {
  const { accountId } = useLocalSearchParams();
  const router = useRouter();
  const { openCreateDeal, openCreateContact, refreshAll } = useCrm();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccount = useCallback(async () => {
    if (!accountId) return;
    try {
      const res = await crmService.getAccount(accountId);
      if (res.success && res.data) {
        setAccount(res.data);
      }
    } catch (e) {
      console.warn('Failed to load account:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccount();
    refreshAll();
  };

  if (loading && !account) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-xs text-slate-400 font-semibold mt-2">Loading Company Sheet...</Text>
      </SafeAreaView>
    );
  }

  if (!account) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <CrmHeader title="Account Sheet" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold text-slate-700">Account Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const deals = account.deals || [];
  const contacts = account.contacts || [];
  const totalAccountValue = deals
    .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    .toLocaleString('en-IN');

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <CrmHeader
        title={account.name}
        subtitle={`${account.industry || 'General Industry'} • ${account.size || '1-50'}`}
        showBack={true}
      />

      <QuickWhatsAppModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="px-4 pt-3.5"
      >
        {/* Account Summary Card */}
        <View className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm mb-3.5">
          <View className="flex-row items-center gap-x-3.5">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 border border-indigo-200">
              <Ionicons name="business" size={24} color="#4f46e5" />
            </View>

            <View className="flex-1">
              <Text className="text-base font-black text-slate-900">{account.name}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {account.industry || 'Enterprise Client'} • {account.size || '11-50 Employees'}
              </Text>
              {account.website && (
                <Pressable onPress={() => Linking.openURL(`https://${account.website.replace(/^https?:\/\//, '')}`)}>
                  <Text className="text-xs font-semibold text-indigo-600 mt-1">{account.website}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Aggregate Metrics */}
          <View className="mt-3.5 flex-row justify-between gap-x-2 pt-3 border-t border-slate-100">
            <View className="flex-1 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
              <Text className="text-[10px] font-bold text-slate-400">Total Deals</Text>
              <Text className="text-base font-black text-slate-900 mt-0.5">{deals.length}</Text>
            </View>

            <View className="flex-1 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
              <Text className="text-[10px] font-bold text-slate-400">Pipeline Value</Text>
              <Text className="text-base font-black text-indigo-700 mt-0.5">₹ {totalAccountValue}</Text>
            </View>

            <View className="flex-1 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
              <Text className="text-[10px] font-bold text-slate-400">Contacts</Text>
              <Text className="text-base font-black text-slate-900 mt-0.5">{contacts.length}</Text>
            </View>
          </View>
        </View>

        {/* Contacts in Account */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
            Team Contacts ({contacts.length})
          </Text>
          <Pressable onPress={openCreateContact}>
            <Text className="text-xs font-bold text-indigo-600">+ Add Contact</Text>
          </Pressable>
        </View>

        {contacts.length > 0 ? (
          contacts.map((c) => <ContactCard key={c.id} contact={c} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-5 items-center justify-center bg-white mb-3.5">
            <Text className="text-xs text-slate-500 font-semibold">No contacts linked to this account yet.</Text>
          </View>
        )}

        {/* Deals in Account */}
        <View className="mt-3 mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
            Commercial Deals ({deals.length})
          </Text>
          <Pressable onPress={openCreateDeal}>
            <Text className="text-xs font-bold text-indigo-600">+ New Deal</Text>
          </Pressable>
        </View>

        {deals.length > 0 ? (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-5 items-center justify-center bg-white mb-3.5">
            <Text className="text-xs text-slate-500 font-semibold">No opportunities registered under this account.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
