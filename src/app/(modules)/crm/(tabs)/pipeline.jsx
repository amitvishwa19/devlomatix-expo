import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateDealModal from '../_components/CreateDealModal';

export default function CrmPipelineTab() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const {
    pipelines,
    activePipeline,
    setActivePipeline,
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
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl bg-indigo-600 active:bg-indigo-700"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Deal</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateDealModal />

      {/* Search and Priority Filter Header */}
      <View className={`${palette.surface} px-4 py-2.5 border-b ${palette.border}`}>
        {/* Search Input */}
        <View className={`flex-row items-center gap-x-2 rounded-xl ${palette.surfaceAlt} px-3 py-2 border ${palette.border}`}>
          <Ionicons name="search" size={16} color={palette.textMutedColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search deals, contacts, companies..."
            placeholderTextColor={palette.textMutedColor}
            className={`flex-1 text-xs ${palette.text}`}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={palette.textMutedColor} />
            </Pressable>
          )}
        </View>

        {/* Stage Tabs Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 flex-row gap-x-2 py-0.5"
        >
          {/* All Stages Tab */}
          <Pressable
            onPress={() => setSelectedStageId('ALL')}
            className={`rounded-xl px-3 py-2 border flex-row items-center gap-x-1.5 mr-1 ${
              selectedStageId === 'ALL'
                ? 'bg-indigo-600 border-indigo-600'
                : `${palette.surfaceAlt} ${palette.border} active:opacity-75`
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedStageId === 'ALL' ? 'text-white' : palette.text
              }`}
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
                className={`rounded-xl px-3 py-2 border flex-row items-center gap-x-2 mr-1 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : `${palette.surfaceAlt} ${palette.border} active:opacity-75`
                }`}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : stage.color || '#4f46e5' }}
                />
                <Text
                  className={`text-xs font-bold ${isSelected ? 'text-white' : palette.text}`}
                >
                  {stage.name} ({stageDeals.length})
                </Text>
                <Text
                  className={`text-[10px] font-semibold ${
                    isSelected ? 'text-indigo-200' : palette.textMuted
                  }`}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {loading && deals.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className={`text-xs ${palette.textMuted} font-semibold mt-2`}>Loading pipeline deals...</Text>
          </View>
        ) : filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className={`rounded-2xl border border-dashed ${palette.border} p-8 items-center justify-center ${palette.surface}`}>
            <Ionicons name="funnel-outline" size={32} color={palette.textMutedColor} />
            <Text className={`text-sm font-bold ${palette.text} mt-2`}>No Deals Found</Text>
            <Text className={`text-xs ${palette.textMuted} text-center mt-1`}>
              {searchQuery ? 'No opportunities match your search filter.' : 'This stage currently has no active deals.'}
            </Text>
            <Pressable
              onPress={() => openCreateDeal(selectedStageId !== 'ALL' ? selectedStageId : null)}
              className="mt-3.5 rounded-xl bg-indigo-600 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">+ Create Deal in this Stage</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
