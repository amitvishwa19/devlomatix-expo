import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

export default function CreateDealModal() {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
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

        <View
          className={`max-h-[85%] rounded-t-3xl ${palette.surface} p-5 shadow-2xl border-t ${palette.border}`}
          style={{ paddingBottom: Math.max(insets.bottom + 24, 44) }}
        >
          {/* Header */}
          <View className={`flex-row items-center justify-between border-b ${palette.border} pb-3`}>
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                <Ionicons name="briefcase" size={18} color="#818cf8" />
              </View>
              <View>
                <Text className={`text-base font-black ${palette.text}`}>Create New Deal</Text>
                <Text className={`text-xs ${palette.textMuted} font-medium`}>Add opportunity to sales pipeline</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateDealVisible(false)}
              className={`h-8 w-8 items-center justify-center rounded-full ${palette.surfaceAlt} border ${palette.border}`}
            >
              <Ionicons name="close" size={18} color={palette.textColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Title */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Deal Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Enterprise Cloud Migration"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text} mb-3`}
            />

            {/* Value & Currency */}
            <View className="flex-row items-center gap-x-2 mb-3">
              <View className="flex-1">
                <Text className={`text-xs font-bold ${palette.text} mb-1`}>Estimated Value</Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="e.g. 250000"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text}`}
                />
              </View>
              <View className="w-24">
                <Text className={`text-xs font-bold ${palette.text} mb-1`}>Currency</Text>
                <View className={`flex-row rounded-xl border ${palette.border} ${palette.surfaceAlt} p-1`}>
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
                          currency === c ? 'text-white' : palette.textMuted
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
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Pipeline Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
              {currentStages.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setStageId(s.id)}
                  className={`rounded-xl border px-3 py-2 flex-row items-center gap-x-1.5 ${
                    stageId === s.id
                      ? 'bg-indigo-600 border-indigo-600'
                      : `${palette.surfaceAlt} ${palette.border} active:opacity-75`
                  }`}
                >
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stageId === s.id ? '#ffffff' : s.color || '#4f46e5' }}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      stageId === s.id ? 'text-white' : palette.text
                    }`}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Priority Selector */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Priority</Text>
            <View className="flex-row gap-x-2 mb-3">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 items-center justify-center rounded-xl border py-2 ${
                    priority === p
                      ? 'bg-indigo-600 border-indigo-600'
                      : `${palette.surfaceAlt} ${palette.border} active:opacity-75`
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      priority === p ? 'text-white' : palette.text
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
                <Text className={`text-xs font-bold ${palette.text} mb-1`}>Link Contact</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
                  <Pressable
                    onPress={() => setContactId('')}
                    className={`rounded-xl border px-3 py-1.5 ${
                      !contactId ? 'bg-indigo-600 border-indigo-600' : `${palette.surfaceAlt} ${palette.border}`
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!contactId ? 'text-white' : palette.textMuted}`}>
                      None
                    </Text>
                  </Pressable>
                  {contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setContactId(c.id)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        contactId === c.id ? 'bg-indigo-600 border-indigo-600' : `${palette.surfaceAlt} ${palette.border}`
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${contactId === c.id ? 'text-white' : palette.text}`}>
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
                <Text className={`text-xs font-bold ${palette.text} mb-1`}>Link Company Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-3 py-1">
                  <Pressable
                    onPress={() => setAccountId('')}
                    className={`rounded-xl border px-3 py-1.5 ${
                      !accountId ? 'bg-indigo-600 border-indigo-600' : `${palette.surfaceAlt} ${palette.border}`
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${!accountId ? 'text-white' : palette.textMuted}`}>
                      Independent
                    </Text>
                  </Pressable>
                  {accounts.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => setAccountId(a.id)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        accountId === a.id ? 'bg-indigo-600 border-indigo-600' : `${palette.surfaceAlt} ${palette.border}`
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${accountId === a.id ? 'text-white' : palette.text}`}>
                        {a.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Error banner */}
            {error && (
              <View className="mb-3 rounded-xl bg-rose-500/15 p-2.5 border border-rose-500/30">
                <Text className="text-xs font-bold text-rose-400 text-center">{error}</Text>
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
