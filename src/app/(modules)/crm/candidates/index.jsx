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
  Linking,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import CandidateCard from '../_components/CandidateCard';
import ConvertCandidateModal from '../_components/ConvertCandidateModal';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const STAGE_FILTERS = [
  { id: 'ALL', label: 'All Stages' },
  { id: 'APPLIED', label: 'Applied' },
  { id: 'SCREENING', label: 'Screening' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer Sent' },
  { id: 'HIRED', label: 'Hired' },
];

export default function CrmCandidatesDirectoryScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Convert Modal State
  const [convertCandidate, setConvertCandidate] = useState(null);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const wsId = await resolveWorkspaceId();
      const res = await hireflowService.getCandidates(wsId);
      if (res?.data) {
        setCandidates(res.data);
      } else if (Array.isArray(res)) {
        setCandidates(res);
      }
    } catch (err) {
      console.warn('Error loading CRM candidates:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

  const handleSendWhatsApp = (candidate) => {
    if (!candidate.phone) return;
    const cleanPhone = candidate.phone.replace(/[^\d+]/g, '');
    const text = encodeURIComponent(
      `Hello ${candidate.name || 'there'},\n\n` +
      `Reaching out from Devlomatix Talent & Staffing regarding your application for the ${candidate.job?.title || 'open role'}.\n` +
      `Would you have a few minutes for a quick conversation today?\n\n` +
      `Best regards,\nDevlomatix Hiring Team`
    );
    Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${text}`);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (selectedStage !== 'ALL') {
      const stage = (c.status || c.stage || 'APPLIED').toUpperCase();
      if (stage !== selectedStage) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchJob = (c.job?.title || c.jobTitle || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchJob) return false;
    }
    return true;
  });

  return (
    <AppScreen>
      <CrmHeader
        title="Candidates"
        subtitle={`${candidates.length} Profiles • HireFlow ATS Bridge`}
        showBack={true}
      />

      <ConvertCandidateModal
        candidate={convertCandidate}
        visible={!!convertCandidate}
        onClose={() => setConvertCandidate(null)}
        onConverted={loadCandidates}
      />

      {/* Filter and Search Bar */}
      <View
        className="px-3 py-2 border-b"
        style={{
          backgroundColor: colors.header,
          borderColor: colors.border,
        }}
      >
        {/* Search */}
        <View
          className="flex-row items-center gap-x-2 rounded-xl px-3.5 py-2.5 min-h-[46px] border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search candidates by name, job, email..."
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

        {/* Stage Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 10 }}
          className="mt-2 flex-row py-0.5"
        >
          {STAGE_FILTERS.map((f) => {
            const isSelected = selectedStage === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedStage(f.id)}
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

      {/* Candidates List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-xs font-semibold" style={{ color: colors.textMuted }}>
            Loading Candidates...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCandidates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CandidateCard
              candidate={item}
              onSendWhatsApp={handleSendWhatsApp}
              onConvertDeal={(c) => setConvertCandidate(c)}
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
                <Ionicons name="people-outline" size={28} color={colors.textMuted} />
              </View>
              <Text className="text-sm font-bold text-center" style={{ color: colors.text }}>
                {searchQuery || selectedStage !== 'ALL' ? 'No Matching Candidates' : 'No Candidates Ingested'}
              </Text>
              <Text className="mt-1 text-xs text-center leading-relaxed" style={{ color: colors.textMuted }}>
                {searchQuery || selectedStage !== 'ALL'
                  ? 'Try clearing your search query or selecting All Stages.'
                  : 'Candidates submitted through HireFlow job postings or candidate APIs will automatically appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}
