import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import * as chatsService from '~/services/konnectx/chats';
import * as contactsService from '~/services/konnectx/contacts';
import * as credentialsService from '~/services/konnectx/credentials';
import * as templatesService from '~/services/konnectx/templates';

const STATUS_ORDER = {
  APPROVED: 0,
  ACTIVE: 0,
  PAUSED: 1,
  PENDING_APPROVAL: 2,
  PENDING: 2,
  IN_APPEAL: 3,
  REJECTED: 4,
  DRAFT: 5
};
const STATUS_STYLES = {
  APPROVED: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  ACTIVE: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  PENDING_APPROVAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  IN_APPEAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  REJECTED: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  DRAFT: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  PAUSED: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
};

export default function QuickMessageScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVars, setTemplateVars] = useState({});
  const [templateMediaUrl, setTemplateMediaUrl] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      await credentialsService.getCredentials(userId);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await contactsService.getContacts(userId);
      const list = Array.isArray(data) ? data : data?.contacts ?? data?.data ?? [];
      setContacts(list);
    } catch {}
  }, [userId]);

  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await templatesService.getTemplates(userId, {
        credentialId: selectedCredential?.id || selectedCredential?._id,
        wabaId: selectedCredential?.wabaId,
        phoneNumberId: selectedCredential?.phoneNumberId
      });
      const rawList = Array.isArray(data) ? data : data?.templates ?? data?.data ?? data?.items ?? data?.result ?? [];
      const parsed = rawList.map((t) => {
        const n = { ...t };
        if (typeof n.metadata === 'string' && n.metadata.trim().startsWith('{')) {
          try { n.metadata = JSON.parse(n.metadata); } catch {}
        }
        if (typeof n.buttons === 'string' && n.buttons.trim().startsWith('[')) {
          try { n.buttons = JSON.parse(n.buttons); } catch {}
        }
        return n;
      });
      setTemplates(parsed);
    } catch {}
  }, [userId, selectedCredential]);

  useEffect(() => {
    fetchMessages();
    fetchContacts();
    fetchTemplates();
  }, [fetchMessages, fetchContacts, fetchTemplates]);

  const pickerTemplates = [...templates].sort((a, b) => {
    const sa = STATUS_ORDER[(a.status || '').toUpperCase()] ?? 9;
    const sb = STATUS_ORDER[(b.status || '').toUpperCase()] ?? 9;
    return sa - sb;
  });

  const filteredContacts = contacts.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const ph = String(c.phone || c.phoneNumber || c.phone_number || '');
    return name.includes(contactSearch.toLowerCase()) || ph.includes(contactSearch);
  });

  const handleSelectContact = (contact) => {
    const ph = contact.phone || contact.phoneNumber || contact.phone_number || '';
    setPhone(String(ph));
    setShowContactPicker(false);
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const matches = (tpl.body || '').match(/\{\{(\d+)\}\}/g) || [];
    const vars = {};
    matches.forEach((m) => { vars[m] = ''; });
    setTemplateVars(vars);
    let meta = tpl.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch {}
    }
    setTemplateMediaUrl(meta?.mediaUrl || '');
    setShowTemplatePicker(false);
    setUseTemplate(true);
  };

  const buildTemplatePayload = (tpl, vars, mediaUrl) => {
    const templateName = tpl.templateName || tpl.name;
    const components = [];
    const type = (tpl.type || 'TEXT').toUpperCase();
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(type)) {
      const finalMediaUrl = mediaUrl || {
        IMAGE: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        VIDEO: 'https://www.w3schools.com/html/mov_bbb.mp4',
        DOCUMENT: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }[type];
      if (finalMediaUrl) {
        const mediaType = type.toLowerCase();
        const isHandle =
          /^\d+$/.test(finalMediaUrl.toString()) || finalMediaUrl.toString().startsWith('4');
        components.push({
          type: 'header',
          parameters: [{ type: mediaType, [mediaType]: isHandle ? { id: finalMediaUrl } : { link: finalMediaUrl } }]
        });
      }
    }
    const bodyParams = Object.entries(vars).map(([, val]) => ({ type: 'text', text: val || ' ' }));
    if (bodyParams.length > 0) components.push({ type: 'body', parameters: bodyParams });
    return { name: templateName, language: { code: tpl.language || 'en_US' }, components };
  };

  const handleSend = async () => {
    const to = String(phone).trim();
    if (!to) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Phone number is required' });
      return;
    }
    if (useTemplate && !selectedTemplate) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Select a template first' });
      return;
    }
    if (!useTemplate && !message.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Message is required' });
      return;
    }
    setSending(true);
    try {
      let previewText = '';
      if (useTemplate) {
        const payload = buildTemplatePayload(selectedTemplate, templateVars, templateMediaUrl);
        await chatsService.sendMessage(userId, { to, type: 'template', template: payload });
        previewText = selectedTemplate.body || `[Template: ${payload.name}]`;
        Object.entries(templateVars).forEach(([k, v]) => { previewText = previewText.replace(k, v || k); });
      } else {
        await chatsService.sendMessage(userId, { to, type: 'text', body: message.trim() });
        previewText = message.trim();
      }
      Toast.show({ type: 'success', text1: 'Sent', text2: `Message sent to ${to}` });
      setMessages((prev) => [
        {
          id: `msg-${Date.now()}`,
          to,
          text: previewText,
          type: useTemplate ? 'template' : 'text',
          time: new Date().toISOString(),
          status: 'SENT'
        },
        ...prev
      ]);
      setMessage('');
      setSelectedTemplate(null);
      setTemplateVars({});
      setTemplateMediaUrl('');
      setUseTemplate(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Quick Message</Text>
        </View>

        <View className="mb-6 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
          {/* Phone */}
          <View className="mb-1 flex-row items-center justify-between">
            <Text className={`text-[13px] font-semibold ${palette.text}`}>Phone Number</Text>
            <TouchableOpacity onPress={() => { fetchContacts(); setContactSearch(''); setShowContactPicker(true); }}
              className="flex-row items-center gap-1 rounded-full bg-sky-600/15 px-2.5 py-1">
              <Ionicons name="people-outline" size={13} color="#0284c7" />
              <Text className="text-[11px] font-bold text-sky-600">From Contacts</Text>
            </TouchableOpacity>
          </View>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="+919876543210" placeholderTextColor={palette.textMutedColor}
            value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {/* Message type toggle */}
          <View className="mb-4 flex-row rounded-xl border p-1"
            style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border }}>
            <TouchableOpacity onPress={() => setUseTemplate(false)}
              className="flex-1 items-center rounded-lg py-2"
              style={{ backgroundColor: !useTemplate ? '#0284c7' : 'transparent' }}>
              <Text className={`text-[13px] font-bold ${!useTemplate ? 'text-white' : palette.textMuted}`}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (!selectedTemplate) { fetchTemplates(); setShowTemplatePicker(true); } setUseTemplate(true); }}
              className="flex-1 items-center gap-1 rounded-lg py-2 flex-row justify-center"
              style={{ backgroundColor: useTemplate ? '#0284c7' : 'transparent' }}>
              <Ionicons name="layers-outline" size={14} color={useTemplate ? '#fff' : palette.textMutedColor} />
              <Text className={`text-[13px] font-bold ${useTemplate ? 'text-white' : palette.textMuted}`}>Template</Text>
            </TouchableOpacity>
          </View>

          {useTemplate ? (
            /* Template composer */
            selectedTemplate ? (
              <ScrollView className="max-h-64">
                <TouchableOpacity onPress={() => setShowTemplatePicker(true)}
                  className="mb-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-sky-500">
                    {selectedTemplate.name}
                  </Text>
                  <Text className="mt-0.5 text-[12px]" style={{ color: palette.textColor }}>
                    {(selectedTemplate.type || 'TEXT').toUpperCase()} · {(selectedTemplate.language || 'en_US')} · Change
                  </Text>
                </TouchableOpacity>

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes((selectedTemplate.type || '').toUpperCase()) ? (
                  <TextInput className="mb-3 rounded-xl border px-4 py-3 text-[12px]"
                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                    placeholder="Media URL (image/video/document)" placeholderTextColor={palette.textMutedColor}
                    value={templateMediaUrl} onChangeText={setTemplateMediaUrl} />
                ) : null}

                {Object.keys(templateVars).length > 0 ? (
                  <View className="mb-3 gap-2">
                    <Text className={`text-[11px] font-medium ${palette.textMuted}`}>Fill in the variables:</Text>
                    {Object.keys(templateVars).map((key, idx) => (
                      <TextInput key={key} className="rounded-xl border px-4 py-2.5 text-[13px]"
                        style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                        placeholder={`Value for ${key}`} placeholderTextColor={palette.textMutedColor}
                        value={templateVars[key]} onChangeText={(v) => setTemplateVars((prev) => ({ ...prev, [key]: v }))} />
                    ))}
                  </View>
                ) : null}

                <View className={`mb-3 rounded-xl border p-3 ${palette.page} ${palette.border}`}>
                  <Text className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${palette.textMuted}`}>Preview</Text>
                  <Text className={`text-[12px] leading-5 ${palette.text}`}>
                    {Object.keys(templateVars).reduce(
                      (acc, k) => acc.replace(k, templateVars[k] || k),
                      selectedTemplate.body || ''
                    )}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <TouchableOpacity onPress={() => { fetchTemplates(); setShowTemplatePicker(true); }}
                className="mb-2 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-sky-500/40 py-4">
                <Ionicons name="add" size={18} color="#0284c7" />
                <Text className="text-[13px] font-bold text-sky-600">Select Template</Text>
              </TouchableOpacity>
            )
          ) : (
            /* Plain text composer */
            <>
              <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Message</Text>
              <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
                style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="Type your message..." placeholderTextColor={palette.textMutedColor}
                value={message} onChangeText={setMessage}
                multiline numberOfLines={4} textAlignVertical="top" />
            </>
          )}

          <TouchableOpacity onPress={handleSend} disabled={sending || !String(phone).trim()}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 shadow-lg"
            style={{ opacity: sending || !String(phone).trim() ? 0.6 : 1 }}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
            <Text className="text-[16px] font-bold text-white">
              {sending ? 'Sending...' : useTemplate && selectedTemplate ? 'Send Template' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className={`mb-3 text-[18px] font-bold ${palette.text}`}>Recent Messages</Text>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <KonnectxEmptyState icon="chatbubbles-outline" title="No messages sent yet"
              description="Use the form above to send your first quick message." />
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-[16px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[14px] font-bold ${palette.text}`}>{item.to}</Text>
                <View className="flex-row items-center gap-1.5">
                  {item.type === 'template' ? (
                    <View className="rounded-full bg-sky-500/10 px-2 py-0.5">
                      <Text className="text-[9px] font-bold text-sky-600">TEMPLATE</Text>
                    </View>
                  ) : null}
                  <View className="rounded-full bg-green-500/10 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-green-600">{item.status}</Text>
                  </View>
                </View>
              </View>
              <Text className={`mt-1 text-[13px] ${palette.textSoft}`} numberOfLines={3}>{item.text}</Text>
              <Text className={`mt-1 text-[10px] ${palette.textMuted}`}>
                {new Date(item.time).toLocaleString()}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Contact Picker Modal */}
      <Modal visible={showContactPicker} animationType="slide" onRequestClose={() => setShowContactPicker(false)} transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="max-h-[75%] rounded-t-[24px] p-4" style={{ backgroundColor: palette.colors.surface }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className={`text-[18px] font-bold ${palette.text}`}>Select Contact</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={22} color={palette.textColor} />
              </TouchableOpacity>
            </View>
            <TextInput className="mb-3 rounded-xl border px-4 py-2.5 text-[14px]"
              style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Search by name or number..." placeholderTextColor={palette.textMutedColor}
              value={contactSearch} onChangeText={setContactSearch} />
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, i) => item.id || String(i)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <KonnectxEmptyState icon="people-outline" title="No contacts found"
                  description="Add contacts from the Contacts tab first." />
              }
              renderItem={({ item }) => {
                const ph = item.phone || item.phoneNumber || item.phone_number || '';
                return (
                  <TouchableOpacity onPress={() => handleSelectContact(item)}
                    className="mb-2 flex-row items-center gap-3 rounded-xl border p-3"
                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border }}>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                      <Text className="text-[13px] font-bold text-sky-600">
                        {(item.name || '?')[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                        {item.name || 'Unknown'}
                      </Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>{ph}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={18} color="#0284c7" />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Template Picker Modal */}
      <Modal visible={showTemplatePicker} animationType="slide" onRequestClose={() => setShowTemplatePicker(false)} transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="max-h-[75%] rounded-t-[24px] p-4" style={{ backgroundColor: palette.colors.surface }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className={`text-[18px] font-bold ${palette.text}`}>Select Template</Text>
              <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
                <Ionicons name="close" size={22} color={palette.textColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerTemplates}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <KonnectxEmptyState icon="layers-outline" title="No templates found"
                  description="Create or sync templates from the Templates page first." />
              }
              renderItem={({ item }) => {
                const statusKey = (item.status || 'DRAFT').toUpperCase();
                const badge = STATUS_STYLES[statusKey] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                return (
                  <TouchableOpacity onPress={() => handleSelectTemplate(item)}
                    className="mb-2 rounded-xl border p-3"
                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border }}>
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{item.name}</Text>
                        {item.body ? (
                          <Text className={`mt-1 text-[11px] leading-[15px] ${palette.textSoft}`} numberOfLines={2}>
                            {item.body}
                          </Text>
                        ) : null}
                      </View>
                      <View className="items-end gap-1">
                        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                          <Text className="text-[8px] font-bold" style={{ color: badge.color }}>{statusKey}</Text>
                        </View>
                        <Text className={`text-[8px] ${palette.textMuted}`}>{item.language || 'en'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}