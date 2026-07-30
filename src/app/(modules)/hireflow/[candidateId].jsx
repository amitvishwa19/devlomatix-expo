import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import ScorecardForm from './_components/ScorecardForm';
import TeamNotes from './_components/TeamNotes';
import CommunicationPanel from './_components/CommunicationPanel';
import OfferLetterModal from './_components/OfferLetterModal';
import * as hireflowService from '~/services/hireflow';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'information-circle-outline' },
  { id: 'scorecards', label: 'Scorecards', icon: 'star-outline' },
  { id: 'communication', label: 'Communication', icon: 'chatbubbles-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { id: 'activity', label: 'Activity', icon: 'pulse-outline' },
  { id: 'resume', label: 'Resume', icon: 'document-outline' },
];

const fallbackCandidate = {
  id: '1',
  name: 'Candidate Profile',
  role: 'Applicant',
  email: 'N/A',
  phone: 'N/A',
  location: 'Remote',
  stage: 'Applied',
  score: 'N/A',
  skills: [],
  experience: [],
  applied: 'recently',
  source: 'Direct',
};

export default function CandidateProfileScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { candidateId } = useLocalSearchParams();
  const [tab, setTab] = useState('overview');
  const [showScorecard, setShowScorecard] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidateDetails = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await hireflowService.getCandidate(candidateId);
      setCandidate(res.data);
    } catch (e) {
      console.error('Failed to fetch candidate details:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch candidate profile');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidateDetails();
  }, [fetchCandidateDetails]);

  const c = candidate || fallbackCandidate;
  const candidateName = c.name || 'Candidate';
  const activityTimeline = c.activities || [
    { action: 'Application submitted', date: c.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : 'Recently', icon: 'document-outline', color: '#6366f1' },
  ];

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-[14px] ${palette.textSoft}`}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <View className="flex-1">
        {/* Header */}
        <View className={`px-4 pt-3 pb-3 border-b ${palette.border}`}>
          <View className="flex-row items-center justify-between mb-2">
            <Pressable onPress={() => router.back()} className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Ionicons name="arrow-back" size={18} color="#0f172a" />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Ionicons name="call-outline" size={16} color="#6366f1" />
              </Pressable>
              <Pressable className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Ionicons name="mail-outline" size={16} color="#6366f1" />
              </Pressable>
              <Pressable onPress={() => setShowOffer(true)} className="flex-row items-center gap-1 rounded-lg bg-indigo-600 px-3">
                <Ionicons name="document-text-outline" size={14} color="#fff" />
                <Text className="text-[10px] font-bold text-white">Offer</Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
              <Text className="text-[18px] font-bold text-indigo-600">
                {candidateName.split(' ').map(n => n[0]).join('') || '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-[18px] font-bold ${palette.text}`}>{candidateName}</Text>
              <Text className={`text-[12px] ${palette.textSoft}`}>{c.role || c.jobTitle || 'Applicant'}</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                  <Ionicons name="sparkles" size={10} color="#f59e0b" />
                  <Text className="text-[9px] font-bold text-amber-600">{c.score || 'N/A'}</Text>
                </View>
                <View className={`rounded-full px-2 py-0.5 bg-blue-500/10`}>
                  <Text className="text-[8px] font-bold text-blue-600">{c.stage || 'Applied'}</Text>
                </View>
                <Text className={`text-[9px] ${palette.textMuted}`}>Applied {c.applied || 'recently'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`px-4 py-2 border-b ${palette.border}`}>
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
        <ScrollView className="flex-1 px-4 pt-4">
          {tab === 'overview' && (
            <View>
              {/* AI Summary */}
              <View className="p-4 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="sparkles" size={16} color="#6366f1" />
                  <Text className="text-[13px] font-bold text-indigo-900">AI Smart Summary</Text>
                </View>
                <Text className="text-[11px] text-slate-700 leading-4 mb-2">
                  {c.summary || `${candidateName} has applied for ${c.role || 'the open role'}. Skills evaluated include ${(c.skills || []).join(', ') || 'general technical competencies'}.`}
                </Text>
              </View>

              {/* Professional Profile */}
              {c.experience && c.experience.length > 0 && (
                <View className="p-4 mb-4 rounded-xl bg-white border border-slate-200">
                  <Text className="text-[13px] font-bold text-slate-900 mb-3">Professional Profile</Text>
                  {c.experience.map((exp, i) => (
                    <View key={i} className="mb-3 pb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                            <Ionicons name="briefcase-outline" size={14} color="#6366f1" />
                          </View>
                          <View>
                            <Text className="text-[12px] font-bold text-slate-900">{exp.role}</Text>
                            <Text className="text-[10px] text-slate-500">{exp.company}</Text>
                          </View>
                        </View>
                        <Text className="text-[9px] text-slate-400">{exp.period}</Text>
                      </View>
                      <Text className="text-[10px] text-slate-600 mt-1.5 ml-10">{exp.desc}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contact + Source */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 p-3.5 rounded-xl bg-white border border-slate-200">
                  <Text className="text-[11px] font-bold text-slate-900 mb-2">Contact</Text>
                  <View className="gap-2">
                    <View className="flex-row items-center gap-1.5"><Ionicons name="mail-outline" size={12} color="#64748b" /><Text className="text-[10px] text-slate-600">{c.email || 'N/A'}</Text></View>
                    <View className="flex-row items-center gap-1.5"><Ionicons name="call-outline" size={12} color="#64748b" /><Text className="text-[10px] text-slate-600">{c.phone || 'N/A'}</Text></View>
                    <View className="flex-row items-center gap-1.5"><Ionicons name="location-outline" size={12} color="#64748b" /><Text className="text-[10px] text-slate-600">{c.location || 'Remote'}</Text></View>
                  </View>
                </View>
                <View className="flex-1 p-3.5 rounded-xl bg-white border border-slate-200">
                  <Text className="text-[11px] font-bold text-slate-900 mb-2">Source</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="globe-outline" size={14} color="#6366f1" />
                    <Text className="text-[12px] font-bold text-indigo-600">{c.source || 'Direct'}</Text>
                  </View>
                </View>
              </View>

              {/* Skills */}
              {c.skills && c.skills.length > 0 && (
                <View className="p-3.5 mb-4 rounded-xl bg-white border border-slate-200">
                  <Text className="text-[11px] font-bold text-slate-900 mb-2">Skills</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {c.skills.map((s, i) => (
                      <View key={i} className="rounded-lg bg-slate-100 px-2.5 py-1">
                        <Text className="text-[10px] font-medium text-slate-700">{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {tab === 'scorecards' && (
            showScorecard ? (
              <ScorecardForm candidateName={candidateName} onSubmit={() => setShowScorecard(false)} />
            ) : (
              <View>
                <Pressable onPress={() => setShowScorecard(true)} className="flex-row items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 mb-4">
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text className="text-[13px] font-bold text-white">Launch Scorecard</Text>
                </Pressable>
                <View className="items-center py-10">
                  <Ionicons name="star-outline" size={32} color="#cbd5e1" />
                  <Text className="text-[12px] text-slate-400 mt-2 italic">No scorecards submitted yet</Text>
                </View>
              </View>
            )
          )}

          {tab === 'communication' && (
            <CommunicationPanel candidateEmail={c.email} candidateName={candidateName} />
          )}

          {tab === 'notes' && (
            <TeamNotes candidateName={candidateName} />
          )}

          {tab === 'activity' && (
            <View className="mb-4">
              <Text className="text-[13px] font-bold text-slate-900 mb-3">Activity Timeline</Text>
              <View className="relative">
                <View className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200" />
                {activityTimeline.map((a, i) => (
                  <View key={i} className="flex-row items-start gap-3 pb-4 last:pb-0">
                    <View style={{ backgroundColor: (a.color || '#6366f1') + '20' }} className="h-8 w-8 items-center justify-center rounded-full z-10">
                      <Ionicons name={a.icon || 'document-outline'} size={14} color={a.color || '#6366f1'} />
                    </View>
                    <View className="flex-1 pt-1">
                      <Text className="text-[12px] text-slate-700">{a.action || a.title || 'Activity recorded'}</Text>
                      <Text className="text-[9px] text-slate-400 mt-0.5">{a.date || a.timestamp || 'Recently'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'resume' && (
            <View className="items-center py-16">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="document-outline" size={28} color="#94a3b8" />
              </View>
              <Text className="text-[14px] font-bold text-slate-400">
                {c.resume ? 'Resume Available' : 'No Resume Attached'}
              </Text>
              <Text className="text-[11px] text-slate-400 mt-1">
                {c.resume ? c.resume : 'Upload a resume to view it here.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <OfferLetterModal visible={showOffer} onClose={() => setShowOffer(false)} candidateName={candidateName} />
    </SafeAreaView>
  );
}
