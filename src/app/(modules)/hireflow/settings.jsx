import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const sections = [
  { id: 'stages', label: 'Pipeline Stages', icon: 'git-branch-outline' },
  { id: 'email', label: 'Email Templates', icon: 'mail-outline' },
  { id: 'workflow', label: 'Workflow Automation', icon: 'settings-outline' },
  { id: 'scoring', label: 'Scoring Criteria', icon: 'star-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
];

const stageConfigs = ['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'];

const emailTemplates = [
  { id: '1', name: 'Application Received', subject: 'Thank you for your application', used: 24 },
  { id: '2', name: 'Interview Invitation', subject: 'Invitation to interview', used: 18 },
  { id: '3', name: 'Offer Letter', subject: 'Congratulations! Offer of employment', used: 6 },
  { id: '4', name: 'Rejection', subject: 'Update on your application', used: 12 },
];

const automationRules = [
  { id: '1', trigger: 'Scorecard submitted with rating ≥ 4', action: 'Auto-advance to next stage', active: true },
  { id: '2', trigger: 'Offer accepted', action: 'Move to Hired stage, notify HR', active: true },
  { id: '3', trigger: 'No activity for 7 days', action: 'Send follow-up email', active: false },
];

export default function SettingsScreen() {
  const { palette } = useAppTheme();
  const [activeSection, setActiveSection] = useState('stages');

  const SectionTitle = ({ title, sub }) => (
    <View className="mb-4">
      <Text className={`text-[15px] font-bold ${palette.text}`}>{title}</Text>
      {sub && <Text className={`text-[11px] ${palette.textMuted} mt-0.5`}>{sub}</Text>}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-4 pb-8 pt-4">
          <View className="mb-5">
            <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
            <Text className={`mt-1 text-2xl font-bold ${palette.text}`}>Settings</Text>
          </View>

          {/* Section nav */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            <View className="flex-row gap-1.5">
              {sections.map(s => (
                <Pressable key={s.id} onPress={() => setActiveSection(s.id)} className={`flex-row items-center gap-1.5 rounded-lg px-3.5 py-2 ${activeSection === s.id ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                  <Ionicons name={s.icon} size={14} color={activeSection === s.id ? '#fff' : '#64748b'} />
                  <Text className={`text-[10px] font-bold ${activeSection === s.id ? 'text-white' : 'text-slate-600'}`}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {activeSection === 'stages' && (
            <View className={`rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <SectionTitle title="Pipeline Stages" sub="Customize your recruitment pipeline stages and their order." />
              {stageConfigs.map((s, i) => (
                <View key={s} className="flex-row items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                  <View className={`h-8 w-8 items-center justify-center rounded-lg ${palette.surfaceMuted}`}>
                    <Text className={`text-[11px] font-bold ${palette.textMuted}`}>{i + 1}</Text>
                  </View>
                  <Text className={`flex-1 text-[13px] font-medium ${palette.text}`}>{s}</Text>
                  <TouchableOpacity className={`rounded-lg px-3 py-1.5 ${palette.surfaceMuted}`}>
                    <Ionicons name="pencil-outline" size={14} color={palette.textMutedColor} />
                  </TouchableOpacity>
                  <TouchableOpacity className={`rounded-lg px-3 py-1.5 ${palette.surfaceMuted}`}>
                    <Ionicons name="close-outline" size={14} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              ))}
              <Pressable className="flex-row items-center justify-center gap-1.5 mt-3 py-2 rounded-lg bg-indigo-500/10">
                <Ionicons name="add" size={16} color="#6366f1" />
                <Text className="text-[11px] font-bold text-indigo-600">Add Stage</Text>
              </Pressable>
            </View>
          )}

          {activeSection === 'email' && (
            <View className={`rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <SectionTitle title="Email Templates" sub="Manage email templates used for candidate communication." />
              {emailTemplates.map(t => (
                <View key={t.id} className="mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[13px] font-bold text-slate-900">{t.name}</Text>
                    <View className="rounded-full bg-indigo-500/10 px-2 py-0.5">
                      <Text className="text-[8px] font-bold text-indigo-600">Used {t.used}x</Text>
                    </View>
                  </View>
                  <Text className="text-[10px] text-slate-500">{t.subject}</Text>
                  <View className="flex-row gap-1.5 mt-2">
                    <Pressable className="rounded-lg bg-indigo-600 px-3 py-1">
                      <Text className="text-[8px] font-bold text-white">Edit</Text>
                    </Pressable>
                    <Pressable className="rounded-lg bg-slate-200 px-3 py-1">
                      <Text className="text-[8px] font-bold text-slate-600">Preview</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <Pressable className="flex-row items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/10">
                <Ionicons name="add" size={16} color="#6366f1" />
                <Text className="text-[11px] font-bold text-indigo-600">Add Template</Text>
              </Pressable>
            </View>
          )}

          {activeSection === 'workflow' && (
            <View className={`rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <SectionTitle title="Workflow Automation" sub="Automate repetitive recruitment tasks based on triggers." />
              {automationRules.map(r => (
                <View key={r.id} className="mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className={`h-6 w-6 items-center justify-center rounded-lg ${r.active ? 'bg-emerald-500/10' : 'bg-slate-200'}`}>
                      <Ionicons name={r.active ? 'flash' : 'flash-outline'} size={12} color={r.active ? '#22c55e' : '#94a3b8'} />
                    </View>
                    <TouchableOpacity className={`rounded-full px-3 py-1 ${r.active ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                      <Text className="text-[8px] font-bold text-white">{r.active ? 'Active' : 'Disabled'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[11px] text-slate-700"><Text className="font-bold">When:</Text> {r.trigger}</Text>
                  <Text className="text-[11px] text-slate-700"><Text className="font-bold">Then:</Text> {r.action}</Text>
                </View>
              ))}
              <Pressable className="flex-row items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/10">
                <Ionicons name="add" size={16} color="#6366f1" />
                <Text className="text-[11px] font-bold text-indigo-600">Add Rule</Text>
              </Pressable>
            </View>
          )}

          {activeSection === 'scoring' && (
            <View className={`rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <SectionTitle title="Scoring Criteria" sub="Configure evaluation attributes used in candidate scorecards." />
              {['Technical Proficiency', 'Culture Fit', 'Growth Potential', 'Communication', 'Problem Solving'].map((attr, i) => (
                <View key={i} className="flex-row items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Text className="text-[11px] font-bold text-indigo-600">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-[13px] text-slate-800">{attr}</Text>
                  <TouchableOpacity className="rounded-lg bg-slate-100 px-3 py-1.5">
                    <Ionicons name="pencil-outline" size={13} color="#64748b" />
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-0.5">
                    <Ionicons name="arrow-up" size={13} color="#94a3b8" />
                    <Ionicons name="arrow-down" size={13} color="#94a3b8" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeSection === 'notifications' && (
            <View className={`rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <SectionTitle title="Notification Preferences" sub="Control when and how you receive notifications." />
              {[
                { label: 'New application received', key: 'new_app' },
                { label: 'Candidate stage changes', key: 'stage_change' },
                { label: 'Interview reminders', key: 'interview_reminder' },
                { label: 'Scorecard submitted', key: 'scorecard' },
                { label: 'Offer accepted/rejected', key: 'offer' },
              ].map((n, i) => (
                <View key={i} className="flex-row items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <Text className="text-[12px] text-slate-700 flex-1">{n.label}</Text>
                  <TouchableOpacity className={`rounded-full px-4 py-1 ${i < 3 ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <Text className={`text-[9px] font-bold ${i < 3 ? 'text-white' : 'text-slate-400'}`}>{i < 3 ? 'On' : 'Off'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
