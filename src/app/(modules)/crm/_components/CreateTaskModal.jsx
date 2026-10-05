import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

const DUE_DATE_OPTIONS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 Days', days: 3 },
  { label: 'Next Week', days: 7 },
];

export default function CreateTaskModal() {
  const { createTaskVisible, setCreateTaskVisible, createTaskDefaults, deals, contacts, refreshAll } = useCrm();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('CALL');
  const [priority, setPriority] = useState('MEDIUM');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [dueDateDays, setDueDateDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (createTaskVisible) {
      setTitle(createTaskDefaults.title || '');
      setType(createTaskDefaults.type || 'CALL');
      setDealId(createTaskDefaults.dealId || '');
      setContactId(createTaskDefaults.contactId || '');
      setPriority(createTaskDefaults.priority || 'MEDIUM');
      setError(null);
    }
  }, [createTaskVisible, createTaskDefaults]);

  if (!createTaskVisible) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Task description is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const due = new Date();
      due.setDate(due.getDate() + dueDateDays);

      const res = await crmService.createTask({
        title: title.trim(),
        type,
        priority,
        dealId: dealId || undefined,
        contactId: contactId || undefined,
        dueDate: due.toISOString(),
      });

      if (res.success) {
        setCreateTaskVisible(false);
        refreshAll();
      } else {
        setError(res.error || 'Failed to create task');
      }
    } catch (e) {
      setError(e.message || 'Error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateTaskVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={() => setCreateTaskVisible(false)} />

        <View className="max-h-[85%] rounded-t-3xl bg-white p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200">
                <Ionicons name="checkbox" size={18} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-900">Schedule Task & Follow-up</Text>
                <Text className="text-xs text-slate-500 font-medium">Keep deal velocity moving forward</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateTaskVisible(false)}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#475569" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Title */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Follow-up Action *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Call client to review quotation and payment terms"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 mb-3"
            />

            {/* Type */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Activity Type</Text>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {['CALL', 'WHATSAPP', 'MEETING', 'EMAIL', 'REVIEW'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={`rounded-xl border px-3 py-2 ${
                    type === t ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <Text className={`text-xs font-bold ${type === t ? 'text-white' : 'text-slate-700'}`}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Due Timeline */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Due Timeline</Text>
            <View className="flex-row gap-x-2 mb-3">
              {DUE_DATE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.days}
                  onPress={() => setDueDateDays(opt.days)}
                  className={`flex-1 items-center justify-center rounded-xl border py-2 ${
                    dueDateDays === opt.days
                      ? 'bg-slate-900 border-slate-900'
                      : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      dueDateDays === opt.days ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Priority */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Priority</Text>
            <View className="flex-row gap-x-2 mb-3">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 items-center justify-center rounded-xl border py-2 ${
                    priority === p
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      priority === p ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Linked Deal */}
            {deals.length > 0 && (
              <>
                <Text className="text-xs font-bold text-slate-700 mb-1">Attach to Deal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
                  <Pressable
                    onPress={() => setDealId('')}
                    className={`rounded-xl border px-3 py-1.5 ${
                      !dealId ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!dealId ? 'text-white' : 'text-slate-600'}`}>
                      None
                    </Text>
                  </Pressable>
                  {deals.map((d) => (
                    <Pressable
                      key={d.id}
                      onPress={() => setDealId(d.id)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        dealId === d.id ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${dealId === d.id ? 'text-white' : 'text-slate-700'}`}>
                        {d.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Linked Contact */}
            {contacts.length > 0 && (
              <>
                <Text className="text-xs font-bold text-slate-700 mb-1">Attach to Contact</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
                  <Pressable
                    onPress={() => setContactId('')}
                    className={`rounded-xl border px-3 py-1.5 ${
                      !contactId ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!contactId ? 'text-white' : 'text-slate-600'}`}>
                      None
                    </Text>
                  </Pressable>
                  {contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setContactId(c.id)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        contactId === c.id ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${contactId === c.id ? 'text-white' : 'text-slate-700'}`}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Error banner */}
            {error && (
              <View className="mb-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200">
                <Text className="text-xs font-bold text-rose-700 text-center">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !title.trim()}
            className={`mt-3 flex-row items-center justify-center gap-x-2 rounded-2xl bg-indigo-600 py-3.5 shadow-md active:bg-indigo-700 ${
              submitting || !title.trim() ? 'opacity-50' : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="calendar" size={18} color="#ffffff" />
                <Text className="text-sm font-black text-white">Save Task</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
