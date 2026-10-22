import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '~/utils/crm/colors';
import * as crmService from '~/services/crm';

const DUE_DATE_OPTIONS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 Days', days: 3 },
  { label: 'Next Week', days: 7 },
];

export default function CreateTaskModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const { createTaskVisible, setCreateTaskVisible, createTaskDefaults, deals, contacts, optimisticAddTask } = useCrm();

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

    const due = new Date();
    due.setDate(due.getDate() + dueDateDays);
    const selDeal = deals.find((d) => d.id === dealId);
    const selContact = contacts.find((c) => c.id === contactId);

    const taskPayload = {
      title: title.trim(),
      type,
      priority,
      dealId: dealId || undefined,
      deal: selDeal,
      contactId: contactId || undefined,
      contact: selContact,
      dueDate: due.toISOString(),
    };

    setCreateTaskVisible(false);
    optimisticAddTask(taskPayload).catch(() => {});
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateTaskVisible(false)}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={() => setCreateTaskVisible(false)} />

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
                <Ionicons name="checkbox" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Schedule Task & Follow-up
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  Keep deal velocity moving forward
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateTaskVisible(false)}
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
              Follow-up Action *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Call client to review quotation and payment terms"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Type */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Activity Type
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-2.5">
              {['CALL', 'WHATSAPP', 'MEETING', 'EMAIL', 'REVIEW'].map((t) => {
                const isSelected = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    className="rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isSelected ? '#ffffff' : colors.text }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Due Timeline */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Due Timeline
            </Text>
            <View className="flex-row gap-x-2 mb-2.5">
              {DUE_DATE_OPTIONS.map((opt) => {
                const isSelected = dueDateDays === opt.days;
                return (
                  <Pressable
                    key={opt.days}
                    onPress={() => setDueDateDays(opt.days)}
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
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Priority */}
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

            {/* Linked Deal */}
            {deals.length > 0 && (
              <>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Attach to Deal
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-2.5 py-1">
                  <Pressable
                    onPress={() => setDealId('')}
                    className="rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: !dealId ? colors.primary : colors.cardAlt,
                      borderColor: !dealId ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: !dealId ? '#ffffff' : colors.textMuted }}>
                      None
                    </Text>
                  </Pressable>
                  {deals.map((d) => {
                    const isSelected = dealId === d.id;
                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => setDealId(d.id)}
                        className="rounded-xl border px-3 py-1.5"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: isSelected ? '#ffffff' : colors.text }}>
                          {d.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Linked Contact */}
            {contacts.length > 0 && (
              <>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Attach to Contact
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
                <Ionicons name="calendar" size={17} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Save Task</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

