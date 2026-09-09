import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const templates = [
  { id: 'standard', label: 'Standard Offer', desc: 'Full-time employment with standard terms' },
  { id: 'contract', label: 'Contract Offer', desc: 'Fixed-term contract agreement' },
  { id: 'intern', label: 'Internship Offer', desc: 'Internship position with stipend' },
];

export default function OfferLetterModal({ visible, onClose, candidateName }) {
  const [template, setTemplate] = useState('standard');
  const [form, setForm] = useState({ salary: '', startDate: '', equity: '', notes: '' });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-[16px] font-bold text-slate-900">Generate Offer Letter</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView className="flex-1 px-5 pt-4">
          <View className="flex-row items-center gap-3 p-3.5 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Ionicons name="document-text-outline" size={20} color="#6366f1" />
            <View className="flex-1">
              <Text className="text-[12px] font-bold text-indigo-900">Offer for {candidateName || 'Candidate'}</Text>
              <Text className="text-[10px] text-indigo-600">Fill in the details below to generate a professional offer letter.</Text>
            </View>
          </View>

          <Text className="text-[13px] font-bold text-slate-900 mb-2">Offer Template</Text>
          <View className="gap-2 mb-5">
            {templates.map(t => (
              <Pressable key={t.id} onPress={() => setTemplate(t.id)} className={`flex-row items-center gap-3 p-3.5 rounded-xl border ${template === t.id ? 'border-indigo-600 bg-indigo-500/5' : 'border-slate-200'}`}>
                <View className={`h-5 w-5 items-center justify-center rounded-full ${template === t.id ? 'bg-indigo-600' : 'border-2 border-slate-300'}`}>
                  {template === t.id && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-slate-900">{t.label}</Text>
                  <Text className="text-[9px] text-slate-500">{t.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Salary / Stipend</Text>
          <TextInput value={form.salary} onChangeText={v => update('salary', v)} placeholder="e.g. ₹25,00,000 PA" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Start Date</Text>
          <TextInput value={form.startDate} onChangeText={v => update('startDate', v)} placeholder="e.g. 15 Aug 2026" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Equity / Benefits (optional)</Text>
          <TextInput value={form.equity} onChangeText={v => update('equity', v)} placeholder="e.g. 0.1% ESOP" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Additional Notes</Text>
          <TextInput value={form.notes} onChangeText={v => update('notes', v)} placeholder="Any special terms, conditions, or notes..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4 min-h-[70px]" textAlignVertical="top" />
        </ScrollView>

        <View className="px-5 pb-8 pt-3 border-t border-slate-100 gap-2">
          <Pressable className="w-full rounded-xl bg-indigo-600 py-3.5 items-center">
            <Text className="text-[14px] font-bold text-white">Generate Offer Letter</Text>
          </Pressable>
          <Pressable className="w-full rounded-xl border border-slate-200 py-3 items-center">
            <Text className="text-[12px] font-bold text-slate-600">Preview PDF</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
