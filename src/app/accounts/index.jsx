import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import CreateAccountModal from '../_components/CreateAccountModal';
import { useCrmTheme } from '~/utils/crm/colors';

const RATING_FILTERS = ['ALL', 'HOT', 'WARM', 'COLD'];

export default function AccountsDirectoryScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { accounts, loading, refreshing, refreshAll } = useCrm();

  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('ALL');
  const [createVisible, setCreateVisible] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const filteredAccounts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return accounts.filter((account) => {
      if (rating !== 'ALL' && account.rating !== rating) return false;
      if (!query) return true;
      return (
        (account.name || '').toLowerCase().includes(query) ||
        (account.domain || '').toLowerCase().includes(query) ||
        (account.industry || '').toLowerCase().includes(query) ||
        (account.city || '').toLowerCase().includes(query)
      );
    });
  }, [accounts, rating, deferredSearch]);

  const metrics = useMemo(() => {
    const total = accounts.length;
    const hot = accounts.filter((a) => a.rating === 'HOT').length;
    const contacts = accounts.reduce((sum, a) => sum + (a._count?.contacts ?? a.contacts?.length ?? 0), 0);
    const pipelineValue = accounts.reduce((sum, a) => {
      const deals = a.deals || [];
      return sum + deals.reduce((dealSum, d) => dealSum + (parseFloat(d.value) || 0), 0);
    }, 0);
    return { total, hot, contacts, pipelineValue };
  }, [accounts]);

  const ratingStyle = (value) => {
    if (value === 'HOT') return { bg: colors.dangerSoft, border: colors.dangerBorder, text: colors.danger };
    if (value === 'COLD') return { bg: colors.infoSoft, border: colors.infoBorder, text: colors.info };
    return { bg: colors.warningSoft, border: colors.warningBorder, text: colors.warning };
  };

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Companies"
        subtitle={`${accounts.length} Organizations • B2B Directory`}
        showBack={true}
        rightActions={
          <Pressable
            onPress={() => setCreateVisible(true)}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        }
      />

      <CreateAccountModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={() => setCreateVisible(false)}
      />

      <View className="px-3 pt-2.5 pb-2 border-b" style={{ backgroundColor: colors.header, borderColor: colors.border }}>
        <View
          className="flex-row items-center gap-x-2 rounded-xl px-3 py-2 border"
          style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, domain, industry, city..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs py-0.5"
            style={{ color: colors.text }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5 flex-row py-0.5">
          {RATING_FILTERS.map((filter) => {
            const selected = rating === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setRating(filter)}
                className="mr-1.5 rounded-xl px-3 py-1.5 border active:opacity-80"
                style={{
                  backgroundColor: selected ? colors.primary : colors.cardAlt,
                  borderColor: selected ? colors.primary : colors.border,
                }}
              >
                <Text className="text-[11px] font-bold" style={{ color: selected ? '#ffffff' : colors.text }}>
                  {filter === 'ALL' ? 'All Accounts' : filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
      >
        <View className="flex-row gap-x-2 mb-3">
          {[
            { label: 'Companies', value: metrics.total, accent: colors.primary },
            { label: 'Hot', value: metrics.hot, accent: colors.danger },
            { label: 'Contacts', value: metrics.contacts, accent: colors.success },
          ].map((metric) => (
            <View
              key={metric.label}
              className="flex-1 rounded-xl border p-2.5"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                {metric.label}
              </Text>
              <Text className="text-base font-bold mt-0.5" style={{ color: metric.accent }}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="rounded-xl border p-2.5 mb-3" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
            Pipeline Value Across Accounts
          </Text>
          <Text className="text-base font-bold mt-0.5" style={{ color: colors.primary }}>
            ₹ {metrics.pipelineValue.toLocaleString('en-IN')}
          </Text>
        </View>

        {loading && accounts.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              Loading companies...
            </Text>
          </View>
        ) : filteredAccounts.length > 0 ? (
          filteredAccounts.map((account) => {
            const contactsCount = account._count?.contacts ?? account.contacts?.length ?? 0;
            const dealsCount = account._count?.deals ?? account.deals?.length ?? 0;
            const dealsValue = (account.deals || []).reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
            const badge = ratingStyle(account.rating);

            return (
              <Pressable
                key={account.id}
                onPress={() => router.push(`/accounts/${account.id}`)}
                className="mb-2.5 rounded-2xl border p-3 active:opacity-85"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-x-3">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl border"
                    style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }}
                  >
                    <Ionicons name="business" size={20} color={colors.primary} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                        {account.name}
                      </Text>
                      {account.rating ? (
                        <View
                          className="rounded-full border px-2 py-0.5"
                          style={{ backgroundColor: badge.bg, borderColor: badge.border }}
                        >
                          <Text className="text-[9px] font-bold" style={{ color: badge.text }}>
                            {account.rating}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                      {[account.industry, account.size, account.city].filter(Boolean).join(' • ') || 'Company profile'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t" style={{ borderTopColor: colors.border }}>
                  <View className="flex-row items-center gap-x-3">
                    <View className="flex-row items-center gap-x-1">
                      <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                      <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                        {contactsCount} contacts
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-x-1">
                      <Ionicons name="funnel-outline" size={12} color={colors.textMuted} />
                      <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                        {dealsCount} deals
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                    ₹ {dealsValue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View
            className="rounded-2xl border border-dashed p-6 items-center justify-center"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons name="business-outline" size={32} color={colors.textSoft} />
            <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
              No Companies Found
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
              {search ? 'No companies match your query.' : 'Add your first B2B organization to get started.'}
            </Text>
            <Pressable
              onPress={() => setCreateVisible(true)}
              className="mt-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-white">+ Add Company</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
