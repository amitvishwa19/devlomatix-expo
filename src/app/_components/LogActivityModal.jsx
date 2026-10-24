import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';
import { useCrmTheme } from '~/utils/crm/colors';

const ACTIVITY_TYPES = [
  { value: 'NOTE', label: 'Note', icon: 'document-text-outline' },
  { value: 'CALL', label: 'Call', icon: 'call-outline' },
  { value: 'MEETING', label: 'Meeting', icon: 'people-outline' },
  { value: 'WHATSAPP_MSG', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { value: 'EMAIL', label: 'Email', icon: 'mail-outline' },
  { value: 'TASK', label: 'Task', icon: 'checkbox-outline' },
];

export default function LogActivityModal({ visible, onClose, onCreated }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const { workspaceId, contacts, accounts } = useCrm();

  const [type, setType] = useState('NOTE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setType('NOTE');
    setTitle('');
    setDescription('');
    setContactId(null);
    setAccountId(null);
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      setError('Activity title is required.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await crmService.createActivity(
        {
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          contactId: contactId || undefined,
          accountId: accountId || undefined,
        },
        { workspaceId }
      );
      if (!res?.success) throw new Error(res?.error || 'Failed to log activity');
      reset();
      onClose?.();
      onCreated?.(res.data);
      Toast.show({ type: 'success', text1: 'Activity logged', text2: title.trim() });
    } catch (err) {
      setError(err?.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={close} />

        <View
          className="max-h-[88%] rounded-t-3xl p-4 border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 18, 36),
          }}
        >
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primary }}>
                <Ionicons name="pulse" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Log Activity
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  Record an interaction in the timeline
                </Text>
              </View>
            </View>

            <Pressable
              onPress={close}
              disabled={submitting}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5 p-1">
            <Text className="text-[11px] font-bold mb-1.5" style={{ color: colors.text }}>
              Activity Type
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {ACTIVITY_TYPES.map((option) => {
                const selected = type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setType(option.value)}
                    className="mr-1.5 flex-row items-center gap-x-1 rounded-xl border px-3 py-1.5 active:opacity-80"
                    style={{
                      backgroundColor: selected ? colors.primary : colors.cardAlt,
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons name={option.icon} size={13} color={selected ? '#ffffff' : colors.textMuted} />
                    <Text className="text-[11px] font-bold" style={{ color: selected ? '#ffffff' : colors.text }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Discovery call with procurement team"
              placeholderTextColor={colors.inputPlaceholder}
              className="mb-2.5 rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
              style={inputStyle}
            />

            <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
              Notes
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Summary, next steps, key takeaways..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              textAlignVertical="top"
              className="mb-2.5 rounded-xl border px-3.5 py-3 text-xs min-h-[88px]"
              style={inputStyle}
            />

            {contacts.length > 0 && (
              <>
                <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                  Link Contact (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2.5">
                  <Pressable
                    onPress={() => setContactId(null)}
                    className="mr-1.5 rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: !contactId ? colors.primary : colors.cardAlt,
                      borderColor: !contactId ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="text-[11px] font-semibold" style={{ color: !contactId ? '#ffffff' : colors.text }}>
                      None
                    </Text>
                  </Pressable>
                  {contacts.slice(0, 30).map((contact) => {
                    const selected = contactId === contact.id;
                    return (
                      <Pressable
                        key={contact.id}
                        onPress={() => setContactId(selected ? null : contact.id)}
                        className="mr-1.5 rounded-xl border px-3 py-1.5"
                        style={{
                          backgroundColor: selected ? colors.primary : colors.cardAlt,
                          borderColor: selected ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-[11px] font-semibold" style={{ color: selected ? '#ffffff' : colors.text }}>
                          {contact.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {accounts.length > 0 && (
              <>
                <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                  Link Company (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2.5">
                  <Pressable
                    onPress={() => setAccountId(null)}
                    className="mr-1.5 rounded-xl border px-3 py-1.5"
                    style={{
                      backgroundColor: !accountId ? colors.primary : colors.cardAlt,
                      borderColor: !accountId ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="text-[11px] font-semibold" style={{ color: !accountId ? '#ffffff' : colors.text }}>
                      None
                    </Text>
                  </Pressable>
                  {accounts.slice(0, 30).map((account) => {
                    const selected = accountId === account.id;
                    return (
                      <Pressable
                        key={account.id}
                        onPress={() => setAccountId(selected ? null : account.id)}
                        className="mr-1.5 rounded-xl border px-3 py-1.5"
                        style={{
                          backgroundColor: selected ? colors.primary : colors.cardAlt,
                          borderColor: selected ? colors.primary : colors.border,
                        }}
                      >
                        <Text className="text-[11px] font-semibold" style={{ color: selected ? '#ffffff' : colors.text }}>
                          {account.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {error && (
              <View
                className="mb-2.5 rounded-xl p-2.5 border"
                style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }}
              >
                <Text className="text-xs font-bold text-center" style={{ color: colors.danger }}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !title.trim()}
            className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 active:opacity-80"
            style={{
              backgroundColor: colors.primary,
              opacity: submitting || !title.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="pulse" size={17} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Log Activity</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
