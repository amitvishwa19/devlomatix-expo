import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateDealModal from '../_components/CreateDealModal';

export default function CrmPipelineTab() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <CrmHeader
        title="Deals Pipeline"
        subtitle={`${activePipeline?.name || 'Sales Funnel'} • ₹${totalFilteredValue}`}
        rightActions={
          <Pressable
            onPress={() => openCreateDeal(selectedStageId !== 'ALL' ? selectedStageId : null)}
            className="h-8.5 px-3 flex-row items-center justify-center gap-x-1 rounded-xl bg-indigo-600 active:bg-indigo-700"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Deal</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateDealModal />

      {/* Search and Priority Filter Header */}
      <View className="bg-white px-4 py-2.5 border-b border-slate-200/80">
        {/* Search Input */}
        <View className="flex-row items-center gap-x-2 rounded-xl bg-slate-100 px-3 py-2 border border-slate-200">
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search deals, contacts, companies..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-xs text-slate-900"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color="#94a3b8" />
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
            className={`rounded-xl px-3 py-2 border flex-row items-center gap-x-1.5 ${
              selectedStageId === 'ALL'
                ? 'bg-slate-900 border-slate-900'
                : 'bg-slate-50 border-slate-200 active:bg-slate-100'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedStageId === 'ALL' ? 'text-white' : 'text-slate-700'
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
                className={`rounded-xl px-3 py-2 border flex-row items-center gap-x-2 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                }`}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : stage.color || '#4f46e5' }}
                />
                <Text
                  className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}
                >
                  {stage.name} ({stageDeals.length})
                </Text>
                <Text
                  className={`text-[10px] font-semibold ${
                    isSelected ? 'text-indigo-200' : 'text-slate-400'
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
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {loading && deals.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-xs text-slate-400 font-semibold mt-2">Loading pipeline deals...</Text>
          </View>
        ) : filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-8 items-center justify-center bg-white">
            <Ionicons name="funnel-outline" size={32} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-700 mt-2">No Deals Found</Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
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
    </SafeAreaView>
  );
}
