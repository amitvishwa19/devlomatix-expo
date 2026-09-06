import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import { BOOK_METADATA, BOOK_PRINCIPLES } from '~/constants/agrohomeopathyData';
import { CROPS_DATA } from '~/constants/cropsData';
import { useLanguage } from '~/contexts/LanguageContext';
import { useAppTheme } from '~/theme/AppTheme';

const JOURNAL_STORAGE_KEY = 'devlomatix.farm_journal_entries';

const EMERGENCY_SYMPTOMS = [
  { label: 'Stripe Rust', remedy: 'Belladonna 6X', icon: 'leaf-circle-outline', color: '#f59e0b' },
  { label: 'Aphids / Jassids', remedy: 'Coccinella 6X', icon: 'bug-outline', color: '#ef4444' },
  { label: 'Snails & Slugs', remedy: 'Helix Tosta 6X', icon: 'shield-alert-outline', color: '#10b981' },
  { label: 'Blossom-End Rot', remedy: 'Ocymum 6X', icon: 'fruit-cherries', color: '#ec4899' },
  { label: 'Pruning / Broken Limb', remedy: 'Arnica 6X', icon: 'bandage', color: '#06b6d4' },
  { label: 'Sudden Frost / Cold', remedy: 'Aconitum 6X', icon: 'snowflake', color: '#8b5cf6' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { palette, isDark } = useAppTheme();
  const { t } = useLanguage();

  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load journal entries from storage
  const loadRecentEntries = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecentEntries();
  }, [loadRecentEntries]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecentEntries();
  };

  const activeCount = entries.filter((e) => e.status !== 'Resolved').length;
  const resolvedCount = entries.filter((e) => e.status === 'Resolved').length;
  const featuredCrops = CROPS_DATA.slice(0, 5);

  return (
    <AppScreen>
      <View className="flex-1 pb-16">
        <UserStatusBar />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#14b8a6" />
          }>
          {/* Farm Dashboard Hero Banner */}
          <View
            className="rounded-3xl border p-4 mb-3"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-1.5">
                  <MaterialCommunityIcons name="sprout" size={22} color="#10b981" />
                  <Text className="text-[18px] font-bold" style={{ color: palette.colors.text }}>
                    {t('welcomeBack')}
                  </Text>
                </View>
                <Text className="mt-0.5 text-[12px] opacity-75" style={{ color: palette.colors.subtext }}>
                  {t('dashboardSubtitle')}
                </Text>
              </View>

              <View className="rounded-2xl bg-emerald-500/15 px-3 py-1.5 border border-emerald-500/25">
                <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {t('activeSeason')}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-teal-500/10 p-2.5 border border-teal-500/20">
                <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                  {t('totalCrops')}
                </Text>
                <Text className="mt-0.5 text-[17px] font-bold text-teal-600 dark:text-teal-400">
                  {CROPS_DATA.length}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-rose-500/10 p-2.5 border border-rose-500/20">
                <Text className="text-[10.5px] text-rose-500 font-medium">
                  {t('activeTreatments')}
                </Text>
                <Text className="mt-0.5 text-[17px] font-bold text-rose-500">
                  {activeCount}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                <Text className="text-[10.5px] text-emerald-500 font-medium">
                  {t('healthyPlots')}
                </Text>
                <Text className="mt-0.5 text-[17px] font-bold text-emerald-500">
                  {resolvedCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Seasonal Advisory Callout */}
          <View
            className="mb-3.5 flex-row items-center gap-2.5 rounded-2xl border p-3"
            style={{
              backgroundColor: isDark ? '#0f291e' : '#ecfdf5',
              borderColor: '#10b98133',
            }}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#10b981" />
            <View className="flex-1">
              <Text
                className="text-[12px] font-bold"
                style={{ color: isDark ? '#6ee7b7' : '#065f46' }}>
                {t('seasonalAdvisory')}
              </Text>
              <Text
                className="mt-0.5 text-[11px] leading-4"
                style={{ color: isDark ? '#a7f3d0' : '#047857' }}>
                {t('bestSprayTime')}
              </Text>
            </View>
          </View>

          {/* Quick Hub Navigation Cards */}
          <Text className="mb-2 text-[13px] font-bold opacity-80" style={{ color: palette.colors.text }}>
            {t('navigationHub')}
          </Text>
          <View className="mb-3.5 flex-row flex-wrap gap-2">
            {/* 1. Crops Guide */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/crop')}
              className="flex-1 min-w-[46%] rounded-2xl border p-3 shadow-sm"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
                  <MaterialCommunityIcons name="sprout" size={18} color="#10b981" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={palette.colors.subtext} />
              </View>
              <Text className="mt-2 text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                {t('cropGuide')}
              </Text>
              <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                {t('cultivationSubtitle')}
              </Text>
            </TouchableOpacity>

            {/* 2. Field Journal */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/journal')}
              className="flex-1 min-w-[46%] rounded-2xl border p-3 shadow-sm"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15">
                  <MaterialCommunityIcons name="notebook" size={18} color="#14b8a6" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={palette.colors.subtext} />
              </View>
              <Text className="mt-2 text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                {t('myJournal')}
              </Text>
              <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                {t('activeTreatmentsSubtitle')}
              </Text>
            </TouchableOpacity>

            {/* 3. Video Tutorials */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/videos')}
              className="flex-1 min-w-[46%] rounded-2xl border p-3 shadow-sm"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15">
                  <Ionicons name="play-circle" size={18} color="#a855f7" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={palette.colors.subtext} />
              </View>
              <Text className="mt-2 text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                {t('videos')}
              </Text>
              <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                {t('videoSubtitle')}
              </Text>
            </TouchableOpacity>

            {/* 4. Diseases & Repertory */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/journal')}
              className="flex-1 min-w-[46%] rounded-2xl border p-3 shadow-sm"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#f59e0b" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={palette.colors.subtext} />
              </View>
              <Text className="mt-2 text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                {t('repertoryBook')}
              </Text>
              <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                {t('repertorySubtitle')}
              </Text>
            </TouchableOpacity>

            {/* 5. Materia Medica */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/journal')}
              className="flex-1 min-w-[46%] rounded-2xl border p-3 shadow-sm"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15">
                  <MaterialCommunityIcons name="pill" size={18} color="#ef4444" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={palette.colors.subtext} />
              </View>
              <Text className="mt-2 text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                {t('materiaEncyclopedia')}
              </Text>
              <Text className="text-[10.5px] opacity-70" style={{ color: palette.colors.subtext }}>
                {t('materiaSubtitle')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Symptom Diagnostic Quick Bar */}
          <View
            className="mb-3.5 rounded-2xl border p-3.5"
            style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="flash-outline" size={16} color="#f59e0b" />
                <Text className="text-[13px] font-bold" style={{ color: palette.colors.text }}>
                  {t('quickRemedyFinder')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
                <Text className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  {t('openFinder')}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-1.5">
              {EMERGENCY_SYMPTOMS.map((sym) => (
                <TouchableOpacity
                  key={sym.label}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/journal')}
                  className="flex-row items-center gap-1 rounded-xl bg-slate-500/5 px-2.5 py-1.5 border border-slate-500/15">
                  <MaterialCommunityIcons name={sym.icon} size={14} color={sym.color} />
                  <Text className="text-[11px] font-semibold" style={{ color: palette.colors.text }}>
                    {sym.label}: <Text className="font-bold text-teal-600 dark:text-teal-400">{sym.remedy}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured Seasonal Crops */}
          <View className="mb-3.5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[13px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                {t('featuredCrops')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/crop')}>
                <Text className="text-[11.5px] font-bold text-teal-600 dark:text-teal-400">
                  {t('viewAll')} ({CROPS_DATA.length}) →
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 6 }}
              className="py-0.5">
              {featuredCrops.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/crop')}
                  className="w-44 mr-3 rounded-2xl border p-3"
                  style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[14px] font-bold" style={{ color: palette.colors.text }}>
                      {t(c.id) !== c.id ? t(c.id) : c.name}
                    </Text>
                    <View className="rounded-full bg-teal-500/15 px-1.5 py-0.5">
                      <Text className="text-[9.5px] font-bold text-teal-600 dark:text-teal-400">
                        {c.season.split(' ')[0]}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-0.5 text-[11px] opacity-70" style={{ color: palette.colors.subtext }}>
                    {c.botanicalName}
                  </Text>

                  <View className="mt-2 rounded-xl bg-slate-500/5 p-1.5">
                    <Text className="text-[10px] opacity-60" style={{ color: palette.colors.subtext }}>
                      🌱 {t('duration')}: {c.duration}
                    </Text>
                    <Text className="mt-0.5 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400" numberOfLines={1}>
                      💊 {c.homeopathyPlan.seedTreatment.split('(')[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Active Field Treatments */}
          <View className="mb-3.5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[13px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                {t('recentActivity')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
                <Text className="text-[11.5px] font-bold text-teal-600 dark:text-teal-400">
                  {t('myJournal')} →
                </Text>
              </TouchableOpacity>
            </View>

            {entries.length === 0 ? (
              <View
                className="items-center justify-center rounded-2xl border p-4"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <MaterialCommunityIcons name="notebook-outline" size={28} color={palette.colors.subtext} />
                <Text className="mt-1 text-[12px] opacity-60 text-center" style={{ color: palette.colors.text }}>
                  {t('noRecentTreatments')}
                </Text>
              </View>
            ) : (
              entries.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/journal')}
                  className="mb-2 rounded-2xl border p-3"
                  style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                      {item.crop}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}>
                      <Text
                        className={`text-[10px] font-bold ${
                          item.status === 'Resolved' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-1 text-[11.5px] leading-4 opacity-85" numberOfLines={2} style={{ color: palette.colors.text }}>
                    {item.symptoms}
                  </Text>

                  <View className="mt-1.5 flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      💊 {item.remedy} ({item.potency})
                    </Text>
                    <Text className="text-[10px] opacity-50" style={{ color: palette.colors.subtext }}>
                      {item.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Book Wisdom Banner */}
          <View
            className="rounded-2xl border p-3.5 border-teal-500/30"
            style={{ backgroundColor: palette.colors.card }}>
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MaterialCommunityIcons name="book-open-variant" size={18} color="#14b8a6" />
              <Text className="text-[13px] font-bold text-teal-600 dark:text-teal-400">
                {BOOK_METADATA.title}
              </Text>
            </View>
            <Text className="text-[11.5px] leading-4 opacity-85" style={{ color: palette.colors.text }}>
              "{BOOK_PRINCIPLES[0].description}"
            </Text>
            <Text className="mt-1.5 text-[10.5px] font-bold opacity-60 text-right" style={{ color: palette.colors.subtext }}>
              — {BOOK_METADATA.author}
            </Text>
          </View>
        </ScrollView>
      </View>
    </AppScreen>
  );
}
