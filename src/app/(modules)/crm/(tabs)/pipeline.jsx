import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateDealModal from '../_components/CreateDealModal';

export default function CrmPipelineTab() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const {
    pipelines,
    activePipeline,
    stages,
    deals,
    loading,
    refreshing,
    refreshAll,
    openCreateDeal,
  } = useCrm();

  const [selectedStageId, setSelectedStageId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    if (selectedStageId !== 'ALL' && deal.stageId !== selectedStageId) return false;
    if (priorityFilter !== 'ALL' && deal.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (deal.title || '').toLowerCase().includes(q);
      const matchContact = (deal.contact?.name || '').toLowerCase().includes(q);
      const matchAccount = (deal.account?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContact && !matchAccount) return false;
    }
    return true;
  });

  const totalFilteredValue = filteredDeals
    .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    .toLocaleString('en-IN');

  return (
    <AppScreen>
      <CrmHeader
        title="Deals Pipeline"
        subtitle={`${activePipeline?.name || 'Sales Funnel'} • ₹${totalFilteredValue}`}
        rightActions={
          <Pressable
            onPress={() => openCreateDeal(selectedStageId !== 'ALL' ? selectedStageId : null)}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Deal</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateDealModal />

      {/* Search and Priority Filter Header */}
      <View
        className="px-3 py-2 border-b"
        style={{
          backgroundColor: colors.header,
          borderColor: colors.border,
        }}
      >
        {/* Search Input */}
        <View
          className="flex-row items-center gap-x-2 rounded-xl px-3 py-2 border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search deals, contacts, companies..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Stage Tabs Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2 flex-row py-0.5"
        >
          {/* All Stages Tab */}
          <Pressable
            onPress={() => setSelectedStageId('ALL')}
            className="rounded-xl px-3 py-1.5 border flex-row items-center gap-x-1.5 mr-1.5"
            style={{
              backgroundColor: selectedStageId === 'ALL' ? colors.primary : colors.cardAlt,
              borderColor: selectedStageId === 'ALL' ? colors.primary : colors.border,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color: selectedStageId === 'ALL' ? '#ffffff' : colors.text,
              }}
            >
              All Stages ({deals.length})
            </Text>
          </Pressable>

          {/* Individual Stages */}
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stageId === stage.id);
            const stageVal = stageDeals
              .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
              .toLocaleString('en-IN');
            const isSelected = selectedStageId === stage.id;

            return (
              <Pressable
                key={stage.id}
                onPress={() => setSelectedStageId(stage.id)}
                className="rounded-xl px-3 py-1.5 border flex-row items-center gap-x-2 mr-1.5"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : stage.color || colors.primary }}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: isSelected ? '#ffffff' : colors.text }}
                >
                  {stage.name} ({stageDeals.length})
                </Text>
                <Text
                  className="text-[10px] font-semibold"
                  style={{
                    color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted,
                  }}
                >
                  ₹{stageVal}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Deals List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-3 pt-3"
      >
        {loading && deals.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              Loading pipeline deals...
            </Text>
          </View>
        ) : filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View
            className="rounded-[16px] border border-dashed p-6 items-center justify-center"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="funnel-outline" size={32} color={colors.textSoft} />
            <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
              No Deals Found
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
              {searchQuery ? 'No opportunities match your search filter.' : 'This stage currently has no active deals.'}
            </Text>
            <Pressable
              onPress={() => openCreateDeal(selectedStageId !== 'ALL' ? selectedStageId : null)}
              className="mt-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-white">+ Create Deal in this Stage</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

