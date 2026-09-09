import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '~/theme/AppTheme';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as settingsService from '~/services/konnectx/settings';

const VERTICALS = [
  'RETAIL',
  'RESTAURANT',
  'HEALTH',
  'FINANCE',
  'TRAVEL',
  'EDU',
  'APPAREL',
  'BEAUTY',
  'AUTO',
  'PROF_SERVICES',
  'OTHER',
];

export default function BusinessProfileScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    about: '',
    description: '',
    email: '',
    websites: '',
    address: '',
    vertical: '',
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await settingsService.getBusinessProfile(userId);
      setProfile(data);
      setForm({
        about: data?.about || '',
        description: data?.description || '',
        email: data?.email || '',
        websites: Array.isArray(data?.websites) ? data.websites.join(', ') : (data?.websites || ''),
        address: data?.address || '',
        vertical: data?.vertical || '',
      });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        about: form.about.trim(),
        description: form.description.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        vertical: form.vertical,
        websites: form.websites.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await settingsService.updateBusinessProfile(userId, body);
      Toast.show({ type: 'success', text1: 'Business profile updated' });
      fetchProfile();
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, icon, children }) => (
    <View className="mb-4">
      <View className="mb-1.5 flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color="#0284c7" />
        <Text className={`text-[13px] font-semibold ${palette.text}`}>{label}</Text>
      </View>
      {children}
    </View>
  );

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
            <View className="mb-0.5 self-start rounded-full bg-emerald-600 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-white">PROFILE</Text>
            </View>
            <Text className={`text-[22px] font-bold ${palette.text}`}>Business Profile</Text>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving || loading}
            className="flex-row items-center gap-1 rounded-full bg-sky-600 px-3.5 py-2.5 shadow-lg">
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text className="text-[12px] font-bold text-white">{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <Text className={`mb-3 text-[12px] leading-5 ${palette.textSoft}`}>
          This info appears on your WhatsApp business page when customers view your profile.
        </Text>

        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : error ? (
          <KonnectxEmptyState icon="alert-circle-outline" title="Couldn't load profile"
            description={error} ctaLabel="Retry" onCtaPress={fetchProfile} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {profile?.profile_picture_url ? (
              <View className="mb-4 items-center">
                <Image source={{ uri: profile.profile_picture_url }}
                  className="h-20 w-20 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }} />
                <Text className={`mt-2 text-[11px] ${palette.textSoft}`}>Profile picture</Text>
              </View>
            ) : null}

            <View className="mb-4 rounded-[16px] border p-4"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>

              <Field label="About" icon="chatbubble-ellipses-outline">
                <TextInput className="rounded-xl border px-4 py-3 text-[14px]"
                  style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
                  placeholder="Short tagline shown under your business name" placeholderTextColor={palette.textMutedColor}
                  value={form.about} onChangeText={(v) => setForm({ ...form, about: v })}
                  multiline numberOfLines={2} textAlignVertical="top" maxLength={139} />
              </Field>

              <Field label="Description" icon="document-text-outline">
                <TextInput className="rounded-xl border px-4 py-3 text-[14px]"
                  style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
                  placeholder="Describe what your business offers" placeholderTextColor={palette.textMutedColor}
                  value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
                  multiline numberOfLines={4} textAlignVertical="top" maxLength={512} />
              </Field>

              <Field label="Email" icon="mail-outline">
                <TextInput className="rounded-xl border px-4 py-3 text-[14px]"
                  style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
                  placeholder="support@yourbusiness.com" placeholderTextColor={palette.textMutedColor}
                  value={form.email} onChangeText={(v) => setForm({ ...form, email: v })}
                  keyboardType="email-address" autoCapitalize="none" />
              </Field>

              <Field label="Websites" icon="globe-outline">
                <TextInput className="rounded-xl border px-4 py-3 text-[14px]"
                  style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
                  placeholder="yourbusiness.com, anothersite.com (comma separated)" placeholderTextColor={palette.textMutedColor}
                  value={form.websites} onChangeText={(v) => setForm({ ...form, websites: v })}
                  autoCapitalize="none" />
              </Field>

              <Field label="Address" icon="location-outline">
                <TextInput className="rounded-xl border px-4 py-3 text-[14px]"
                  style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border, color: palette.textColor }}
                  placeholder="Your business address" placeholderTextColor={palette.textMutedColor}
                  value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
              </Field>

              <Field label="Category (Vertical)" icon="pricetag-outline">
                <View className="flex-row flex-wrap gap-2">
                  {VERTICALS.map((v) => (
                    <TouchableOpacity key={v} onPress={() => setForm({ ...form, vertical: v })}
                      className={`rounded-full border px-3 py-1.5 ${form.vertical === v ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
                      style={form.vertical !== v ? { backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border } : {}}>
                      <Text className={`text-[11px] font-bold ${form.vertical === v ? 'text-emerald-600' : palette.textMuted}`}>
                        {v.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}