import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const sources = ['LinkedIn', 'Referral', 'Company Site', 'Job Board', 'Social Media', 'Other'];

export default function AddCandidateModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', skills: '', summary: '', source: '' });
  const [step, setStep] = useState(0);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    onSuccess?.(form);
    setForm({ name: '', email: '', phone: '', location: '', skills: '', summary: '', source: '' });
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <Pressable onPress={step > 0 ? () => setStep(s => s - 1) : onClose}>
            <Ionicons name="close" size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-[16px] font-bold text-slate-900">Add Candidate</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Step indicator */}
        <View className="flex-row justify-center gap-1.5 px-5 py-3">
          {[0, 1, 2].map(i => (
            <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </View>

        <ScrollView className="flex-1 px-5 pt-3">
          {step === 0 && (
            <View>
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Full Name *</Text>
              <TextInput value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Rahul Sharma" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Email Address *</Text>
              <TextInput value={form.email} onChangeText={v => update('email', v)} placeholder="rahul@example.com" placeholderTextColor="#94a3b8" keyboardType="email-address" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Phone Number</Text>
              <TextInput value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 98765 43210" placeholderTextColor="#94a3b8" keyboardType="phone-pad" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Location</Text>
              <TextInput value={form.location} onChangeText={v => update('location', v)} placeholder="Mumbai, India" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
            </View>
          )}
          {step === 1 && (
            <View>
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Skills (comma-separated)</Text>
              <TextInput value={form.skills} onChangeText={v => update('skills', v)} placeholder="React, TypeScript, Node.js" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
              <Text className="text-[13px] font-bold text-slate-900 mb-1">Professional Summary</Text>
              <TextInput value={form.summary} onChangeText={v => update('summary', v)} placeholder="Brief summary of experience and qualifications..." placeholderTextColor="#94a3b8" multiline numberOfLines={5} className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4 min-h-[100px]" textAlignVertical="top" />
            </View>
          )}
          {step === 2 && (
            <View>
              <Text className="text-[13px] font-bold text-slate-900 mb-3">Source</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {sources.map(s => (
                  <Pressable key={s} onPress={() => update('source', s)} className={`rounded-full px-4 py-2 ${form.source === s ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                    <Text className={`text-[12px] font-bold ${form.source === s ? 'text-white' : 'text-slate-600'}`}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <View className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <View className="flex-row items-start gap-2">
                  <Ionicons name="information-circle-outline" size={18} color="#d97706" />
                  <Text className="text-[11px] text-amber-700 flex-1">Adding this candidate will check for duplicates based on email address.</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="px-5 pb-8 pt-3 border-t border-slate-100">
          <Pressable
            onPress={step < 2 ? () => setStep(s => s + 1) : handleSubmit}
            className="w-full rounded-xl bg-indigo-600 py-3.5 items-center"
          >
            <Text className="text-[14px] font-bold text-white">
              {step < 2 ? `Continue (${step + 1}/3)` : 'Add Candidate'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
