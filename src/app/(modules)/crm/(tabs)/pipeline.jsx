import Ionicons from '@expo/vector-icons/Ionicons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import CreateDealModal from '../_components/CreateDealModal';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import IosDeleteConfirmModal from '../_components/IosDeleteConfirmModal';
import { useCrmTheme } from '../utils/colors';

export default function CrmPipelineTab() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const {
    pipelines,
    activePipeline,
    stages,
    deals,
    loading,
    refreshing,
    refreshAll,
    openCreateDeal,
    optimisticDeleteDeal,
  } = useCrm();

  const [selectedStageId, setSelectedStageId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('VALUE_DESC'); // 'VALUE_DESC' | 'RECENT' | 'PRIORITY'
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter deals
  const filteredDeals = useMemo(() => {
    let list = deals.filter((deal) => {
      if (selectedStageId !== 'ALL' && deal.stageId !== selectedStageId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (deal.title || '').toLowerCase().includes(q);
        const matchContact = (deal.contact?.name || '').toLowerCase().includes(q);
        const matchAccount = (deal.account?.name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContact && !matchAccount) return false;
      }
      return true;
    });

    // Sort deals
    if (sortBy === 'VALUE_DESC') {
      list.sort((a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0));
    } else if (sortBy === 'PRIORITY') {
      const pWeights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      list.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    } else if (sortBy === 'RECENT') {
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    }

    return list;
  }, [deals, selectedStageId, searchQuery, sortBy]);

  const totalFilteredValue = useMemo(() => {
    return filteredDeals
      .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
      .toLocaleString('en-IN');
  }, [filteredDeals]);

  // Stage Breakdown Statistics
  const stageStats = useMemo(() => {
    return stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stageId === stage.id);
      const stageVal = stageDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
      return {
        ...stage,
        count: stageDeals.length,
        value: stageVal,
        valStr: stageVal.toLocaleString('en-IN'),
      };
    });
  }, [stages, deals]);

  return (
    <AppScreen>
      <CrmHeader
        title="Pipeline Funnel"
        subtitle={`${activePipeline?.name || 'Sales Pipeline'} • ₹${totalFilteredValue}`}
        rightActions={
          <Pressable
            onPress={() => openCreateDeal(selectedStageId !== 'ALL' ? selectedStageId : null)}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">New Deal</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateDealModal />

      {/* Search and Stage Selector Header */}
      <View
        className="px-3 pt-2.5 pb-2 border-b"
        style={{
          backgroundColor: colors.header,
          borderColor: colors.border,
        }}
      >
        {/* Search Input Bar */}
        <View
          className="flex-row items-center gap-x-2 rounded-xl px-3 py-2 border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search deals, contacts, companies..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs py-0.5"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Stage Filter Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 flex-row py-0.5"
        >
          {/* All Stages Tab */}
          <Pressable
            onPress={() => setSelectedStageId('ALL')}
            className="rounded-xl px-3 py-1.5 border flex-row items-center gap-x-1.5 mr-1.5 active:opacity-80"
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
          {stageStats.map((stage) => {
            const isSelected = selectedStageId === stage.id;
            return (
              <Pressable
                key={stage.id}
                onPress={() => setSelectedStageId(stage.id)}
                className="rounded-xl px-3 py-1.5 border flex-row items-center gap-x-2 mr-1.5 active:opacity-80"
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
                  {stage.name} ({stage.count})
                </Text>
                <Text
                  className="text-[10px] font-semibold"
                  style={{
                    color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted,
                  }}
                >
                  ₹{stage.valStr}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Sorting Toolbar */}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
            Showing {filteredDeals.length} opportunities
          </Text>

          <View className="flex-row items-center gap-x-1">
            <Pressable
              onPress={() => setSortBy('VALUE_DESC')}
              className="rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: sortBy === 'VALUE_DESC' ? colors.primarySoft : 'transparent',
                borderColor: sortBy === 'VALUE_DESC' ? colors.primaryBorder : 'transparent',
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: sortBy === 'VALUE_DESC' ? colors.primary : colors.textMuted }}
              >
                Highest Value
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortBy('PRIORITY')}
              className="rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: sortBy === 'PRIORITY' ? colors.primarySoft : 'transparent',
                borderColor: sortBy === 'PRIORITY' ? colors.primaryBorder : 'transparent',
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: sortBy === 'PRIORITY' ? colors.primary : colors.textMuted }}
              >
                Priority
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortBy('RECENT')}
              className="rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: sortBy === 'RECENT' ? colors.primarySoft : 'transparent',
                borderColor: sortBy === 'RECENT' ? colors.primaryBorder : 'transparent',
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: sortBy === 'RECENT' ? colors.primary : colors.textMuted }}
              >
                Recent
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Deals List */}
      <ScrollView
        ref={scrollRef}
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
          filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onDeletePrompt={(d) => setDeleteTarget(d)} />
          ))
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
              {searchQuery ? 'No opportunities match your filter.' : 'This stage currently has no active deals.'}
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

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={!!deleteTarget}
        title={deleteTarget?.title ? `Delete "${deleteTarget.title}"` : 'Delete Opportunity'}
        message="Are you sure you want to delete this opportunity? This action cannot be undone."
        confirmText="Delete Deal"
        isPermanent={true}
        onConfirm={() => {
          if (deleteTarget) {
            const id = deleteTarget.id;
            setDeleteTarget(null);
            optimisticDeleteDeal(id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreen>
  );
}
