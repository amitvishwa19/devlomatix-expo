import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import * as appContactsService from '~/services/konnectx/contacts';
import * as chatsService from '~/services/konnectx/chats';
import { useKonnectx } from '~/providers/KonnectxProvider';

export default function TestTemplateDialog({ visible, onClose, template, userId }) {
  const { palette } = useAppTheme();
  const { selectedCredential } = useKonnectx();
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [sending, setSending] = useState(false);

  const [detectedVariables, setDetectedVariables] = useState([]);
  const [variableMappings, setVariableMappings] = useState({});

  useEffect(() => {
    if (visible && template) {
      setPhone('');
      setVariableMappings({});
      const bodyVars = [...(template.body || '').matchAll(/{{(\d+)}}/g)].map(m => m[1]);
      const headerVars = [...(template.metadata?.headerText || '').matchAll(/{{(\d+)}}/g)].map(m => m[1]);
      const uniqueVars = Array.from(new Set([...headerVars, ...bodyVars])).sort((a, b) => parseInt(a) - parseInt(b));
      setDetectedVariables(uniqueVars);
      const mapping = {};
      uniqueVars.forEach(v => mapping[v] = '');
      setVariableMappings(mapping);
      fetchContacts();
    }
  }, [visible, template]);

  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await appContactsService.getContacts(userId, { page: 1, limit: 200 });
      setContacts(data?.data ?? data?.contacts ?? []);
    } catch { }
  }, [userId]);

  const handleSend = async () => {
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Phone number is required' });
      return;
    }

    for (const v of detectedVariables) {
      if (!variableMappings[v]?.trim()) {
        Toast.show({ type: 'error', text1: 'Missing variable', text2: `Please fill in variable {{${v}}}` });
        return;
      }
    }

    setSending(true);
    try {
      const components = [];
      if (detectedVariables.length > 0) {
        components.push({
          type: 'body',
          parameters: detectedVariables.map(v => ({ type: 'text', text: variableMappings[v] || '' })),
        });
      }

      await chatsService.sendMessage(userId, {
        to: phone.trim(),
        type: 'template',
        template: {
          name: template.templateName || template.name,
          language: { code: template.language || 'en_US' },
          components,
        },
      });
      Toast.show({ type: 'success', text1: 'Sent', text2: `Template sent to ${phone.trim()}` });
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSending(false);
    }
  };

  const pickContact = (contact) => {
    setPhone(contact.phone || '');
    setShowContactPicker(false);
  };

  if (!template) return null;

  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch)
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={onClose}>
          <Pressable className={`rounded-[28px] p-6 max-h-[80%] ${palette.surface}`}>
            <Text className={`mb-2 text-[20px] font-bold ${palette.text}`}>Send Template</Text>

            <View className="mb-4 rounded-xl p-3" style={{ backgroundColor: 'rgba(2,132,199,0.05)', borderColor: 'rgba(2,132,199,0.2)', borderWidth: 1 }}>
              <Text className={`text-[11px] font-bold ${palette.text}`}>{template.name}</Text>
              <Text className={`text-[11px] mt-1 ${palette.textSoft}`}>
                {template.category} · {template.language} · {template.type}
              </Text>
              {template.body ? (
                <Text className={`text-[11px] mt-1 italic ${palette.textMuted}`} numberOfLines={2}>{template.body}</Text>
              ) : null}
            </View>

            {detectedVariables.length > 0 ? (
              <View className="mb-4 rounded-xl border p-4" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[12px] font-bold mb-2 ${palette.text}`}>Variables</Text>
                {detectedVariables.map(v => (
                  <View key={v} className="mb-2">
                    <Text className={`text-[10px] font-semibold mb-1 ${palette.text}`}>{'{{'}{v}{'}}'}</Text>
                    <TextInput className="rounded-xl border px-3 py-2 text-[14px]" style={{
                      backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor,
                    }} placeholder={`Value for {{${v}}}`} placeholderTextColor={palette.textMutedColor}
                      value={variableMappings[v] || ''} onChangeText={(val) => setVariableMappings(prev => ({ ...prev, [v]: val }))} />
                  </View>
                ))}
              </View>
            ) : null}

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Phone *</Text>
            <View className="mb-6 flex-row gap-2">
              <TextInput className="flex-1 rounded-xl border px-4 py-3 text-[15px]" style={{
                backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor,
              }} placeholder="+919876543210" placeholderTextColor={palette.textMutedColor}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity onPress={() => setShowContactPicker(true)}
                className="rounded-xl border px-4 py-3" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[12px] font-bold ${palette.textSoft}`}>Contacts</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose}
                className={`flex-1 items-center rounded-xl border py-3.5 ${palette.border}`}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSend} disabled={sending}
                className="flex-1 items-center rounded-xl bg-sky-600 py-3.5">
                <Text className="text-[15px] font-bold text-white">{sending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showContactPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowContactPicker(false)}>
        <View className="flex-1 px-5 pt-5" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-[20px] font-bold ${palette.text}`}>Select Contact</Text>
            <TouchableOpacity onPress={() => setShowContactPicker(false)}>
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>
          <View className="mb-4 flex-row items-center rounded-[20px] border px-4 py-3"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
            <Ionicons name="search" size={18} color={palette.textMutedColor} />
            <TextInput className="ml-2 flex-1 text-[14px]" style={{ color: palette.textColor }}
              placeholder="Search contacts..." placeholderTextColor={palette.textMutedColor}
              value={contactSearch} onChangeText={setContactSearch} />
          </View>
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id?.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => pickContact(item)}
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
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className={`mt-8 text-center text-[14px] ${palette.textSoft}`}>No contacts found</Text>}
          />
        </View>
      </Modal>
    </>
  );
}
