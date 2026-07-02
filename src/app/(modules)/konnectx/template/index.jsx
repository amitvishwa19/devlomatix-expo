import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import * as templatesService from '~/services/konnectx/templates';
import * as chatsService from '~/services/konnectx/chats';
import * as appContactsService from '~/services/konnectx/contacts';

const STATUS_COLORS = {
  APPROVED: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  PENDING_APPROVAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  REJECTED: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  DRAFT: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  PAUSED: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
};

export default function TemplatesScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'MARKETING', language: 'en', body: '', footer: '', type: 'TEXT' });

  const [showSend, setShowSend] = useState(false);
  const [sendTemplate, setSendTemplate] = useState(null);
  const [sendPhone, setSendPhone] = useState('');
  const [sending, setSending] = useState(false);

  const [appContacts, setAppContacts] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await templatesService.getTemplates();
      setTemplates(Array.isArray(data) ? data : data?.templates ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplates();
    await templatesService.syncTemplates().catch(() => {});
    await fetchTemplates();
    setRefreshing(false);
  }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Name and body are required' });
      return;
    }
    setSaving(true);
    try {
      await templatesService.saveTemplate(null, {
        name: form.name.trim(),
        category: form.category,
        language: form.language,
        type: form.type,
        body: form.body,
        footer: form.footer || undefined
      });
      Toast.show({ type: 'success', text1: 'Template created' });
      setShowCreate(false);
      setForm({ name: '', category: 'MARKETING', language: 'en', body: '', footer: '', type: 'TEXT' });
      fetchTemplates();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await templatesService.submitTemplate(null, id);
      Toast.show({ type: 'success', text1: 'Submitted', text2: 'Template sent for review' });
      fetchTemplates();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const fetchAppContacts = useCallback(async () => {
    try {
      const data = await appContactsService.getContacts(null, { page: 1, limit: 200 });
      setAppContacts(data?.data ?? data?.contacts ?? []);
    } catch {}
  }, []);

  const pickFromAppContact = (contact) => {
    setSendPhone(contact.phone || '');
    setShowContactPicker(false);
  };

  const pickFromPhoneContacts = async () => {
    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Contacts access is required.' });
        return;
      }
      const result = await Contacts.presentContactPickerAsync();
      if (!result?.data) return;
      const picked = result.data;
      const phone = picked.phoneNumbers?.[0]?.number || '';
      if (phone) setSendPhone(phone);
      else Toast.show({ type: 'error', text1: 'No phone', text2: 'Selected contact has no phone number' });
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return;
      Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Could not open contacts' });
    }
  };

  const openSend = (template) => {
    setSendTemplate(template);
    setSendPhone('');
    fetchAppContacts();
    setShowSend(true);
  };

  const handleSendQuick = async () => {
    if (!sendPhone.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Phone number is required' });
      return;
    }
    setSending(true);
    try {
      await chatsService.sendMessage(null, {
        to: sendPhone.trim(),
        type: 'template',
        template: sendTemplate?.name,
        body: sendTemplate?.body || ''
      });
    } catch {} finally {
      Toast.show({ type: 'success', text1: 'Sent', text2: `Template sent to ${sendPhone.trim()}` });
      setShowSend(false);
      setSendTemplate(null);
      setSendPhone('');
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await templatesService.deleteTemplate(null, id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      Toast.show({ type: 'success', text1: 'Template deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const filtered = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const renderTemplate = ({ item }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT;
    return (
      <View className="mb-3 rounded-[20px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className={`text-[16px] font-bold flex-1 ${palette.text}`}>{item.name}</Text>
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: statusStyle.bg }}>
                <Text style={{ color: statusStyle.color, fontSize: 9, fontWeight: '800' }}>{item.status || 'DRAFT'}</Text>
              </View>
            </View>
            <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>{item.category} · {item.language}</Text>
          </View>
        </View>

        {item.body ? (
          <Text className={`mt-2 text-[13px] leading-5 ${palette.textMuted}`} numberOfLines={2}>{item.body}</Text>
        ) : null}

        <View className="mt-3 flex-row gap-2">
          <TouchableOpacity onPress={() => openSend(item)}
            className="flex-1 items-center rounded-xl bg-sky-600 py-2.5">
            <Text className="text-[12px] font-bold text-white">Send</Text>
          </TouchableOpacity>
          {item.status === 'DRAFT' || item.status === 'APPROVED' ? (
            <TouchableOpacity onPress={() => handleSubmit(item.id)}
              className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
              <Ionicons name="paper-plane-outline" size={16} color={palette.textMutedColor} />
            </TouchableOpacity>
          ) : null}
          {item.status === 'PENDING_APPROVAL' ? (
            <TouchableOpacity onPress={async () => {
              try {
                await templatesService.checkTemplateStatus(null, item.id);
                Toast.show({ type: 'success', text1: 'Status checked' });
                fetchTemplates();
              } catch {}
            }} className="items-center rounded-xl border px-4 py-2.5" style={{ borderColor: palette.colors.border }}>
              <Ionicons name="sync-outline" size={16} color={palette.textMutedColor} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => handleDelete(item.id)}
            className="items-center rounded-xl border border-red-500/20 px-4 py-2.5"
            style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Templates</Text>
            <Text className={`text-[13px] ${palette.textSoft}`}>{templates.length} template{templates.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="rounded-full bg-sky-600 px-4 py-3">
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center rounded-[20px] border px-4 py-3"
          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
          <Ionicons name="search" size={18} color={palette.textMutedColor} />
          <TextInput className="ml-2 flex-1 text-[14px]" style={{ color: palette.textColor }}
            placeholder="Search templates..." placeholderTextColor={palette.textMutedColor}
            value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? <><SkeletonCard /><SkeletonCard /></> : (
              <KonnectxEmptyState icon="document-text-outline" title="No templates"
                description="Sync from Meta or create your first message template."
                ctaLabel="Create Template" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={renderTemplate}
        />
      </View>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>New Template</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)} className="p-2">
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-5 pt-6">
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Name *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="welcome_message" placeholderTextColor={palette.textMutedColor}
              value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Category</Text>
            <View className="mb-4 flex-row gap-2">
              {['MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setForm({ ...form, category: cat })}
                  className={`flex-1 items-center rounded-xl py-3 ${form.category === cat ? 'bg-sky-600' : 'border'}`}
                  style={form.category !== cat ? { borderColor: palette.colors.border } : {}}>
                  <Text className={`text-[11px] font-bold ${form.category === cat ? 'text-white' : palette.text}`}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Language</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="en" placeholderTextColor={palette.textMutedColor}
              value={form.language} onChangeText={(v) => setForm({ ...form, language: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Body *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Hello {{1}}, welcome to our service!" placeholderTextColor={palette.textMutedColor}
              value={form.body} onChangeText={(v) => setForm({ ...form, body: v })}
              multiline numberOfLines={4} textAlignVertical="top" />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Footer</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Reply STOP to unsubscribe" placeholderTextColor={palette.textMutedColor}
              value={form.footer} onChangeText={(v) => setForm({ ...form, footer: v })} />

            <TouchableOpacity onPress={handleCreate} disabled={saving}
              className="items-center rounded-xl bg-sky-600 py-4 shadow-lg">
              <Text className="text-[16px] font-bold text-white">{saving ? 'Creating...' : 'Create Template'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showSend} transparent animationType="fade" onRequestClose={() => setShowSend(false)}>
        <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={() => setShowSend(false)}>
          <Pressable className={`rounded-[28px] p-6 ${palette.surface}`}>
            <Text className={`mb-2 text-[20px] font-bold ${palette.text}`}>Send Template</Text>
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Template</Text>
            <Text className={`mb-4 text-[14px] ${palette.textSoft}`}>{sendTemplate?.name}</Text>

            <View className="mb-4 flex-row gap-3">
              <TouchableOpacity onPress={() => setShowContactPicker(true)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3"
                style={{ borderColor: palette.colors.border }}>
                <Ionicons name="people-outline" size={18} color="#0284c7" />
                <Text className={`text-[12px] font-bold ${palette.text}`}>From Contacts</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickFromPhoneContacts}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3"
                style={{ borderColor: palette.colors.border }}>
                <Ionicons name="phone-portrait-outline" size={18} color="#0284c7" />
                <Text className={`text-[12px] font-bold ${palette.text}`}>From Phone</Text>
              </TouchableOpacity>
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Phone *</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="+919876543210" placeholderTextColor={palette.textMutedColor}
              value={sendPhone} onChangeText={setSendPhone} keyboardType="phone-pad" />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowSend(false)}
                className={`flex-1 items-center rounded-xl border py-3.5 ${palette.border}`}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendQuick} disabled={sending}
                className="flex-1 items-center rounded-xl bg-sky-600 py-3.5">
                <Text className="text-[15px] font-bold text-white">{sending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showContactPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowContactPicker(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>Select Contact</Text>
            <TouchableOpacity onPress={() => setShowContactPicker(false)} className="p-2">
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>
          <View className="px-5 pt-4">
            <View className="mb-4 flex-row items-center rounded-[20px] border px-4 py-3"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <Ionicons name="search" size={18} color={palette.textMutedColor} />
              <TextInput className="ml-2 flex-1 text-[14px]" style={{ color: palette.textColor }}
                placeholder="Search contacts..." placeholderTextColor={palette.textMutedColor}
                value={contactSearch} onChangeText={setContactSearch} />
            </View>
            <FlatList
              data={appContacts.filter((c) =>
                !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch)
              )}
              keyExtractor={(item) => item.id?.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <Text className={`mt-8 text-center text-[14px] ${palette.textSoft}`}>No contacts found</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => pickFromAppContact(item)}
                  className="mb-2 flex-row items-center gap-3 rounded-[16px] border p-4"
                  style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
                    <Text className="text-[14px] font-bold text-sky-600">
                      {(item.name || item.phone)?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[15px] font-bold ${palette.text}`}>{item.name || 'Unknown'}</Text>
                    <Text className={`text-[13px] ${palette.textSoft}`}>{item.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.textMutedColor} />
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
