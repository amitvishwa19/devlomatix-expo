import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import * as chatsService from '~/services/konnectx/chats';
import * as credentialsService from '~/services/konnectx/credentials';

export default function QuickMessageScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await credentialsService.getCredentials(userId);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Phone and message are required' });
      return;
    }
    setSending(true);
    try {
      await chatsService.sendMessage(userId, { to: phone.trim(), type: 'text', body: message.trim() });
      Toast.show({ type: 'success', text1: 'Sent', text2: `Message sent to ${phone.trim()}` });
      setMessages((prev) => [
        { id: `msg-${Date.now()}`, to: phone.trim(), text: message.trim(), time: new Date().toISOString(), status: 'SENT' },
        ...prev
      ]);
      setMessage('');
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
          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Phone Number</Text>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="+919876543210" placeholderTextColor={palette.textMutedColor}
            value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Message</Text>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="Type your message..." placeholderTextColor={palette.textMutedColor}
            value={message} onChangeText={setMessage}
            multiline numberOfLines={4} textAlignVertical="top" />

          <TouchableOpacity onPress={handleSend} disabled={sending || !phone.trim() || !message.trim()}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 shadow-lg"
            style={{ opacity: sending || !phone.trim() || !message.trim() ? 0.6 : 1 }}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text className="text-[16px] font-bold text-white">{sending ? 'Sending...' : 'Send Message'}</Text>
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
                <View className="rounded-full bg-green-500/10 px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-green-600">{item.status}</Text>
                </View>
              </View>
              <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>{item.text}</Text>
              <Text className={`mt-1 text-[10px] ${palette.textMuted}`}>
                {new Date(item.time).toLocaleString()}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
