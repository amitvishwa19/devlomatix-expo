import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import * as credentialsService from '~/services/konnectx/credentials';
import * as settingsService from '~/services/konnectx/settings';
import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxCard from '~/components/konnectx/KonnectxCard';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';

export default function KonnectXSettingsScreen() {
  const { palette } = useAppTheme();
  const { userId, credentials, selectedCredential, refreshCredentials, isLoading } = useKonnectx();

  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [credToDelete, setCredToDelete] = useState(null);
  const [testStates, setTestStates] = useState({});

  const [form, setForm] = useState({ id: null, profile: '', phoneNumberId: '', wabaId: '', accessToken: '' });
  const [saving, setSaving] = useState(false);

  const [testNumbers, setTestNumbers] = useState([]);
  const [testNumberInput, setTestNumberInput] = useState('');

  const fetchMetadata = useCallback(async () => {
    try {
      const meta = await settingsService.getMetadata();
      if (meta?.testNumbers) setTestNumbers(meta.testNumbers);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCredentials();
    await fetchMetadata();
    setRefreshing(false);
  }, [refreshCredentials, fetchMetadata]);

  const handleSave = async () => {
    if (!form.phoneNumberId || !form.wabaId || (!form.id && !form.accessToken)) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please fill required fields' });
      return;
    }
    setSaving(true);
    try {
      await credentialsService.saveCredential(userId, form);
      Toast.show({ type: 'success', text1: form.id ? 'Updated' : 'Added', text2: 'Credential saved successfully' });
      setShowAddModal(false);
      setShowEditModal(false);
      setForm({ id: null, profile: '', phoneNumberId: '', wabaId: '', accessToken: '' });
      await refreshCredentials();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!credToDelete) return;
    try {
      await credentialsService.deleteCredential(userId, credToDelete.id);
      Toast.show({ type: 'success', text1: 'Deleted', text2: 'Credential removed' });
      setShowDeleteAlert(false);
      setCredToDelete(null);
      await refreshCredentials();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleTest = async (cred) => {
    setTestStates((prev) => ({ ...prev, [cred.id]: 'loading' }));
    try {
      await credentialsService.testCredential({
        accessToken: cred.accessToken,
        phoneNumberId: cred.phoneNumberId
      });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Connection verified!' });
      setTestStates((prev) => ({ ...prev, [cred.id]: 'success' }));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.response?.data?.error || err.message });
      setTestStates((prev) => ({ ...prev, [cred.id]: 'error' }));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await credentialsService.setDefaultCredential(userId, id);
      Toast.show({ type: 'success', text1: 'Default set', text2: 'Default account updated' });
      await refreshCredentials();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleAddTestNumber = async () => {
    if (!testNumberInput.trim()) return;
    if (testNumbers.includes(testNumberInput.trim())) {
      Toast.show({ type: 'error', text1: 'Duplicate', text2: 'Number already exists' });
      return;
    }
    const updated = [...testNumbers, testNumberInput.trim()];
    try {
      await settingsService.saveTestNumbers(userId, updated);
      setTestNumbers(updated);
      setTestNumberInput('');
      Toast.show({ type: 'success', text1: 'Added', text2: 'Test number added' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleRemoveTestNumber = async (num) => {
    const updated = testNumbers.filter((n) => n !== num);
    try {
      await settingsService.saveTestNumbers(userId, updated);
      setTestNumbers(updated);
      Toast.show({ type: 'success', text1: 'Removed', text2: 'Test number removed' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const openEdit = (cred) => {
    setForm({
      id: cred.id,
      profile: cred.profile || '',
      phoneNumberId: cred.phoneNumberId?.toString() || '',
      wabaId: cred.wabaId?.toString() || '',
      accessToken: ''
    });
    setShowEditModal(true);
  };

  const openAdd = () => {
    setForm({ id: null, profile: '', phoneNumberId: '', wabaId: '', accessToken: '' });
    setShowAddModal(true);
  };

  const confirmDelete = (cred) => {
    setCredToDelete(cred);
    setShowDeleteAlert(true);
  };

  const renderCredentialItem = (cred) => (
    <View
      key={cred.id}
      className="mb-3 rounded-[20px] border p-4"
      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: palette.colors.surfaceAlt }}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#25D366" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className={`text-[15px] font-bold ${palette.text}`}>{cred.profile || 'WhatsApp Account'}</Text>
              {cred.isDefault ? (
                <View className="rounded-full bg-green-500/15 px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-green-600">DEFAULT</Text>
                </View>
              ) : null}
            </View>
            <Text className={`mt-0.5 text-[11px] font-mono ${palette.textMuted}`}>
              Phone ID: {cred.phoneNumberId || '---'} | WABA: {cred.wabaId || '---'}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => handleTest(cred)}
          disabled={testStates[cred.id] === 'loading'}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5"
          style={{ borderColor: palette.colors.border }}>
          <Ionicons
            name={testStates[cred.id] === 'loading' ? 'refresh' : testStates[cred.id] === 'success' ? 'checkmark-circle' : 'flash'}
            size={14}
            color={testStates[cred.id] === 'success' ? '#16a34a' : testStates[cred.id] === 'error' ? '#dc2626' : palette.textColor}
          />
          <Text className={`text-[12px] font-semibold ${palette.text}`}>
            {testStates[cred.id] === 'loading' ? 'Testing...' : testStates[cred.id] === 'success' ? 'Verified' : 'Test'}
          </Text>
        </TouchableOpacity>

        {!cred.isDefault ? (
          <TouchableOpacity
            onPress={() => handleSetDefault(cred.id)}
            className="rounded-xl border p-2.5"
            style={{ borderColor: palette.colors.border }}>
            <Ionicons name="star-outline" size={16} color={palette.textMutedColor} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => openEdit(cred)}
          className="rounded-xl border p-2.5"
          style={{ borderColor: palette.colors.border }}>
          <Ionicons name="create-outline" size={16} color={palette.textMutedColor} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => confirmDelete(cred)}
          className="rounded-xl border border-red-500/20 p-2.5"
          style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFormModal = (visible, onClose, isEdit) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
        <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[20px] font-bold ${palette.text}`}>{isEdit ? 'Edit Account' : 'Add Account'}</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color={palette.textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Account Nickname</Text>
          <TextInput
            className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="e.g. Sales Primary"
            placeholderTextColor={palette.textMutedColor}
            value={form.profile}
            onChangeText={(v) => setForm({ ...form, profile: v })}
          />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Phone Number ID *</Text>
          <TextInput
            className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="10492..."
            placeholderTextColor={palette.textMutedColor}
            value={form.phoneNumberId}
            onChangeText={(v) => setForm({ ...form, phoneNumberId: v })}
          />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Business Account ID (WABA) *</Text>
          <TextInput
            className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="92837..."
            placeholderTextColor={palette.textMutedColor}
            value={form.wabaId}
            onChangeText={(v) => setForm({ ...form, wabaId: v })}
          />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>
            System Access Token {isEdit ? '(leave blank to keep existing)' : '*'}
          </Text>
          <TextInput
            className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder={isEdit ? 'Leave blank to keep existing' : 'EAAG...'}
            placeholderTextColor={palette.textMutedColor}
            secureTextEntry
            value={form.accessToken}
            onChangeText={(v) => setForm({ ...form, accessToken: v })}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="mb-8 items-center rounded-xl bg-sky-600 py-4 shadow-lg">
            <Text className="text-[16px] font-bold text-white">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Link Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
        <View className="px-5 pb-32 pt-5">
          {/* Header */}
          <View
            className="mb-6 rounded-[28px] p-5 shadow-xl"
            style={{ backgroundColor: palette.colors.surface, shadowColor: palette.colors.shadow }}>
            <View className="mb-3 self-start rounded-full bg-sky-600 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">SETTINGS</Text>
            </View>
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>
              WhatsApp Settings
            </Text>
            <Text className={`mt-2 text-[14px] leading-5 ${palette.textSoft}`}>
              Configure your WhatsApp Cloud API instance and automation rules.
            </Text>
            <View className="mt-4 flex-row items-center gap-2 self-start rounded-full bg-green-500/10 px-3 py-1.5">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-[11px] font-semibold text-green-600">Service Active</Text>
            </View>
          </View>

          {/* Cloud API Integration Section */}
          <View className="mb-2 flex-row items-center justify-between">
            <Text className={`text-[18px] font-bold ${palette.text}`}>Cloud API Integration</Text>
            <TouchableOpacity onPress={openAdd} className="rounded-full bg-sky-600 px-4 py-2">
              <Text className="text-[12px] font-bold text-white">+ Add Account</Text>
            </TouchableOpacity>
          </View>
          <Text className={`mb-4 text-[12px] ${palette.textSoft}`}>Meta Business Platform Connectivity</Text>

          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : credentials.length > 0 ? (
            credentials.map(renderCredentialItem)
          ) : (
            <KonnectxEmptyState
              icon="globe-outline"
              title="No accounts linked"
              description="Connect your Meta WhatsApp Cloud API account to get started."
              ctaLabel="Add Account"
              onCtaPress={openAdd}
            />
          )}

          {/* Test Numbers Section */}
          <View className="mt-6">
            <Text className={`text-[18px] font-bold ${palette.text}`}>Test Audience</Text>
            <Text className={`mb-4 text-[12px] ${palette.textSoft}`}>Internal QA phone numbers for testing</Text>

            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 rounded-xl border px-4 py-3 text-[14px]"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="+919876543210"
                placeholderTextColor={palette.textMutedColor}
                value={testNumberInput}
                onChangeText={setTestNumberInput}
                onSubmitEditing={handleAddTestNumber}
              />
              <TouchableOpacity
                onPress={handleAddTestNumber}
                className="rounded-xl bg-sky-600 px-5 py-3.5">
                <Text className="text-[13px] font-bold text-white">Add</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              {testNumbers.length > 0 ? (
                testNumbers.map((num) => (
                  <View
                    key={num}
                    className="mb-2 flex-row items-center justify-between rounded-[16px] border p-3.5"
                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                    <View className="flex-1 flex-row items-center gap-3">
                      <Ionicons name="phone-portrait-outline" size={18} color={palette.textMutedColor} />
                      <View>
                        <Text className={`text-[13px] font-semibold font-mono ${palette.text}`}>{num}</Text>
                        <View className="mt-0.5 flex-row items-center gap-2">
                          <View className="rounded-full bg-green-500/10 px-2 py-0.5">
                            <Text className="text-[9px] font-bold text-green-600">VERIFIED</Text>
                          </View>
                          <Text className={`text-[9px] ${palette.textMuted}`}>Active QA Node</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveTestNumber(num)}
                      className="rounded-lg p-2"
                      style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <KonnectxEmptyState
                  icon="phone-portrait-outline"
                  title="No test numbers"
                  description="Add phone numbers to test your WhatsApp integration."
                />
              )}
            </View>
          </View>

          {/* Meta Cloud App Info Card */}
          {selectedCredential ? (
            <KonnectxCard
              title="Developer App Information"
              description="Meta API authentication and versioning">
              <View className="mt-3 flex-row flex-wrap gap-3">
                <InfoChip label="App" value={selectedCredential.profile || 'WhatsApp'} palette={palette} />
                <InfoChip label="Phone ID" value={selectedCredential.phoneNumberId?.toString() || 'N/A'} palette={palette} />
                <InfoChip label="WABA ID" value={selectedCredential.wabaId?.toString() || 'N/A'} palette={palette} />
                <InfoChip
                  label="Status"
                  value="Connected"
                  palette={palette}
                  color={selectedCredential.isDefault ? '#16a34a' : palette.textColor}
                />
              </View>
            </KonnectxCard>
          ) : null}
        </View>
      </ScrollView>

      {renderFormModal(showAddModal, () => setShowAddModal(false), false)}
      {renderFormModal(showEditModal, () => setShowEditModal(false), true)}

      <Modal visible={showDeleteAlert} transparent animationType="fade" onRequestClose={() => setShowDeleteAlert(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View
            className="w-full rounded-[28px] p-6"
            style={{ backgroundColor: palette.colors.surface }}>
            <View className="mb-4 items-center">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(220,38,38,0.1)' }}>
                <Ionicons name="trash" size={28} color="#dc2626" />
              </View>
              <Text className={`text-[20px] font-bold ${palette.text}`}>Delete Account?</Text>
              <Text className={`mt-2 text-center text-[14px] leading-5 ${palette.textSoft}`}>
                This will permanently remove the cloud credentials for{' '}
                <Text className="font-bold">{credToDelete?.profile || 'this account'}</Text>.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDeleteAlert(false)}
                className="flex-1 items-center rounded-xl border py-3.5"
                style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 items-center rounded-xl bg-red-600 py-3.5">
                <Text className="text-[15px] font-bold text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoChip({ label, value, palette, color }) {
  return (
    <View className="rounded-lg border px-3 py-2" style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surfaceAlt }}>
      <Text className={`text-[9px] font-bold uppercase tracking-wider ${palette.textMuted}`}>{label}</Text>
      <Text className={`mt-0.5 text-[12px] font-semibold`} style={{ color: color || palette.textColor }}>{value}</Text>
    </View>
  );
}
