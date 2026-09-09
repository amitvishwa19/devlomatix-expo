import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import ScorecardForm from './ScorecardForm';
import TeamNotes from './TeamNotes';
import CommunicationPanel from './CommunicationPanel';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'information-circle-outline' },
  { id: 'scorecards', label: 'Scorecards', icon: 'star-outline' },
  { id: 'communication', label: 'Communication', icon: 'chatbubbles-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { id: 'resume', label: 'Resume', icon: 'document-outline' },
];

const sampleSkills = ['React', 'TypeScript', 'Tailwind', 'GraphQL', 'Node.js'];

export default function CandidateDetailsModal({ visible, onClose, candidate }) {
  const [tab, setTab] = useState('overview');
  const [showScorecard, setShowScorecard] = useState(false);

  if (!candidate) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-5 pt-14 pb-3 border-b border-slate-100">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </Pressable>
            <Pressable className="flex-row items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2">
              <Ionicons name="mail-outline" size={14} color="#fff" />
              <Text className="text-[11px] font-bold text-white">Generate Offer</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
              <Text className="text-[16px] font-bold text-indigo-600">
                {candidate.name?.split(' ').map(n => n[0]).join('') || '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-bold text-slate-900">{candidate.name}</Text>
              <Text className="text-[12px] text-slate-500">{candidate.role}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-2 border-b border-slate-100">
          <View className="flex-row gap-1">
            {tabs.map(t => (
              <Pressable key={t.id} onPress={() => { setTab(t.id); setShowScorecard(false); }} className={`flex-row items-center gap-1.5 rounded-lg px-3 py-2 ${tab === t.id ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                <Ionicons name={t.icon} size={13} color={tab === t.id ? '#fff' : '#64748b'} />
                <Text className={`text-[10px] font-bold ${tab === t.id ? 'text-white' : 'text-slate-600'}`}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Content */}
        <ScrollView className="flex-1 px-5 pt-4">
          {tab === 'overview' && (
            <View>
              {/* AI Summary */}
              <View className="p-4 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="sparkles" size={16} color="#6366f1" />
                  <Text className="text-[12px] font-bold text-indigo-900">AI Smart Summary</Text>
                </View>
                <View className="flex-row items-center gap-1 mb-2">
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text className="text-[14px] font-bold text-amber-600">{candidate.score || 'N/A'}</Text>
                  <Text className="text-[10px] text-indigo-600">AI Match Score</Text>
                </View>
                <Text className="text-[11px] text-slate-700 leading-4">Strong candidate with excellent technical background in React and TypeScript. 5+ years of experience building scalable frontend applications.</Text>
                <View className="flex-row gap-3 mt-2">
                  <View className="flex-row items-center gap-1"><Ionicons name="checkmark-circle" size={12} color="#22c55e" /><Text className="text-[9px] text-emerald-700">Strong React skills</Text></View>
                  <View className="flex-row items-center gap-1"><Ionicons name="alert-circle" size={12} color="#d97706" /><Text className="text-[9px] text-amber-700">No GraphQL exp</Text></View>
                </View>
                <Pressable className="mt-2 self-start rounded-lg bg-indigo-600 px-3 py-1">
                  <Text className="text-[9px] font-bold text-white">Analyze Resume</Text>
                </Pressable>
              </View>

              {/* Contact */}
              <View className="p-3.5 mb-4 rounded-xl bg-slate-50 border border-slate-100">
                <View className="gap-2">
                  <View className="flex-row items-center gap-2"><Ionicons name="mail-outline" size={14} color="#64748b" /><Text className="text-[11px] text-slate-700">{candidate.email || 'N/A'}</Text></View>
                  <View className="flex-row items-center gap-2"><Ionicons name="call-outline" size={14} color="#64748b" /><Text className="text-[11px] text-slate-700">{candidate.phone || 'N/A'}</Text></View>
                  <View className="flex-row items-center gap-2"><Ionicons name="location-outline" size={14} color="#64748b" /><Text className="text-[11px] text-slate-700">{candidate.location || 'N/A'}</Text></View>
                </View>
              </View>

              {/* Skills */}
              <View className="mb-4">
                <Text className="text-[12px] font-bold text-slate-900 mb-2">Skills</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {(candidate.skills || sampleSkills).map((s, i) => (
                    <View key={i} className="rounded-lg bg-slate-100 px-2.5 py-1">
                      <Text className="text-[10px] font-medium text-slate-700">{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {tab === 'scorecards' && (
            showScorecard ? (
              <ScorecardForm candidateName={candidate.name} onSubmit={() => setShowScorecard(false)} />
            ) : (
              <View>
                <Pressable onPress={() => setShowScorecard(true)} className="flex-row items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 mb-4">
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text className="text-[13px] font-bold text-white">Launch Scorecard</Text>
                </Pressable>
                <Text className="text-[11px] text-slate-400 text-center italic">No scorecards submitted yet for this candidate.</Text>
              </View>
            )
          )}

          {tab === 'communication' && (
            <CommunicationPanel candidateEmail={candidate.email} candidateName={candidate.name} />
          )}

          {tab === 'notes' && (
            <TeamNotes candidateName={candidate.name} />
          )}

          {tab === 'resume' && (
            <View className="items-center py-16">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="document-outline" size={28} color="#94a3b8" />
              </View>
              <Text className="text-[14px] font-bold text-slate-400">No Resume Attached</Text>
              <Text className="text-[11px] text-slate-400 mt-1">Upload a resume to view it here.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
