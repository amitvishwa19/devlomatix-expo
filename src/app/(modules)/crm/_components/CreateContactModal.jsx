import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

export default function CreateContactModal() {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { createContactVisible, setCreateContactVisible, accounts, refreshAll } = useCrm();

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

    try {
      setSubmitting(true);
      setError(null);
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await crmService.createContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        accountId: accountId || undefined,
        tags: tagList.length > 0 ? tagList : ['LEAD'],
      });

      if (res.success) {
        setName('');
        setPhone('');
        setEmail('');
        setJobTitle('');
        setCreateContactVisible(false);
        refreshAll();
      } else {
        setError(res.error || 'Failed to create contact');
      }
    } catch (e) {
      setError(e.message || 'Error creating contact');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setCreateContactVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={() => setCreateContactVisible(false)} />

        <View
          className={`max-h-[85%] rounded-t-3xl ${palette.surface} p-5 shadow-2xl border-t ${palette.border}`}
          style={{ paddingBottom: Math.max(insets.bottom + 24, 44) }}
        >
          {/* Header */}
          <View className={`flex-row items-center justify-between border-b ${palette.border} pb-3`}>
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                <Ionicons name="person-add" size={18} color="#818cf8" />
              </View>
              <View>
                <Text className={`text-base font-black ${palette.text}`}>Add 360° Contact</Text>
                <Text className={`text-xs ${palette.textMuted} font-medium`}>WhatsApp & CRM synchronized profile</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCreateContactVisible(false)}
              className={`h-8 w-8 items-center justify-center rounded-full ${palette.surfaceAlt} border ${palette.border}`}
            >
              <Ionicons name="close" size={18} color={palette.textColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Name */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text} mb-3`}
            />

            {/* Phone */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>WhatsApp / Mobile Phone *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 919876543210"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm font-mono ${palette.text} mb-3`}
            />

            {/* Email */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rahul@example.com"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text} mb-3`}
            />

            {/* Job Title */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Job Designation</Text>
            <TextInput
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g. VP of Operations"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text} mb-3`}
            />

            {/* Account Selector */}
            {accounts.length > 0 && (
              <>
                <Text className={`text-xs font-bold ${palette.text} mb-1`}>Associated Company</Text>
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

            {/* Tags */}
            <Text className={`text-xs font-bold ${palette.text} mb-1`}>Tags (Comma-separated)</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. LEAD, ENTERPRISE, DECISION_MAKER"
              placeholderTextColor={palette.textMutedColor}
              className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2.5 text-sm ${palette.text} mb-3`}
            />

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
            disabled={submitting || !name.trim() || !phone.trim()}
            className={`mt-3 flex-row items-center justify-center gap-x-2 rounded-2xl bg-indigo-600 py-3.5 shadow-md active:bg-indigo-700 ${
              submitting || !name.trim() || !phone.trim() ? 'opacity-50' : ''
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#ffffff" />
                <Text className="text-sm font-black text-white">Save Contact</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
