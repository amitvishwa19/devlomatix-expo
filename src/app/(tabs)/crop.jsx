import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import {
  CROP_CATEGORIES,
  CROPS_DATA,
  SEASONS,
} from '~/constants/cropsData';
import { useLanguage } from '~/contexts/LanguageContext';
import { useAppTheme } from '~/theme/AppTheme';

const JOURNAL_STORAGE_KEY = 'devlomatix.farm_journal_entries';

export default function CropScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [activeCropDetail, setActiveCropDetail] = useState(null);

  // Filter crops
  const filteredCrops = useMemo(() => {
    return CROPS_DATA.filter((crop) => {
      const matchesCat =
        selectedCategory === 'ALL' || crop.category === selectedCategory;

      const matchesSeason =
        selectedSeason === 'ALL' ||
        crop.season.toLowerCase().includes(selectedSeason.toLowerCase()) ||
        crop.seasonDetails.toLowerCase().includes(selectedSeason.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCat && matchesSeason;

      const matchesSearch =
        crop.name.toLowerCase().includes(query) ||
        crop.hindiName.toLowerCase().includes(query) ||
        crop.botanicalName.toLowerCase().includes(query) ||
        crop.season.toLowerCase().includes(query) ||
        crop.climate.soil.toLowerCase().includes(query) ||
        crop.homeopathyPlan.seedTreatment.toLowerCase().includes(query) ||
        crop.homeopathyPlan.pestDefense.toLowerCase().includes(query) ||
        crop.homeopathyPlan.floweringStage.toLowerCase().includes(query);

      return matchesCat && matchesSeason && matchesSearch;
    });
  }, [selectedCategory, selectedSeason, searchQuery]);

  // Log crop treatment to Field Journal
  const handleLogToJournal = async (crop, stageName, remedyText) => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];

      const newRecord = {
        id: `entry_${Date.now()}`,
        crop: `${crop.name} (${crop.hindiName})`,
        plot: 'Main Field / Plot 1',
        issueType: stageName,
        symptoms: `Agronomic & Homeopathic Care for ${stageName} stage.`,
        remedy: remedyText.split(' ')[0] || 'Silicea',
        potency: '6X',
        dosage: remedyText,
        status: 'Under Treatment',
        date: new Date().toISOString().split('T')[0],
        notes: `Cultivation guide prescription for ${crop.name} (${crop.season}).`,
      };

      const updated = [newRecord, ...existing];
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));

      Toast.show({
        type: 'success',
        text1: 'Added to Field Journal',
        text2: `${crop.name} • ${stageName}`,
      });

      setActiveCropDetail(null);
      router.push('/(tabs)/journal');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to log entry',
      });
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'VEGETABLE':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30' };
      case 'GRAIN':
        return { bg: 'bg-amber-500/15', text: 'text-amber-500', border: 'border-amber-500/30' };
      case 'PULSE':
        return { bg: 'bg-teal-500/15', text: 'text-teal-500', border: 'border-teal-500/30' };
      case 'FRUIT':
        return { bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' };
      case 'CASH':
        return { bg: 'bg-indigo-500/15', text: 'text-indigo-500', border: 'border-indigo-500/30' };
      case 'SPICE':
        return { bg: 'bg-orange-500/15', text: 'text-orange-500', border: 'border-orange-500/30' };
      default:
        return { bg: 'bg-cyan-500/15', text: 'text-cyan-500', border: 'border-cyan-500/30' };
    }
  };

  return (
    <AppScreen>
      <View className="flex-1 pb-16">
        <UserStatusBar />

        {/* Header Title Bar */}
        <View className="flex-row items-center justify-between px-3.5 py-1.5">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="sprout-outline" size={22} color="#10b981" />
              <Text className="text-[17px] font-bold" style={{ color: palette.colors.text }}>
                {t('cropGuideTitle')}
              </Text>
            </View>
            <Text className="text-[11px] opacity-75" style={{ color: palette.colors.subtext }}>
              {t('cropGuideSubtitle')}
            </Text>
          </View>

          <View className="rounded-xl bg-teal-500/15 px-2.5 py-1 border border-teal-500/25">
            <Text className="text-[11.5px] font-bold text-teal-600 dark:text-teal-400">
              {filteredCrops.length} {t('crop')}
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View className="px-3 py-1">
          <View
            className="flex-row items-center rounded-xl border px-2.5 py-1.5"
            style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
            <Ionicons name="search-outline" size={15} color={palette.colors.subtext} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchCropsPlaceholder')}
              placeholderTextColor={palette.colors.subtext}
              className="ml-2 flex-1 text-[12.5px]"
              style={{ color: palette.colors.text }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={15} color={palette.colors.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Horizontal Filter Chips */}
        <View className="px-3 py-1">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
            {CROP_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl px-2.5 py-1 border ${
                    active ? 'bg-teal-600 border-teal-600' : ''
                  }`}
                  style={{
                    backgroundColor: active ? undefined : palette.colors.card,
                    borderColor: active ? undefined : palette.colors.border,
                  }}>
                  <Text
                    className={`text-[11.5px] font-semibold ${active ? 'text-white font-bold' : ''}`}
                    style={{ color: active ? '#ffffff' : palette.colors.text }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Seasons Horizontal Filter Chips */}
        <View className="px-3 py-0.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
            {SEASONS.map((s) => {
              const active = selectedSeason === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSeason(s.id)}
                  className={`rounded-lg px-2 py-0.5 border ${active ? 'bg-emerald-600 border-emerald-600' : ''
                    }`}
                  style={{
                    backgroundColor: active ? undefined : palette.colors.card,
                    borderColor: active ? undefined : palette.colors.border,
                  }}>
                  <Text
                    className={`text-[10.5px] font-medium ${active ? 'text-white font-bold' : ''}`}
                    style={{ color: active ? '#ffffff' : palette.colors.subtext }}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Crops List */}
        <FlatList
          data={filteredCrops}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <MaterialCommunityIcons name="sprout" size={40} color={palette.colors.subtext} />
              <Text className="mt-2 text-[13px] opacity-60" style={{ color: palette.colors.text }}>
                No crops match your search or filter criteria.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const catBadge = getCategoryColor(item.category);

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveCropDetail(item)}
                className="mb-2.5 rounded-2xl border p-3"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                {/* Header: Name, Hindi Name & Badges */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-[15px] font-bold" style={{ color: palette.colors.text }}>
                      {t(item.id) !== item.id ? t(item.id) : item.name}
                    </Text>
                    <Text className="text-[11.5px] opacity-75" style={{ color: palette.colors.subtext }}>
                      {item.botanicalName} • <Text className="italic">{item.hindiName}</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <View className={`rounded-full px-2 py-0.5 border ${catBadge.bg} ${catBadge.border}`}>
                      <Text className={`text-[10px] font-bold ${catBadge.text}`}>
                        {item.category}
                      </Text>
                    </View>
                    <View className="rounded-full bg-slate-500/10 px-2 py-0.5 border border-slate-500/20">
                      <Text className="text-[10px] font-semibold" style={{ color: palette.colors.text }}>
                        {item.season}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick Specs Grid */}
                <View className="mt-2 flex-row gap-2">
                  <View className="flex-1 rounded-xl bg-slate-500/5 p-1.5">
                    <Text className="text-[10px] opacity-60" style={{ color: palette.colors.subtext }}>
                      🌡️ Temp
                    </Text>
                    <Text className="text-[11px] font-semibold" style={{ color: palette.colors.text }}>
                      {item.climate.temperature.split('(')[0]}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-xl bg-slate-500/5 p-1.5">
                    <Text className="text-[10px] opacity-60" style={{ color: palette.colors.subtext }}>
                      🌱 Duration
                    </Text>
                    <Text className="text-[11px] font-semibold" style={{ color: palette.colors.text }}>
                      {item.duration}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-xl bg-slate-500/5 p-1.5">
                    <Text className="text-[10px] opacity-60" style={{ color: palette.colors.subtext }}>
                      🧪 Soil pH
                    </Text>
                    <Text className="text-[11px] font-semibold" style={{ color: palette.colors.text }}>
                      {item.climate.ph}
                    </Text>
                  </View>
                </View>

                {/* Agrohomeopathy Highlights */}
                <View className="mt-2 rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <MaterialCommunityIcons name="pill" size={13} color="#14b8a6" />
                      <Text className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        Homeopathic Defense:
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#14b8a6" />
                  </View>
                  <Text className="mt-0.5 text-[11px] leading-4 opacity-85" numberOfLines={2} style={{ color: palette.colors.text }}>
                    {item.homeopathyPlan.pestDefense}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Detailed Crop Modal */}
        <Modal
          visible={!!activeCropDetail}
          animationType="slide"
          transparent
          onRequestClose={() => setActiveCropDetail(null)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="max-h-[90%] rounded-t-3xl border-t p-4"
              style={{
                backgroundColor: palette.colors.page,
                borderColor: palette.colors.border,
              }}>
              {activeCropDetail && (
                <>
                  {/* Modal Header */}
                  <View className="flex-row items-start justify-between border-b pb-3" style={{ borderColor: palette.colors.border }}>
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-[18px] font-bold" style={{ color: palette.colors.text }}>
                          {t(activeCropDetail.id) !== activeCropDetail.id ? t(activeCropDetail.id) : activeCropDetail.name}
                        </Text>
                        <Text className="text-[13px] font-medium opacity-75" style={{ color: palette.colors.subtext }}>
                          ({activeCropDetail.name})
                        </Text>
                      </View>
                      <Text className="text-[11.5px] italic opacity-70" style={{ color: palette.colors.subtext }}>
                        {activeCropDetail.botanicalName} • {activeCropDetail.duration}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => setActiveCropDetail(null)} className="p-1">
                      <Ionicons name="close" size={22} color={palette.colors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
                    {/* Season & Climate Overview */}
                    <View
                      className="mb-3 rounded-2xl border p-3"
                      style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <Ionicons name="calendar-outline" size={15} color="#10b981" />
                        <Text className="text-[13px] font-bold" style={{ color: palette.colors.text }}>
                          {t('soilAndClimate')} & Growing Season
                        </Text>
                      </View>

                      <View className="gap-1 text-[11.5px]">
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Season Window:</Text> {activeCropDetail.seasonDetails}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Optimal Temperature:</Text> {activeCropDetail.climate.temperature}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Sunlight:</Text> {activeCropDetail.climate.sunlight}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Soil Type & pH:</Text> {activeCropDetail.climate.soil} (pH {activeCropDetail.climate.ph})
                        </Text>
                      </View>
                    </View>

                    {/* Sowing & Spacing */}
                    <View
                      className="mb-3 rounded-2xl border p-3"
                      style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <MaterialCommunityIcons name="seed-outline" size={16} color="#f59e0b" />
                        <Text className="text-[13px] font-bold" style={{ color: palette.colors.text }}>
                          {t('sowingAndSpacing')}
                        </Text>
                      </View>

                      <View className="gap-1 text-[11.5px]">
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Sowing Method:</Text> {activeCropDetail.sowing.method}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Seed Rate:</Text> {activeCropDetail.sowing.seedRate}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Spacing:</Text> {activeCropDetail.sowing.spacing}
                        </Text>
                        <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                          • <Text className="font-bold">Germination Period:</Text> {activeCropDetail.sowing.germination}
                        </Text>
                      </View>
                    </View>

                    {/* Cultivation Best Practices */}
                    <View
                      className="mb-3 rounded-2xl border p-3"
                      style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <MaterialCommunityIcons name="water-check-outline" size={16} color="#06b6d4" />
                        <Text className="text-[13px] font-bold" style={{ color: palette.colors.text }}>
                          {t('bestWayToGrow')}
                        </Text>
                      </View>

                      <View className="gap-1.5">
                        <View>
                          <Text className="text-[11px] font-bold opacity-75" style={{ color: palette.colors.subtext }}>
                            Soil Preparation & Organic Enrichment:
                          </Text>
                          <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                            {activeCropDetail.growingGuide.soilPrep}
                          </Text>
                        </View>

                        <View>
                          <Text className="text-[11px] font-bold opacity-75" style={{ color: palette.colors.subtext }}>
                            Irrigation & Water Management:
                          </Text>
                          <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                            {activeCropDetail.growingGuide.irrigation}
                          </Text>
                        </View>

                        <View>
                          <Text className="text-[11px] font-bold opacity-75" style={{ color: palette.colors.subtext }}>
                            Agronomic Practices & Staking:
                          </Text>
                          <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                            {activeCropDetail.growingGuide.practices}
                          </Text>
                        </View>

                        <View>
                          <Text className="text-[11px] font-bold opacity-75" style={{ color: palette.colors.subtext }}>
                            {t('harvestingInfo')}:
                          </Text>
                          <Text className="text-[11.5px] leading-4 text-emerald-600 dark:text-emerald-400 font-medium">
                            {activeCropDetail.growingGuide.harvesting}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Dedicated Homeopathic Care Plan */}
                    <View
                      className="mb-4 rounded-2xl border p-3 border-teal-500/30"
                      style={{ backgroundColor: palette.colors.card }}>
                      <View className="flex-row items-center gap-1.5 mb-2">
                        <MaterialCommunityIcons name="medical-bag" size={17} color="#14b8a6" />
                        <Text className="text-[13.5px] font-bold text-teal-600 dark:text-teal-400">
                          {t('homeopathyForCrop')} (V.D. Kaviraj)
                        </Text>
                      </View>

                      {/* 1. Seed Treatment */}
                      <View className="mb-2 rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
                            🌰 {t('seedTreatment')}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleLogToJournal(
                                activeCropDetail,
                                'Seed Treatment',
                                activeCropDetail.homeopathyPlan.seedTreatment
                              )
                            }
                            className="rounded-md bg-teal-600 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-white">Log</Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="mt-1 text-[11px] leading-4" style={{ color: palette.colors.text }}>
                          {activeCropDetail.homeopathyPlan.seedTreatment}
                        </Text>
                      </View>

                      {/* 2. Vegetative Stage */}
                      <View className="mb-2 rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
                            🌿 {t('vegetativeStage')}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleLogToJournal(
                                activeCropDetail,
                                'Vegetative Stage',
                                activeCropDetail.homeopathyPlan.vegetativeStage
                              )
                            }
                            className="rounded-md bg-teal-600 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-white">Log</Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="mt-1 text-[11px] leading-4" style={{ color: palette.colors.text }}>
                          {activeCropDetail.homeopathyPlan.vegetativeStage}
                        </Text>
                      </View>

                      {/* 3. Flowering Stage */}
                      <View className="mb-2 rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
                            🌸 {t('floweringStage')}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleLogToJournal(
                                activeCropDetail,
                                'Flowering Stage',
                                activeCropDetail.homeopathyPlan.floweringStage
                              )
                            }
                            className="rounded-md bg-teal-600 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-white">Log</Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="mt-1 text-[11px] leading-4" style={{ color: palette.colors.text }}>
                          {activeCropDetail.homeopathyPlan.floweringStage}
                        </Text>
                      </View>

                      {/* 4. Pest Defense */}
                      <View className="mb-2 rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
                            🛡️ {t('pestDefense')}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleLogToJournal(
                                activeCropDetail,
                                'Pest Defense',
                                activeCropDetail.homeopathyPlan.pestDefense
                              )
                            }
                            className="rounded-md bg-teal-600 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-white">Log</Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="mt-1 text-[11px] leading-4" style={{ color: palette.colors.text }}>
                          {activeCropDetail.homeopathyPlan.pestDefense}
                        </Text>
                      </View>

                      {/* 5. Weather Stress */}
                      <View className="rounded-xl bg-teal-500/10 p-2 border border-teal-500/20">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11.5px] font-bold text-teal-700 dark:text-teal-300">
                            🌦️ {t('weatherStress')}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleLogToJournal(
                                activeCropDetail,
                                'Weather Stress',
                                activeCropDetail.homeopathyPlan.weatherStress
                              )
                            }
                            className="rounded-md bg-teal-600 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-white">Log</Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="mt-1 text-[11px] leading-4" style={{ color: palette.colors.text }}>
                          {activeCropDetail.homeopathyPlan.weatherStress}
                        </Text>
                      </View>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity
                      onPress={() => setActiveCropDetail(null)}
                      className="mb-8 items-center justify-center rounded-xl bg-teal-600 py-3 shadow-md">
                      <Text className="text-[13px] font-bold text-white">{t('doneViewing')}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </AppScreen>
  );
}
