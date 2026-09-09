import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const interviewTypes = ['Technical', 'HR', 'Cultural Fit', 'Managerial', 'Final Round'];
const durations = ['30 min', '45 min', '60 min', '90 min'];
const interviewers = ['Anika Sharma', 'Rahul Mehta', 'Priya Kapoor', 'Vikram Singh'];

export default function InterviewScheduler({ visible, onClose, candidateName }) {
  const [form, setForm] = useState({ date: '', time: '', type: 'Technical', duration: '60 min', interviewer: '', notes: '', mode: 'Video Call' });
  const [step, setStep] = useState(0);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSchedule = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <Pressable onPress={step > 0 ? () => setStep(s => s - 1) : onClose}>
            <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-[16px] font-bold text-slate-900">Schedule Interview</Text>
          <View style={{ width: 22 }} />
        </View>

        <View className="flex-row justify-center gap-1.5 px-5 py-3">
          {[0, 1, 2].map(i => (
            <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </View>

        <ScrollView className="flex-1 px-5 pt-3">
          {step === 0 && (
            <View>
              <View className="flex-row items-center gap-2 p-3 mb-4 rounded-xl bg-slate-50 border border-slate-100">
                <Ionicons name="person-outline" size={16} color="#64748b" />
                <Text className="text-[12px] text-slate-700">With: <Text className="font-bold">{candidateName || 'Candidate'}</Text></Text>
              </View>

              <Text className="text-[13px] font-bold text-slate-900 mb-2">Interview Type</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {interviewTypes.map(t => (
                  <Pressable key={t} onPress={() => update('type', t)} className={`rounded-full px-4 py-2 ${form.type === t ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    <Text className={`text-[11px] font-bold ${form.type === t ? 'text-white' : 'text-slate-600'}`}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-bold text-slate-900 mb-2">Mode</Text>
              <View className="flex-row gap-2 mb-4">
                {['Video Call', 'Phone Call', 'In-Person'].map(m => (
                  <Pressable key={m} onPress={() => update('mode', m)} className={`rounded-full px-4 py-2 ${form.mode === m ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    <Text className={`text-[11px] font-bold ${form.mode === m ? 'text-white' : 'text-slate-600'}`}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-bold text-slate-900 mb-2">Duration</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {durations.map(d => (
                  <Pressable key={d} onPress={() => update('duration', d)} className={`rounded-full px-4 py-2 ${form.duration === d ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    <Text className={`text-[11px] font-bold ${form.duration === d ? 'text-white' : 'text-slate-600'}`}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Date</Text>
              <TextInput value={form.date} onChangeText={v => update('date', v)} placeholder="e.g. 15 Aug 2026" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Time</Text>
              <TextInput value={form.time} onChangeText={v => update('time', v)} placeholder="e.g. 10:00 AM" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-2">Interviewer</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {interviewers.map(i => (
                  <Pressable key={i} onPress={() => update('interviewer', i)} className={`rounded-full px-4 py-2 ${form.interviewer === i ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    <Text className={`text-[11px] font-bold ${form.interviewer === i ? 'text-white' : 'text-slate-600'}`}>{i}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Interview Notes / Agenda</Text>
              <TextInput value={form.notes} onChangeText={v => update('notes', v)} placeholder="Topics to cover, questions to ask, or any special instructions..." placeholderTextColor="#94a3b8" multiline numberOfLines={5} className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4 min-h-[100px]" textAlignVertical="top" />

              {/* Summary */}
              <View className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <Text className="text-[12px] font-bold text-slate-900 mb-2">Summary</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Type</Text><Text className="text-[10px] font-bold text-slate-900">{form.type}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Mode</Text><Text className="text-[10px] font-bold text-slate-900">{form.mode}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Duration</Text><Text className="text-[10px] font-bold text-slate-900">{form.duration}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Date</Text><Text className="text-[10px] font-bold text-slate-900">{form.date || 'Not set'}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Time</Text><Text className="text-[10px] font-bold text-slate-900">{form.time || 'Not set'}</Text></View>
                  <View className="flex-row justify-between"><Text className="text-[10px] text-slate-500">Interviewer</Text><Text className="text-[10px] font-bold text-slate-900">{form.interviewer || 'Not assigned'}</Text></View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="px-5 pb-8 pt-3 border-t border-slate-100">
          <Pressable
            onPress={step < 2 ? () => setStep(s => s + 1) : handleSchedule}
            className="w-full rounded-xl bg-indigo-600 py-3.5 items-center"
          >
            <Text className="text-[14px] font-bold text-white">
              {step < 2 ? `Continue (${step + 1}/3)` : 'Schedule Interview'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
