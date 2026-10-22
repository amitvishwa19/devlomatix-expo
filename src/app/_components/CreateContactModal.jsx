import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '~/utils/crm/colors';

export default function CreateContactModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const { createContactVisible, setCreateContactVisible, accounts, optimisticAddContact } = useCrm();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [tags, setTags] = useState('LEAD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!createContactVisible) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Contact Name and Phone are required for WhatsApp connectivity.');
      return;
    }

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const selAccount = accounts.find((a) => a.id === accountId);

    const contactPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      accountId: accountId || undefined,
      account: selAccount,
      tags: tagList.length > 0 ? tagList : ['LEAD'],
    };

    setName('');
    setPhone('');
    setEmail('');
    setJobTitle('');
    setCreateContactVisible(false);
    optimisticAddContact(contactPayload).catch(() => { });
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateContactVisible(false)}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={() => setCreateContactVisible(false)} />

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
                <Ionicons name="person-add" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Add 360° Contact
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  WhatsApp & CRM synchronized profile
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateContactVisible(false)}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5 p-1">
            {/* Name */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Full Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Phone */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              WhatsApp / Mobile Phone *
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 919876543210"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs font-mono min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Email */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rahul@example.com"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Job Title */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Job Designation
            </Text>
            <TextInput
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g. VP of Operations"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Account Selector */}
            {accounts.length > 0 && (
              <>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Associated Company
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 mb-2.5 py-1">
                  <Pressable
                    onPress={() => setAccountId('')}
                    className="rounded-xl border px-3 py-1.5 mr-2"
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
                        className="rounded-xl border px-3 py-1.5 mr-2"
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

            {/* Tags */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Tags (Comma-separated)
            </Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. LEAD, ENTERPRISE, DECISION_MAKER"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px] mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

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
            disabled={submitting || !name.trim() || !phone.trim()}
            className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-md active:opacity-80"
            style={{
              backgroundColor: colors.primary,
              opacity: submitting || !name.trim() || !phone.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="person-add" size={17} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Save Contact</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

