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
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import ContactCard from '../_components/ContactCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import * as crmService from '~/services/crm';

export default function AccountDetailScreen() {
  const { accountId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
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
      <AppScreen style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
            Loading Company Sheet...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!account) {
    return (
      <AppScreen style={{ backgroundColor: colors.background }}>
        <CrmHeader title="Account Sheet" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Account Not Found
          </Text>
        </View>
      </AppScreen>
    );
  }

  const deals = account.deals || [];
  const contacts = account.contacts || [];
  const totalAccountValue = deals
    .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    .toLocaleString('en-IN');

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title={account.name}
        subtitle={`${account.industry || 'General Industry'} • ${account.size || '1-50'}`}
        showBack={true}
      />

      <QuickWhatsAppModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        className="px-3 pt-2.5"
      >
        {/* Account Summary Card */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-2.5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center gap-x-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Ionicons name="business" size={22} color={colors.primary} />
            </View>

            <View className="flex-1">
              <Text className="text-base font-black" style={{ color: colors.text }}>
                {account.name}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {account.industry || 'Enterprise Client'} • {account.size || '11-50 Employees'}
              </Text>
              {account.website && (
                <Pressable onPress={() => Linking.openURL(`https://${account.website.replace(/^https?:\/\//, '')}`)}>
                  <Text className="text-xs font-semibold mt-1" style={{ color: colors.primary }}>
                    {account.website}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Aggregate Metrics */}
          <View
            className="mt-3 flex-row justify-between gap-x-2 pt-2.5 border-t"
            style={{ borderTopColor: colors.border }}
          >
            <View
              className="flex-1 rounded-xl p-2.5 border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                Total Deals
              </Text>
              <Text className="text-sm font-black mt-0.5" style={{ color: colors.text }}>
                {deals.length}
              </Text>
            </View>

            <View
              className="flex-1 rounded-xl p-2.5 border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                Pipeline Value
              </Text>
              <Text className="text-sm font-black mt-0.5" style={{ color: colors.primary }}>
                ₹ {totalAccountValue}
              </Text>
            </View>

            <View
              className="flex-1 rounded-xl p-2.5 border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                Contacts
              </Text>
              <Text className="text-sm font-black mt-0.5" style={{ color: colors.text }}>
                {contacts.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Contacts in Account */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Team Contacts ({contacts.length})
          </Text>
          <Pressable onPress={openCreateContact}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              + Add Contact
            </Text>
          </Pressable>
        </View>

        {contacts.length > 0 ? (
          contacts.map((c) => <ContactCard key={c.id} contact={c} />)
        ) : (
          <View
            className="rounded-2xl border border-dashed p-4 items-center justify-center mb-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>
              No contacts linked to this account yet.
            </Text>
          </View>
        )}

        {/* Deals in Account */}
        <View className="mt-2.5 mb-2 flex-row items-center justify-between">
          <Text
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Commercial Deals ({deals.length})
          </Text>
          <Pressable onPress={openCreateDeal}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              + New Deal
            </Text>
          </Pressable>
        </View>

        {deals.length > 0 ? (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View
            className="rounded-2xl border border-dashed p-4 items-center justify-center mb-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>
              No opportunities registered under this account.
            </Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
