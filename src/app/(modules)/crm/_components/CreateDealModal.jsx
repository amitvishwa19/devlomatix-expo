import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

export default function CreateDealModal() {
  const {
    createDealVisible,
    setCreateDealVisible,
    createDealDefaultStageId,
    pipelines,
    activePipeline,
    contacts,
    accounts,
    refreshAll,
  } = useCrm();

  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [contactId, setContactId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (createDealVisible) {
      setTitle('');
      setValue('');
      setNotes('');
      setError(null);
      const pipe = activePipeline || pipelines[0];
      if (pipe) {
        setPipelineId(pipe.id);
        const stg = createDealDefaultStageId
          ? pipe.stages?.find((s) => s.id === createDealDefaultStageId)
          : pipe.stages?.[0];
        setStageId(stg?.id || pipe.stages?.[0]?.id || '');
      }
    }
  }, [createDealVisible, activePipeline, pipelines, createDealDefaultStageId]);

  if (!createDealVisible) return null;

  const currentStages = pipelines.find((p) => p.id === pipelineId)?.stages || activePipeline?.stages || [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Deal title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await crmService.createDeal({
        title: title.trim(),
        value: parseFloat(value) || 0,
        currency,
        pipelineId: pipelineId || undefined,
        stageId: stageId || undefined,
        contactId: contactId || undefined,
        accountId: accountId || undefined,
        priority,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setCreateDealVisible(false);
        refreshAll();
      } else {
        setError(res.error || 'Failed to create deal');
      }
    } catch (e) {
      setError(e.message || 'Error creating deal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateDealVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={() => setCreateDealVisible(false)} />

        <View className="max-h-[85%] rounded-t-3xl bg-white p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200">
                <Ionicons name="briefcase" size={18} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-900">Create New Deal</Text>
                <Text className="text-xs text-slate-500 font-medium">Add opportunity to sales pipeline</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateDealVisible(false)}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#475569" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Title */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Deal Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Enterprise Cloud Migration"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 mb-3"
            />

            {/* Value & Currency */}
            <View className="flex-row items-center gap-x-2 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">Estimated Value</Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="e.g. 250000"
                  placeholderTextColor="#94a3b8"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
              <View className="w-24">
                <Text className="text-xs font-bold text-slate-700 mb-1">Currency</Text>
                <View className="flex-row rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCurrency(c)}
                      className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                        currency === c ? 'bg-indigo-600' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          currency === c ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Stage Selector */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Pipeline Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
              {currentStages.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setStageId(s.id)}
                  className={`rounded-xl border px-3 py-2 flex-row items-center gap-x-1.5 ${
                    stageId === s.id
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stageId === s.id ? '#ffffff' : s.color || '#4f46e5' }}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      stageId === s.id ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Priority Selector */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Priority</Text>
            <View className="flex-row gap-x-2 mb-3">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 items-center justify-center rounded-xl border py-2 ${
                    priority === p
                      ? 'bg-slate-900 border-slate-900'
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

            {/* Contact Linkage */}
            {contacts.length > 0 && (
              <>
                <Text className="text-xs font-bold text-slate-700 mb-1">Link Contact</Text>
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

            {/* Account Linkage */}
            {accounts.length > 0 && (
              <>
                <Text className="text-xs font-bold text-slate-700 mb-1">Link Company Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
                  <Pressable
                    onPress={() => setAccountId('')}
                    className={`rounded-xl border px-3 py-1.5 ${
                      !accountId ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!accountId ? 'text-white' : 'text-slate-600'}`}>
                      Independent
                    </Text>
                  </Pressable>
                  {accounts.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => setAccountId(a.id)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        accountId === a.id ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${accountId === a.id ? 'text-white' : 'text-slate-700'}`}>
                        {a.name}
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
            className={`mt-3 flex-row items-center justify-center gap-x-2 rounded-2xl bg-indigo-600 py-3.5 shadow-md shadow-indigo-500/20 active:bg-indigo-700 ${
              submitting || !title.trim() ? 'opacity-50' : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={18} color="#ffffff" />
                <Text className="text-sm font-black text-white">Create Opportunity</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
