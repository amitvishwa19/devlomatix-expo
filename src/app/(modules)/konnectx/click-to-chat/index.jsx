import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { Image, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '~/theme/AppTheme';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as settingsService from '~/services/konnectx/settings';

export default function ClickToChatScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await settingsService.getClickToChatInfo(userId);
      setInfo(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const link = info?.displayNumber
    ? `https://wa.me/${info.displayNumber}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`
    : '';

  const qrUrl = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&bgcolor=ffffff&data=${encodeURIComponent(link)}`
    : '';

  const handleShare = async () => {
    try {
      await Share.share({ message: `${message.trim() ? `"${message.trim()}"\n\n` : ''}Chat with us on WhatsApp:\n${link}` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleOpen = async () => {
    try {
      await Linking.openURL(link);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-3 flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
            <Ionicons name="arrow-back" size={20} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="mb-0.5 self-start rounded-full bg-cyan-600 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-white">GROWTH</Text>
            </View>
            <Text className={`text-[22px] font-bold ${palette.text}`}>Link & QR</Text>
          </View>
        </View>

        <Text className={`mb-3 text-[12px] leading-5 ${palette.textSoft}`}>
          Share a click-to-chat link or QR code so customers can start a WhatsApp conversation with you instantly.
        </Text>

        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : error ? (
          <KonnectxEmptyState icon="alert-circle-outline" title="Couldn't load account"
            description={error} ctaLabel="Retry" onCtaPress={fetchInfo} />
        ) : (
          <View className="rounded-[16px] border p-4"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
            <View className="mb-3 flex-row items-center gap-2.5">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Ionicons name="chatbubble-ellipses" size={18} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className={`text-[14px] font-bold ${palette.text}`}>{info?.verifiedName || 'WhatsApp Account'}</Text>
                <Text className={`text-[12px] ${palette.textSoft}`}>+{info?.displayNumber || 'Unknown number'}</Text>
              </View>
              <View className="rounded-full bg-emerald-500/10 px-2 py-1">
                <Text className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Ready</Text>
              </View>
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Prefilled message (optional)</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[14px]"
              style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="e.g. Hi, I'd like to know more about your services" placeholderTextColor={palette.textMutedColor}
              value={message} onChangeText={setMessage} multiline numberOfLines={2} textAlignVertical="top" />

            <View className="mb-4 items-center rounded-[16px] p-4" style={{ backgroundColor: '#ffffff' }}>
              {qrUrl ? (
                <Image source={{ uri: qrUrl }} className="h-56 w-56" resizeMode="contain" />
              ) : null}
            </View>

            <View className="mb-4 rounded-xl p-3" style={{ backgroundColor: palette.colors.surfaceAlt }}>
              <Text className={`text-[12px] font-medium text-sky-600`} selectable numberOfLines={2}>
                {link}
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <TouchableOpacity onPress={handleShare}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-3 shadow-lg">
                <Ionicons name="share-social-outline" size={16} color="#fff" />
                <Text className="text-[14px] font-bold text-white">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpen}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-3"
                style={{ borderColor: palette.colors.border }}>
                <Ionicons name="logo-whatsapp" size={16} color="#10b981" />
                <Text className={`text-[14px] font-bold ${palette.text}`}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}