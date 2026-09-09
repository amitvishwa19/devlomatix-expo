import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
  BOOK_METADATA,
  BOOK_PRINCIPLES,
  CATEGORIES,
  DISEASES_AND_PESTS,
  MATERIA_MEDICA,
} from '~/constants/agrohomeopathyData';
import { useLanguage } from '~/contexts/LanguageContext';
import { useAppTheme } from '~/theme/AppTheme';

const STORAGE_KEY = 'devlomatix.farm_journal_entries';

const DEFAULT_ENTRIES = [
  {
    id: 'entry_1',
    crop: 'Tomato (Roma)',
    plot: 'Plot A-2 (North Greenhouse)',
    issueType: 'Nutrient / Soil',
    symptoms: 'Dark sunken spots at fruit blossom end (Blossom-End Rot) & poor calcium assimilation.',
    remedy: 'Ocymum Basilicum',
    potency: '6X',
    dosage: '10 pellets in 10L water, foliar spray weekly',
    status: 'Recovering',
    date: '2026-09-04',
    notes: 'Significant reduction in new lesion formation after second application.',
  },
  {
    id: 'entry_2',
    crop: 'Wheat (Winter Amber)',
    plot: 'Field 4 (Sector East)',
    issueType: 'Fungal & Blights',
    symptoms: 'Bright orange/yellow pustules in stripes along leaf veins (Puccinia striiformis / Stripe Rust).',
    remedy: 'Belladonna',
    potency: '6X',
    dosage: '1 dose per 20L tank, mist in early morning sunlight',
    status: 'Under Treatment',
    date: '2026-09-02',
    notes: 'Early stage arrest observed; repeat dosage in 5 days if humidity remains high.',
  },
  {
    id: 'entry_3',
    crop: 'Apple Trees (Honeycrisp)',
    plot: 'Orchard Block 3',
    issueType: 'Injuries & Weather',
    symptoms: 'Post-seasonal heavy pruning wounds, sap bleeding, and mechanical bark injury.',
    remedy: 'Arnica Montana',
    potency: '6X',
    dosage: 'Root drench 5L per tree + bark wash',
    status: 'Resolved',
    date: '2026-08-28',
    notes: 'Rapid bark healing and callusing formed without fungal opportunist infection.',
  },
  {
    id: 'entry_4',
    crop: 'Garden Vegetables (Lettuce & Cabbage)',
    plot: 'Raised Bed 5',
    issueType: 'Pests & Insects',
    symptoms: 'Heavy infestation of garden snails and slugs devouring young foliage at night.',
    remedy: 'Helix Tosta',
    potency: '6X',
    dosage: 'Perimeter soil spray 1 dose in 10L before dusk',
    status: 'Under Treatment',
    date: '2026-09-05',
    notes: 'Snails migrating away from perimeter; no chemical pesticide residue required.',
  },
];

const COMMON_REMEDIES = [
  'Arnica Montana',
  'Belladonna',
  'Calendula Officinalis',
  'Carbo Vegetabilis',
  'Coccinella Septempunctata',
  'Helix Tosta',
  'Ocymum Basilicum',
  'Silicea',
  'Sulphur',
  'Thuja Occidentalis',
  'Aconitum Napellus',
  'Phosphorus',
  'Ferrum Phosphoricum',
  'Cina',
];

const POTENCIES = ['6X', '30C', '200C', '1M', 'Mother Tincture (Q)'];

