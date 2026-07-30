import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const types = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const priorities = ['High', 'Medium', 'Low'];
const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Infrastructure'];

export default function JobCreateModal({ visible, onClose, onSuccess, editData }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    title: editData?.title || '',
    department: editData?.dept || '',
    type: editData?.type || 'Full-time',
    location: editData?.location || '',
    salary: editData?.salary || '',
    description: editData?.description || '',
    skills: editData?.skills || '',
    priority: editData?.priority || 'Medium',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    onSuccess?.({ ...form, id: editData?.id });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-[16px] font-bold text-slate-900">{isEdit ? 'Edit Position' : 'Create Position'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView className="flex-1 px-5 pt-4">
          <Text className="text-[13px] font-bold text-slate-900 mb-1">Job Title *</Text>
          <TextInput value={form.title} onChangeText={v => update('title', v)} placeholder="e.g. Senior Frontend Developer" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-2">Department</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {departments.map(d => (
              <Pressable key={d} onPress={() => update('department', d)} className={`rounded-full px-4 py-2 ${form.department === d ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                <Text className={`text-[11px] font-bold ${form.department === d ? 'text-white' : 'text-slate-600'}`}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-[13px] font-bold text-slate-900 mb-2">Employment Type</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {types.map(t => (
              <Pressable key={t} onPress={() => update('type', t)} className={`rounded-full px-4 py-2 ${form.type === t ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                <Text className={`text-[11px] font-bold ${form.type === t ? 'text-white' : 'text-slate-600'}`}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Location</Text>
          <TextInput value={form.location} onChangeText={v => update('location', v)} placeholder="Remote / Mumbai / Bangalore" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Salary Range</Text>
          <TextInput value={form.salary} onChangeText={v => update('salary', v)} placeholder="e.g. 15L - 25L PA" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-2">Priority</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {priorities.map(p => (
              <Pressable key={p} onPress={() => update('priority', p)} className={`rounded-full px-4 py-2 ${form.priority === p ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                <Text className={`text-[11px] font-bold ${form.priority === p ? 'text-white' : 'text-slate-600'}`}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Required Skills</Text>
          <TextInput value={form.skills} onChangeText={v => update('skills', v)} placeholder="React, TypeScript, GraphQL (comma-separated)" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />

          <Text className="text-[13px] font-bold text-slate-900 mb-1">Job Description</Text>
          <TextInput value={form.description} onChangeText={v => update('description', v)} placeholder="Describe the role, responsibilities, and requirements..." placeholderTextColor="#94a3b8" multiline numberOfLines={6} className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4 min-h-[120px]" textAlignVertical="top" />
        </ScrollView>

        <View className="px-5 pb-8 pt-3 border-t border-slate-100">
          <Pressable onPress={handleSubmit} className="w-full rounded-xl bg-indigo-600 py-3.5 items-center">
            <Text className="text-[14px] font-bold text-white">{isEdit ? 'Save Changes' : 'Publish Position'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
