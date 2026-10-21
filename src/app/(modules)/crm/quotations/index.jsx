import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import QuotationCard from '../_components/QuotationCard';
import SendQuotationModal from '../_components/SendQuotationModal';
import * as quotationService from '~/services/quotation';
import { printOrShareQuotationPdf } from '~/services/quotationPdf';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SENT', label: 'Sent' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'DECLINED', label: 'Declined' },
];

export default function QuotationsDirectoryScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sendModalQuotation, setSendModalQuotation] = useState(null);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await quotationService.getQuotations();
      if (res?.data?.quotations) {
        setQuotations(res.data.quotations);
      } else if (Array.isArray(res?.data)) {
        setQuotations(res.data);
      } else if (Array.isArray(res)) {
        setQuotations(res);
      }
    } catch (err) {
      console.warn('Error fetching quotations:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotations();
  };

  const metrics = quotationService.computeQuotationMetrics(quotations);

  const filteredQuotations = quotations.filter((q) => {
    if (selectedStatus !== 'ALL') {
      if ((q.status || '').toUpperCase() !== selectedStatus) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchNum = (q.quotationNumber || '').toLowerCase().includes(query);
      const matchClient = (q.clientName || q.data?.client?.name || '').toLowerCase().includes(query);
      const matchTitle = (q.data?.quotation?.title || '').toLowerCase().includes(query);
      if (!matchNum && !matchClient && !matchTitle) return false;
    }
    return true;
  });

  return (
    <AppScreen>
      <CrmHeader
        title="Quotations"
        subtitle={`${quotations.length} Proposals • Commercial Engine`}
        showBack={true}
        rightActions={
          <Pressable
            onPress={() => router.push('/(modules)/crm/quotations/new')}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Create</Text>
          </Pressable>
        }
      />

      <SendQuotationModal
        quotation={sendModalQuotation}
        visible={!!sendModalQuotation}
        onClose={() => setSendModalQuotation(null)}
        onSent={loadQuotations}
      />

      {/* KPI Cards Strip */}
      <View
        className="px-3 py-2.5 border-b"
        style={{
          backgroundColor: colors.header,
          borderColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between gap-x-2">
          {/* Total Quoted */}
          <View
            className="flex-1 rounded-xl p-2 border"
            style={{
              backgroundColor: colors.kpi.blue.bg,
              borderColor: colors.kpi.blue.border,
            }}
          >
            <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.kpi.blue.text }}>
              Total Quoted
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.kpi.blue.text }} numberOfLines={1}>
              ₹ {metrics.totalValue.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Won / Accepted */}
          <View
            className="flex-1 rounded-xl p-2 border"
            style={{
              backgroundColor: colors.kpi.green.bg,
              borderColor: colors.kpi.green.border,
            }}
          >
            <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.kpi.green.text }}>
              Won ({metrics.acceptedCount})
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.kpi.green.text }} numberOfLines={1}>
              ₹ {metrics.acceptedValue.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Pending / Sent */}
          <View
            className="flex-1 rounded-xl p-2 border"
            style={{
              backgroundColor: colors.kpi.amber.bg,
              borderColor: colors.kpi.amber.border,
            }}
          >
            <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.kpi.amber.text }}>
              Pending ({metrics.sentValue > 0 ? quotations.filter((q) => q.status === 'sent').length : 0})
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.kpi.amber.text }} numberOfLines={1}>
              ₹ {metrics.sentValue.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View
          className="mt-2.5 flex-row items-center gap-x-2 rounded-xl px-3.5 py-2.5 min-h-[46px] border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by quote #, client name, title..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs py-1"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 10 }}
          className="mt-2 flex-row py-0.5"
        >
          {STATUS_FILTERS.map((f) => {
            const isSelected = selectedStatus === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedStatus(f.id)}
                className="mr-1.5 rounded-lg px-2.5 py-1 border"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{
                    color: isSelected ? '#ffffff' : colors.text,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Quotations List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-xs font-semibold" style={{ color: colors.textMuted }}>
            Loading Quotations...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuotations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QuotationCard
              quotation={item}
              onSendWhatsApp={(q) => setSendModalQuotation(q)}
              onSharePdf={(q) => printOrShareQuotationPdf(q, null, 'share')}
            />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl border mb-3"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
              </View>
              <Text className="text-sm font-bold text-center" style={{ color: colors.text }}>
                {searchQuery || selectedStatus !== 'ALL' ? 'No Matching Quotations' : 'No Quotations Yet'}
              </Text>
              <Text className="mt-1 text-xs text-center leading-relaxed" style={{ color: colors.textMuted }}>
                {searchQuery || selectedStatus !== 'ALL'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Create your first commercial proposal with automated line items and WhatsApp dispatch.'}
              </Text>
              {!searchQuery && selectedStatus === 'ALL' && (
                <Pressable
                  onPress={() => router.push('/(modules)/crm/quotations/new')}
                  className="mt-4 px-4 py-2.5 rounded-xl flex-row items-center gap-x-1.5 active:opacity-80"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Create Quotation</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </AppScreen>
  );
}