export default function JournalScreen() {
  const { palette, isDark } = useAppTheme();
  const { t } = useLanguage();

  // Active Main Section: 'LOGS' | 'REPERTORY' | 'MATERIA' | 'GUIDE' | 'FINDER'
  const [activeTab, setActiveTab] = useState('LOGS');

  // Logs State
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, RESOLVED

  // Repertory & Materia Medica Filters
  const [repCategory, setRepCategory] = useState('ALL');
  const [repSearch, setRepSearch] = useState('');
  const [selectedRepItem, setSelectedRepItem] = useState(null);
  const [selectedRemedy, setSelectedRemedy] = useState(null);

  // Diagnostic Finder State
  const [finderQuery, setFinderQuery] = useState('');

  // Modal State for New / Prefilled Entry
  const [modalVisible, setModalVisible] = useState(false);
  const [crop, setCrop] = useState('');
  const [plot, setPlot] = useState('');
  const [issueType, setIssueType] = useState('Fungal & Blights');
  const [symptoms, setSymptoms] = useState('');
  const [remedy, setRemedy] = useState('Belladonna');
  const [potency, setPotency] = useState('6X');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Under Treatment');

  // Load entries
  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(Array.isArray(parsed) ? parsed : DEFAULT_ENTRIES);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ENTRIES));
        setEntries(DEFAULT_ENTRIES);
      }
    } catch {
      setEntries(DEFAULT_ENTRIES);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const saveEntriesToStorage = async (newEntries) => {
    setEntries(newEntries);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch {
      // ignore
    }
  };

  const handleSaveNewEntry = async () => {
    if (!crop.trim() || !symptoms.trim()) {
      Toast.show({
        type: 'error',
        text1: t('cropName'),
        text2: t('symptoms'),
      });
      return;
    }

    const newRecord = {
      id: `entry_${Date.now()}`,
      crop: crop.trim(),
      plot: plot.trim() || 'Main Plot',
      issueType,
      symptoms: symptoms.trim(),
      remedy,
      potency,
      dosage: dosage.trim() || '10 pellets in 10L water',
      status,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    const updated = [newRecord, ...entries];
    await saveEntriesToStorage(updated);

    Toast.show({
      type: 'success',
      text1: t('entrySaved'),
      text2: `${newRecord.crop} • ${newRecord.remedy} ${newRecord.potency}`,
    });

    setCrop('');
    setPlot('');
    setSymptoms('');
    setDosage('');
    setNotes('');
    setStatus('Under Treatment');
    setModalVisible(false);
  };

  const handleToggleStatus = async (id) => {
    const updated = entries.map((item) => {
      if (item.id === id) {
        const nextStatus = item.status === 'Resolved' ? 'Under Treatment' : 'Resolved';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    await saveEntriesToStorage(updated);
  };

  const handleDeleteEntry = async (id) => {
    const updated = entries.filter((item) => item.id !== id);
    await saveEntriesToStorage(updated);
    Toast.show({
      type: 'info',
      text1: t('entryDeleted'),
    });
  };

  // Prefill modal from book items
  const openPrefilledModal = (item) => {
    setCrop(item.crops ? item.crops.split(',')[0].trim() : 'Orchard / Crop');
    setPlot('Plot 1');
    setIssueType(item.category || 'Agrohomeopathy');
    setSymptoms(item.symptoms || item.keynotes || '');
    setRemedy(item.primaryRemedy || item.name || 'Arnica Montana');
    setPotency(item.potency ? item.potency.split(' ')[0] : '6X');
    setDosage(item.dosage || '10 pellets in 10L water');
    setNotes(`Prescribed according to V.D. Kaviraj: ${item.name || ''}`);
    setStatus('Under Treatment');
    setModalVisible(true);
  };

  // Metrics
  const totalLogs = entries.length;
  const activeTreatments = entries.filter((e) => e.status !== 'Resolved').length;
  const resolvedLogs = entries.filter((e) => e.status === 'Resolved').length;

  // Filtered Logs
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesFilter =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.status !== 'Resolved') ||
        (statusFilter === 'RESOLVED' && item.status === 'Resolved');

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesFilter;

      return (
        item.crop.toLowerCase().includes(query) ||
        item.plot.toLowerCase().includes(query) ||
        item.remedy.toLowerCase().includes(query) ||
        item.symptoms.toLowerCase().includes(query)
      );
    });
  }, [entries, statusFilter, searchQuery]);

  // Filtered Repertory
  const filteredRepertory = useMemo(() => {
    return DISEASES_AND_PESTS.filter((item) => {
      const matchesCat = repCategory === 'ALL' || item.category === repCategory;
      const query = repSearch.trim().toLowerCase();
      if (!query) return matchesCat;
      return (
        matchesCat &&
        (item.name.toLowerCase().includes(query) ||
          item.pathogen.toLowerCase().includes(query) ||
          item.crops.toLowerCase().includes(query) ||
          item.symptoms.toLowerCase().includes(query) ||
          item.primaryRemedy.toLowerCase().includes(query))
      );
    });
  }, [repCategory, repSearch]);

  // Filtered Materia Medica
  const filteredMateria = useMemo(() => {
    const query = repSearch.trim().toLowerCase();
    if (!query) return MATERIA_MEDICA;
    return MATERIA_MEDICA.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.commonName.toLowerCase().includes(query) ||
        m.keynotes.toLowerCase().includes(query) ||
        m.plantIndications.toLowerCase().includes(query) ||
        m.pestsTargeted.toLowerCase().includes(query)
    );
  }, [repSearch]);

  // Diagnostic Finder Results
  const finderResults = useMemo(() => {
    const query = finderQuery.trim().toLowerCase();
    if (!query) return DISEASES_AND_PESTS.slice(0, 6);
    return DISEASES_AND_PESTS.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.crops.toLowerCase().includes(query) ||
        item.symptoms.toLowerCase().includes(query) ||
        item.primaryRemedy.toLowerCase().includes(query) ||
        item.pathogen.toLowerCase().includes(query)
    );
  }, [finderQuery]);

  const getStatusBadge = (itemStatus) => {
    switch (itemStatus) {
      case 'Resolved':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30' };
      case 'Recovering':
        return { bg: 'bg-teal-500/15', text: 'text-teal-500', border: 'border-teal-500/30' };
      case 'Monitoring':
        return { bg: 'bg-amber-500/15', text: 'text-amber-500', border: 'border-amber-500/30' };
      default:
        return { bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' };
    }
  };

  return (
    <AppScreen>
      <View className="flex-1 pb-16">
        <UserStatusBar />

        {/* Header Bar */}
        <View className="flex-row items-center justify-between px-3.5 py-1.5">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#14b8a6" />
              <Text className="text-[17px] font-bold" style={{ color: palette.colors.text }}>
                {BOOK_METADATA.title}
              </Text>
            </View>
            <Text className="text-[11px] opacity-75" style={{ color: palette.colors.subtext }}>
              {BOOK_METADATA.author} • Agrohomeopathy
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setCrop('');
              setPlot('');
              setSymptoms('');
              setDosage('');
              setNotes('');
              setModalVisible(true);
            }}
            activeOpacity={0.8}
            className="flex-row items-center gap-1 rounded-xl bg-teal-600 px-2.5 py-1.5 shadow-sm">
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text className="text-[12px] font-bold text-white">{t('newEntry')}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Segmented Navigation Bar */}
        <View className="px-3 py-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
            {[
              { key: 'LOGS', label: t('fieldLogs'), icon: 'journal-outline' },
              { key: 'REPERTORY', label: t('agroRepertory'), icon: 'leaf-outline' },
              { key: 'MATERIA', label: t('materiaMedica'), icon: 'medkit-outline' },
              { key: 'FINDER', label: t('quickDiagnostic'), icon: 'search-outline' },
              { key: 'GUIDE', label: t('agroGuide'), icon: 'information-circle-outline' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-row items-center gap-1 rounded-xl px-2.5 py-1.5 border ${
                    active ? 'bg-teal-600 border-teal-600' : ''
                  }`}
                  style={{
                    backgroundColor: active ? undefined : palette.colors.card,
                    borderColor: active ? undefined : palette.colors.border,
                  }}>
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={active ? '#ffffff' : palette.colors.subtext}
                  />
                  <Text
                    className={`text-[11.5px] font-bold ${active ? 'text-white' : ''}`}
                    style={{ color: active ? '#ffffff' : palette.colors.text }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: FIELD JOURNAL LOGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'LOGS' && (
          <View className="flex-1">
            {/* Quick Metrics */}
            <View className="flex-row gap-2 px-3 py-1">
              <View
                className="flex-1 rounded-xl border p-2"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Text className="text-[10px] opacity-70" style={{ color: palette.colors.subtext }}>
                  {t('totalEntries')}
                </Text>
                <Text className="text-[16px] font-bold" style={{ color: palette.colors.text }}>
                  {totalLogs}
                </Text>
              </View>

              <View
                className="flex-1 rounded-xl border p-2"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Text className="text-[10px] text-rose-500 font-medium">
                  {t('activeTreatments')}
                </Text>
                <Text className="text-[16px] font-bold text-rose-500">
                  {activeTreatments}
                </Text>
              </View>

              <View
                className="flex-1 rounded-xl border p-2"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Text className="text-[10px] text-emerald-500 font-medium">
                  {t('healthyPlots')}
                </Text>
                <Text className="text-[16px] font-bold text-emerald-500">
                  {resolvedLogs}
                </Text>
              </View>
            </View>

            {/* Search & Status Filters */}
            <View className="px-3 py-1">
              <View
                className="flex-row items-center rounded-xl border px-2.5 py-1"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Ionicons name="search-outline" size={15} color={palette.colors.subtext} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('searchJournal')}
                  placeholderTextColor={palette.colors.subtext}
                  className="ml-1.5 flex-1 text-[12.5px]"
                  style={{ color: palette.colors.text }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={15} color={palette.colors.subtext} />
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-1.5 flex-row gap-1.5">
                {[
                  { key: 'ALL', label: t('filterAll') },
                  { key: 'ACTIVE', label: t('filterActive') },
                  { key: 'RESOLVED', label: t('filterResolved') },
                ].map((f) => {
                  const active = statusFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      onPress={() => setStatusFilter(f.key)}
                      className={`rounded-lg px-2.5 py-0.5 border ${
                        active ? 'bg-teal-600 border-teal-600' : ''
                      }`}
                      style={{
                        backgroundColor: active ? undefined : palette.colors.card,
                        borderColor: active ? undefined : palette.colors.border,
                      }}>
                      <Text
                        className={`text-[11px] font-semibold ${active ? 'text-white' : ''}`}
                        style={{ color: active ? '#ffffff' : palette.colors.text }}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Entries List */}
            <FlatList
              data={filteredEntries}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#14b8a6" />
              }
              ListEmptyComponent={
                <View className="items-center justify-center py-10">
                  <MaterialCommunityIcons name="notebook-outline" size={36} color={palette.colors.subtext} />
                  <Text className="mt-1 text-[13px] opacity-60" style={{ color: palette.colors.text }}>
                    {t('noEntriesFound')}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const badge = getStatusBadge(item.status);
                const isResolved = item.status === 'Resolved';

                return (
                  <View
                    className="mb-2 rounded-xl border p-2.5"
                    style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-1.5">
                        <Text className="text-[14px] font-bold" style={{ color: palette.colors.text }}>
                          {item.crop}
                        </Text>
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <Ionicons name="location-outline" size={11} color={palette.colors.subtext} />
                          <Text className="text-[11px] opacity-75" style={{ color: palette.colors.subtext }}>
                            {item.plot}
                          </Text>
                          <Text className="text-[10.5px] opacity-50" style={{ color: palette.colors.subtext }}>
                            • {item.date}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleToggleStatus(item.id)}
                        className={`rounded-full px-2 py-0.5 border ${badge.bg} ${badge.border}`}>
                        <Text className={`text-[10px] font-bold ${badge.text}`}>{item.status}</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mt-1.5 rounded-lg bg-slate-500/5 p-1.5">
                      <Text className="text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                        {item.symptoms}
                      </Text>
                    </View>

                    <View className="mt-1.5 flex-row items-center justify-between">
                      <View className="rounded-md bg-teal-500/15 px-2 py-0.5 border border-teal-500/25">
                        <Text className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          💊 {item.remedy} ({item.potency})
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => handleToggleStatus(item.id)}
                          className="p-1 rounded-md"
                          style={{ backgroundColor: palette.colors.item }}>
                          <Ionicons
                            name={isResolved ? 'checkmark-circle' : 'checkmark-circle-outline'}
                            size={16}
                            color={isResolved ? '#10b981' : palette.colors.subtext}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(item.id)}
                          className="p-1 rounded-md"
                          style={{ backgroundColor: palette.colors.item }}>
                          <Ionicons name="trash-outline" size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {item.dosage ? (
                      <View className="mt-1 flex-row items-center gap-1">
                        <Ionicons name="water-outline" size={11} color="#06b6d4" />
                        <Text className="text-[10.5px] opacity-75" style={{ color: palette.colors.subtext }}>
                          {item.dosage}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: REPERTORY OF DISEASES & PESTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'REPERTORY' && (
          <View className="flex-1">
            {/* Category Filters */}
            <View className="px-3 py-1">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = repCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setRepCategory(cat.id)}
                      className={`rounded-lg px-2.5 py-1 border ${
                        active ? 'bg-teal-600 border-teal-600' : ''
                      }`}
                      style={{
                        backgroundColor: active ? undefined : palette.colors.card,
                        borderColor: active ? undefined : palette.colors.border,
                      }}>
                      <Text
                        className={`text-[11px] font-semibold ${active ? 'text-white' : ''}`}
                        style={{ color: active ? '#ffffff' : palette.colors.text }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Search */}
              <View
                className="mt-1.5 flex-row items-center rounded-xl border px-2.5 py-1"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Ionicons name="search-outline" size={15} color={palette.colors.subtext} />
                <TextInput
                  value={repSearch}
                  onChangeText={setRepSearch}
                  placeholder="Search diseases, pests, crops, remedies..."
                  placeholderTextColor={palette.colors.subtext}
                  className="ml-1.5 flex-1 text-[12px]"
                  style={{ color: palette.colors.text }}
                />
                {repSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRepSearch('')}>
                    <Ionicons name="close-circle" size={15} color={palette.colors.subtext} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Repertory List */}
            <FlatList
              data={filteredRepertory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isExpanded = selectedRepItem?.id === item.id;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedRepItem(isExpanded ? null : item)}
                    className="mb-2 rounded-xl border p-2.5"
                    style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                            {item.name}
                          </Text>
                        </View>
                        <Text className="text-[11px] italic opacity-70" style={{ color: palette.colors.subtext }}>
                          {item.pathogen}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={palette.colors.subtext}
                      />
                    </View>

                    {/* Crops Tag */}
                    <View className="mt-1.5 flex-row items-center gap-1">
                      <Text className="text-[11px] font-semibold opacity-70" style={{ color: palette.colors.subtext }}>
                        Crops:
                      </Text>
                      <Text className="text-[11px] font-medium" style={{ color: palette.colors.text }}>
                        {item.crops}
                      </Text>
                    </View>

                    {/* Remedy Highlight */}
                    <View className="mt-1.5 flex-row items-center justify-between">
                      <View className="rounded-lg bg-teal-500/15 px-2 py-0.5 border border-teal-500/25">
                        <Text className="text-[11.5px] font-bold text-teal-600 dark:text-teal-400">
                          ★ {item.primaryRemedy} ({item.potency})
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => openPrefilledModal(item)}
                        className="flex-row items-center gap-1 rounded-lg bg-teal-600 px-2 py-1 shadow-sm">
                        <Ionicons name="add-circle-outline" size={13} color="#ffffff" />
                        <Text className="text-[10.5px] font-bold text-white">Log to Journal</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <View className="mt-2 border-t pt-2 border-slate-500/10">
                        <Text className="text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Symptoms & Pathology:
                        </Text>
                        <Text className="mt-0.5 text-[11.5px] leading-4 opacity-90" style={{ color: palette.colors.text }}>
                          {item.symptoms}
                        </Text>

                        <Text className="mt-2 text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Dosage & Application:
                        </Text>
                        <Text className="mt-0.5 text-[11.5px] leading-4 text-cyan-600 dark:text-cyan-400 font-medium">
                          {item.dosage}
                        </Text>

                        {item.secondaryRemedies?.length > 0 && (
                          <View className="mt-1.5 flex-row items-center gap-1 flex-wrap">
                            <Text className="text-[10.5px] font-bold opacity-70" style={{ color: palette.colors.subtext }}>
                              Secondary Remedies:
                            </Text>
                            {item.secondaryRemedies.map((sec) => (
                              <View key={sec} className="rounded-md bg-slate-500/10 px-1.5 py-0.5">
                                <Text className="text-[10.5px]" style={{ color: palette.colors.text }}>
                                  {sec}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <Text className="mt-2 text-[10.5px] italic opacity-75" style={{ color: palette.colors.subtext }}>
                          💡 {item.notes}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: MATERIA MEDICA FOR FARM & GARDEN */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'MATERIA' && (
          <View className="flex-1">
            <View className="px-3 py-1">
              <View
                className="flex-row items-center rounded-xl border px-2.5 py-1"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <Ionicons name="search-outline" size={15} color={palette.colors.subtext} />
                <TextInput
                  value={repSearch}
                  onChangeText={setRepSearch}
                  placeholder="Search remedy name, plant indication, keynotes..."
                  placeholderTextColor={palette.colors.subtext}
                  className="ml-1.5 flex-1 text-[12px]"
                  style={{ color: palette.colors.text }}
                />
                {repSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRepSearch('')}>
                    <Ionicons name="close-circle" size={15} color={palette.colors.subtext} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={filteredMateria}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isExpanded = selectedRemedy?.id === item.id;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedRemedy(isExpanded ? null : item)}
                    className="mb-2 rounded-xl border p-2.5"
                    style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-[14px] font-bold text-teal-600 dark:text-teal-400">
                          {item.name}
                        </Text>
                        <Text className="text-[11px] opacity-75" style={{ color: palette.colors.subtext }}>
                          {item.commonName} • {item.source}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={palette.colors.subtext}
                      />
                    </View>

                    <View className="mt-1.5 rounded-lg bg-teal-500/10 p-1.5">
                      <Text className="text-[11.5px] font-medium" style={{ color: palette.colors.text }}>
                        🔑 <Text className="font-bold">Keynotes:</Text> {item.keynotes}
                      </Text>
                    </View>

                    {isExpanded && (
                      <View className="mt-2 border-t pt-2 border-slate-500/10">
                        <Text className="text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Agricultural Indications:
                        </Text>
                        <Text className="mt-0.5 text-[11.5px] leading-4 opacity-90" style={{ color: palette.colors.text }}>
                          {item.plantIndications}
                        </Text>

                        <Text className="mt-2 text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Pests & Pathogens Targeted:
                        </Text>
                        <Text className="mt-0.5 text-[11.5px] leading-4 text-rose-500 font-medium">
                          {item.pestsTargeted}
                        </Text>

                        <Text className="mt-2 text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Potency & Dosage:
                        </Text>
                        <Text className="mt-0.5 text-[11.5px] leading-4 text-cyan-600 dark:text-cyan-400 font-medium">
                          {item.potencyAdvice} • {item.applicationMethod}
                        </Text>

                        <Text className="mt-2 text-[11px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                          Synergies & Complements:
                        </Text>
                        <Text className="mt-0.5 text-[11px] italic opacity-75" style={{ color: palette.colors.subtext }}>
                          {item.synergies}
                        </Text>

                        <TouchableOpacity
                          onPress={() => openPrefilledModal(item)}
                          className="mt-3 flex-row items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2 shadow-sm">
                          <Ionicons name="add-circle-outline" size={15} color="#ffffff" />
                          <Text className="text-[12px] font-bold text-white">Log {item.name} Treatment</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: DIAGNOSTIC REMEDY FINDER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'FINDER' && (
          <ScrollView className="flex-1 px-3 py-1" showsVerticalScrollIndicator={false}>
            <View
              className="rounded-xl border p-3"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={18} color="#14b8a6" />
                <Text className="text-[14px] font-bold" style={{ color: palette.colors.text }}>
                  Interactive Agrohomeopathy Finder
                </Text>
              </View>
              <Text className="mt-1 text-[11.5px] opacity-75" style={{ color: palette.colors.subtext }}>
                Type your plant condition (e.g. rust, snails, aphids, pruning, blossom rot, yellow leaves, frost) to find Kaviraj's remedy:
              </Text>

              <View
                className="mt-2 flex-row items-center rounded-xl border px-2.5 py-1.5"
                style={{ backgroundColor: palette.colors.item, borderColor: palette.colors.border }}>
                <Ionicons name="search-outline" size={16} color={palette.colors.subtext} />
                <TextInput
                  value={finderQuery}
                  onChangeText={setFinderQuery}
                  placeholder="e.g., Tomato rot, slug damage, leaf rust, pruning..."
                  placeholderTextColor={palette.colors.subtext}
                  className="ml-2 flex-1 text-[12.5px]"
                  style={{ color: palette.colors.text }}
                />
              </View>

              {/* Quick Tag Suggestions */}
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {['Rust', 'Snails', 'Aphids', 'Pruning', 'Late Blight', 'Blossom Rot', 'Cold Frost'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setFinderQuery(tag)}
                    className="rounded-lg bg-teal-500/10 px-2 py-1 border border-teal-500/20">
                    <Text className="text-[10.5px] font-bold text-teal-600 dark:text-teal-400">
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Diagnostic Results */}
            <View className="mt-3 mb-10">
              <Text className="mb-2 text-[12.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                Matched Treatments ({finderResults.length})
              </Text>

              {finderResults.map((res) => (
                <View
                  key={res.id}
                  className="mb-2.5 rounded-xl border p-3"
                  style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                  <Text className="text-[13.5px] font-bold" style={{ color: palette.colors.text }}>
                    {res.name}
                  </Text>
                  <Text className="text-[11px] opacity-75" style={{ color: palette.colors.subtext }}>
                    Target: {res.crops}
                  </Text>
                  <Text className="mt-1 text-[11.5px] leading-4" style={{ color: palette.colors.text }}>
                    {res.symptoms}
                  </Text>

                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="rounded-lg bg-teal-500/15 px-2 py-1 border border-teal-500/25">
                      <Text className="text-[11.5px] font-bold text-teal-600 dark:text-teal-400">
                        Prescription: {res.primaryRemedy} ({res.potency})
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => openPrefilledModal(res)}
                      className="flex-row items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 shadow-sm">
                      <Ionicons name="add" size={14} color="#ffffff" />
                      <Text className="text-[11px] font-bold text-white">Log Entry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: BOOK PRINCIPLES & APPLICATION GUIDE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'GUIDE' && (
          <ScrollView className="flex-1 px-3 py-1" showsVerticalScrollIndicator={false}>
            {/* Book Overview Banner */}
            <View
              className="rounded-2xl border p-3.5 mb-2.5"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#14b8a6" />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold" style={{ color: palette.colors.text }}>
                    {BOOK_METADATA.title}
                  </Text>
                  <Text className="text-[11.5px] opacity-75" style={{ color: palette.colors.subtext }}>
                    {BOOK_METADATA.subtitle} • {BOOK_METADATA.author}
                  </Text>
                </View>
              </View>

              <Text className="mt-2 text-[11.5px] leading-4 opacity-85" style={{ color: palette.colors.text }}>
                {BOOK_METADATA.summary}
              </Text>
            </View>

            {/* Core Principles Cards */}
            <Text className="mb-1.5 text-[12.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
              Core Agrohomeopathic Principles
            </Text>

            {BOOK_PRINCIPLES.map((pr) => (
              <View
                key={pr.id}
                className="mb-2 rounded-xl border p-3"
                style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-bold text-teal-600 dark:text-teal-400">
                    {pr.title}
                  </Text>
                  <Text className="text-[10.5px] italic opacity-60" style={{ color: palette.colors.subtext }}>
                    {pr.latin}
                  </Text>
                </View>
                <Text className="mt-1 text-[11.5px] leading-4 opacity-90" style={{ color: palette.colors.text }}>
                  {pr.description}
                </Text>
              </View>
            ))}

            {/* Preparation Cheatsheet */}
            <View
              className="mb-10 rounded-xl border p-3"
              style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
              <Text className="text-[13px] font-bold" style={{ color: palette.colors.text }}>
                💧 Field Preparation Cheatsheet
              </Text>
              <View className="mt-2 gap-1.5">
                <Text className="text-[11.5px] opacity-85" style={{ color: palette.colors.text }}>
                  • <Text className="font-bold">Potency:</Text> 6X or 30C for acute field issues.
                </Text>
                <Text className="text-[11.5px] opacity-85" style={{ color: palette.colors.text }}>
                  • <Text className="font-bold">Dosage:</Text> 10 to 12 pellets dissolved in 10-20 Liters of unchlorinated water.
                </Text>
                <Text className="text-[11.5px] opacity-85" style={{ color: palette.colors.text }}>
                  • <Text className="font-bold">Succussion:</Text> Stir vigorously in vortex motion for 5-10 minutes.
                </Text>
                <Text className="text-[11.5px] opacity-85" style={{ color: palette.colors.text }}>
                  • <Text className="font-bold">Spraying Rule:</Text> Spray early morning or dusk. Never in harsh midday sun.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ADD / EDIT ENTRY MODAL */}
        {/* ------------------------------------------------------------- */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="max-h-[88%] rounded-t-3xl border-t p-4"
              style={{
                backgroundColor: palette.colors.page,
                borderColor: palette.colors.border,
              }}>
              <View className="flex-row items-center justify-between border-b pb-2.5" style={{ borderColor: palette.colors.border }}>
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="sprout" size={20} color="#14b8a6" />
                  <Text className="text-[16px] font-bold" style={{ color: palette.colors.text }}>
                    {t('addEntry')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                  <Ionicons name="close" size={20} color={palette.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5">
                {/* Crop Name */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('cropName')} *
                  </Text>
                  <TextInput
                    value={crop}
                    onChangeText={setCrop}
                    placeholder="e.g., Roma Tomato, Wheat, Apple Tree, Lettuce"
                    placeholderTextColor={palette.colors.subtext}
                    className="rounded-xl border p-2 text-[12.5px]"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                      color: palette.colors.text,
                    }}
                  />
                </View>

                {/* Plot / Location */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('plotLocation')}
                  </Text>
                  <TextInput
                    value={plot}
                    onChangeText={setPlot}
                    placeholder="e.g., North Greenhouse Plot 2, Orchard Block 4"
                    placeholderTextColor={palette.colors.subtext}
                    className="rounded-xl border p-2 text-[12.5px]"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                      color: palette.colors.text,
                    }}
                  />
                </View>

                {/* Symptoms / Observation */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('symptoms')} *
                  </Text>
                  <TextInput
                    value={symptoms}
                    onChangeText={setSymptoms}
                    placeholder="Describe leaf spots, pustules, slugs, aphids, pruning cuts, or wilting..."
                    placeholderTextColor={palette.colors.subtext}
                    multiline
                    numberOfLines={3}
                    className="rounded-xl border p-2 text-[12.5px]"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                      color: palette.colors.text,
                      minHeight: 55,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Homeopathic Remedy Quick Selector */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('remedy')} (Homoeopathy for Farm & Garden)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                    {COMMON_REMEDIES.map((r) => {
                      const isSelected = remedy === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setRemedy(r)}
                          className={`rounded-lg px-2.5 py-1 border ${
                            isSelected ? 'bg-teal-600 border-teal-600' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : palette.colors.card,
                            borderColor: isSelected ? undefined : palette.colors.border,
                          }}>
                          <Text
                            className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}
                            style={{ color: isSelected ? '#ffffff' : palette.colors.text }}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Potency */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('potency')}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {POTENCIES.map((p) => {
                      const isSelected = potency === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setPotency(p)}
                          className={`rounded-lg px-2.5 py-0.5 border ${
                            isSelected ? 'bg-teal-600 border-teal-600' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : palette.colors.card,
                            borderColor: isSelected ? undefined : palette.colors.border,
                          }}>
                          <Text
                            className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}
                            style={{ color: isSelected ? '#ffffff' : palette.colors.text }}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Dosage */}
                <View className="mb-2.5">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('dosageRecommended')}
                  </Text>
                  <TextInput
                    value={dosage}
                    onChangeText={setDosage}
                    placeholder="e.g., 10 pellets in 10L water for foliar spray"
                    placeholderTextColor={palette.colors.subtext}
                    className="rounded-xl border p-2 text-[12.5px]"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                      color: palette.colors.text,
                    }}
                  />
                </View>

                {/* Notes */}
                <View className="mb-3">
                  <Text className="mb-1 text-[11.5px] font-bold opacity-80" style={{ color: palette.colors.text }}>
                    {t('notes')}
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Field notes, follow-up schedule, weather details..."
                    placeholderTextColor={palette.colors.subtext}
                    className="rounded-xl border p-2 text-[12.5px]"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                      color: palette.colors.text,
                    }}
                  />
                </View>

                {/* Buttons */}
                <View className="mb-6 flex-row gap-2.5">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="flex-1 items-center justify-center rounded-xl border py-2.5"
                    style={{ backgroundColor: palette.colors.card, borderColor: palette.colors.border }}>
                    <Text className="text-[12.5px] font-bold" style={{ color: palette.colors.text }}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveNewEntry}
                    className="flex-1 items-center justify-center rounded-xl bg-teal-600 py-2.5 shadow-md">
                    <Text className="text-[12.5px] font-bold text-white">
                      {t('save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </AppScreen>
  );
}
