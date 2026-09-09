import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { AddLeadModal } from './_components/CurexaModals';
import { createCrmLead, getCrmLeads, updateCrmLeadStage } from '~/services/curexa';

const initialLeads = [
  {
    id: '301',
    name: 'Samantha Wright',
    phone: '+1 (555) 392-1049',
    treatment: 'Full Cardiac Health Package',
    source: 'Website',
    value: '$2,400',
    stage: 'New Lead',
    score: '92',
    date: '2026-08-01',
  },
  {
    id: '302',
    name: 'David Miller',
    phone: '+1 (555) 481-9021',
    treatment: 'Knee Replacement Surgery Consult',
    source: 'Google Ads',
    value: '$12,500',
    stage: 'Consulted',
    score: '88',
    date: '2026-07-29',
  },
  {
    id: '303',
    name: 'Jessica Alba',
    phone: '+1 (555) 712-4091',
    treatment: 'Comprehensive MRI & Spine Check',
    source: 'Referral Desk',
    value: '$1,800',
    stage: 'Follow-up',
    score: '75',
    date: '2026-07-30',
  },
  {
    id: '304',
    name: 'Thomas Wayne',
    phone: '+1 (555) 201-9843',
    treatment: 'Bariatric Consultation & Plan',
    source: 'Website',
    value: '$8,200',
    stage: 'Converted',
    score: '98',
    date: '2026-07-28',
  },
  {
    id: '305',
    name: 'Rachel Green',
    phone: '+1 (555) 654-3210',
    treatment: 'Pediatric Allergy Panel',
    source: 'Facebook Campaign',
    value: '$950',
    stage: 'New Lead',
    score: '80',
    date: '2026-08-02',
  },
];

const STAGES = ['New Lead', 'Consulted', 'Follow-up', 'Converted'];

export default function CurexaCrmScreen() {
  const { palette } = useAppTheme();
  const [leads, setLeads] = useState([]);
  const [stageFilter, setStageFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      const res = await getCrmLeads();
      if (res && res.leads) {
        const formatted = res.leads.map((l) => ({
          id: l.id.slice(-4),
          name: l.title || 'Lead Contact',
          phone: l.description?.split('Phone: ')?.[1] || '+1 (555) 000-0000',
          treatment: l.description?.split('Treatment: ')?.[1]?.split(' |')?.[0] || 'General Consultation',
          source: 'Website',
          value: '$2,500',
          stage: l.priority || 'New Lead',
          score: '90',
          date: l.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));
        setLeads(formatted);
      } else {
        setLeads([]);
      }
    }
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => stageFilter === 'All' || l.stage === stageFilter);
  }, [leads, stageFilter]);

  const handleAddLead = async (newLead) => {
    setLeads((prev) => [newLead, ...prev]);
    await createCrmLead(newLead);
  };

  const moveLeadNext = async (id) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const currentIdx = STAGES.indexOf(l.stage);
          if (currentIdx < STAGES.length - 1) {
            const nextStage = STAGES[currentIdx + 1];
            updateCrmLeadStage({ leadId: id, stage: nextStage });
            return { ...l, stage: nextStage };
          }
        }
        return l;
      })
    );
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'New Lead':
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
      case 'Consulted':
        return { bg: 'bg-purple-500/20', text: 'text-purple-600' };
      case 'Follow-up':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
      case 'Converted':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
      default:
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Health CRM Engine"
        showBack={true}
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="sparkles" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Lead</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Pipeline Summary Cards */}
        <View className="mb-3 flex-row gap-2">
          <View className={`flex-1 rounded-[20px] p-3 bg-purple-500/15`}>
            <Text className={`text-[11px] ${palette.textMuted}`}>Active Leads</Text>
            <Text className={`mt-0.5 text-[20px] font-bold ${palette.text}`}>{leads.length}</Text>
          </View>
          <View className={`flex-1 rounded-[20px] p-3 bg-emerald-500/15`}>
            <Text className={`text-[11px] ${palette.textMuted}`}>Pipeline Value</Text>
            <Text className={`mt-0.5 text-[20px] font-bold ${palette.text}`}>$148.5K</Text>
          </View>
          <View className={`flex-1 rounded-[20px] p-3 bg-sky-500/15`}>
            <Text className={`text-[11px] ${palette.textMuted}`}>Conversion Rate</Text>
            <Text className={`mt-0.5 text-[20px] font-bold ${palette.text}`}>68%</Text>
          </View>
        </View>

        {/* Stage Filter Tabs */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
            {['All', 'New Lead', 'Consulted', 'Follow-up', 'Converted'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setStageFilter(st)}
                className={`rounded-full px-3.5 py-1.5 ${
                  stageFilter === st ? 'bg-emerald-600' : palette.surfaceInset
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    stageFilter === st ? 'text-white' : palette.textMuted
                  }`}
                >
                  {st}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Lead List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="gap-2.5 pb-8">
            {filteredLeads.map((lead) => {
              const badge = getStageBadge(lead.stage);
              return (
                <View key={lead.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-[16px] font-bold ${palette.text}`}>{lead.name}</Text>
                      <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-emerald-600">{lead.score}% Intent</Text>
                      </View>
                    </View>

                    <View className={`rounded-full px-2.5 py-0.5 ${badge.bg}`}>
                      <Text className={`text-[10px] font-bold ${badge.text}`}>{lead.stage}</Text>
                    </View>
                  </View>

                  <Text className={`mt-1 text-[12px] font-semibold text-emerald-600`}>
                    {lead.treatment}
                  </Text>

                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className={`text-[11px] ${palette.textSoft}`}>
                      Source: <Text className="font-semibold">{lead.source}</Text>
                    </Text>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>Est: {lead.value}</Text>
                  </View>

                  {/* Actions & Contact */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-gray-200/10 pt-2.5">
                    <Text className={`text-[11px] ${palette.textMuted}`}>{lead.phone}</Text>
                    <View className="flex-row items-center gap-2">
                      <Pressable className="rounded-xl bg-emerald-600 p-2">
                        <Ionicons name="call" size={14} color="#ffffff" />
                      </Pressable>
                      <Pressable className="rounded-xl bg-sky-600 p-2">
                        <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                      </Pressable>
                      {lead.stage !== 'Converted' && (
                        <Pressable
                          onPress={() => moveLeadNext(lead.id)}
                          className="flex-row items-center gap-1 rounded-xl bg-gray-500/15 px-2.5 py-1.5"
                        >
                          <Text className={`text-[10px] font-bold ${palette.text}`}>Advance Stage</Text>
                          <Ionicons name="chevron-forward" size={12} color={palette.textColor} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Add Lead Modal */}
      <AddLeadModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddLead}
      />
    </AppScreen>
  );
}
