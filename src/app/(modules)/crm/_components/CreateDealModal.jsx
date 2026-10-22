import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';

export default function CreateDealModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const {
    createDealVisible,
    setCreateDealVisible,
    createDealDefaultStageId,
    pipelines,
    activePipeline,
    contacts,
    accounts,
    optimisticAddDeal,
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

    const selContact = contacts.find((c) => c.id === contactId);
    const selAccount = accounts.find((a) => a.id === accountId);
    const dealPayload = {
      title: title.trim(),
      value: parseFloat(value) || 0,
      currency,
      pipelineId: pipelineId || undefined,
      stageId: stageId || undefined,
      contactId: contactId || undefined,
      contact: selContact,
      accountId: accountId || undefined,
      account: selAccount,
      priority,
      notes: notes.trim() || undefined,
    };

    setCreateDealVisible(false);
    optimisticAddDeal(dealPayload).catch(() => {});
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateDealVisible(false)}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={() => setCreateDealVisible(false)} />

        <View
          className="max-h-[85%] rounded-t-3xl p-4 shadow-2xl border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 20, 40),
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="briefcase" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Create New Deal
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  Add opportunity to sales pipeline
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateDealVisible(false)}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5">
            {/* Title */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Deal Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Enterprise Cloud Migration"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Value & Currency */}
            <View className="flex-row items-center gap-x-2 mb-2.5">
              <View className="flex-1">
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Estimated Value
                </Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="e.g. 250000"
                  placeholderTextColor={colors.inputPlaceholder}
                  className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </View>
              <View className="w-24">
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Currency
                </Text>
                <View
                  className="flex-row rounded-xl border p-1"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCurrency(c)}
                      className="flex-1 items-center justify-center rounded-lg py-1"
                      style={{
                        backgroundColor: currency === c ? colors.primary : 'transparent',
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: currency === c ? '#ffffff' : colors.textMuted,
                        }}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Stage Selector */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Pipeline Stage
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-2.5 py-1">
              {currentStages.map((s) => {
                const isSelected = stageId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setStageId(s.id)}
                    className="rounded-xl border px-3 py-1.5 flex-row items-center gap-x-1.5"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : s.color || colors.primary }}
                    />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isSelected ? '#ffffff' : colors.text }}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Priority Selector */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Priority
            </Text>
            <View className="flex-row gap-x-2 mb-2.5">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => {
                const isSelected = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    className="flex-1 items-center justify-center rounded-xl border py-1.5"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: isSelected ? '#ffffff' : colors.text }}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Contact Linkage */}
            {contacts.length > 0 && (
              <>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Link Contact
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-2.5 py-1">
                  <Pressable
                    onPress={() => setContactId('')}
                    className="rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: !contactId ? colors.primary : colors.cardAlt,
                      borderColor: !contactId ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: !contactId ? '#ffffff' : colors.textMuted }}>
                      None
                    </Text>
                  </Pressable>
                  {contacts.map((c) => {
                    const isSelected = contactId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setContactId(c.id)}
                        className="rounded-xl border px-3 py-1.5"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: isSelected ? '#ffffff' : colors.text }}>
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Account Linkage */}
            {accounts.length > 0 && (
              <>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Link Company Account
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-2.5 py-1">
                  <Pressable
                    onPress={() => setAccountId('')}
                    className="rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: !accountId ? colors.primary : colors.cardAlt,
                      borderColor: !accountId ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: !accountId ? '#ffffff' : colors.textMuted }}>
                      Independent
                    </Text>
                  </Pressable>
                  {accounts.map((a) => {
                    const isSelected = accountId === a.id;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => setAccountId(a.id)}
                        className="rounded-xl border px-3 py-1.5"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: isSelected ? '#ffffff' : colors.text }}>
                          {a.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Error banner */}
            {error && (
              <View
                className="mb-2.5 rounded-xl p-2.5 border"
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.dangerBorder,
                }}
              >
                <Text className="text-xs font-bold text-center" style={{ color: colors.danger }}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !title.trim()}
            className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-md active:opacity-80"
            style={{
              backgroundColor: colors.primary,
              opacity: submitting || !title.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={17} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Create Opportunity</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

