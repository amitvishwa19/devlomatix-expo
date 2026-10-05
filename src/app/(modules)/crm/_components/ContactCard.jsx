import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';

export default function ContactCard({ contact }) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { openQuickWhatsApp } = useCrm();

  if (!contact) return null;

  const initials = (contact.name || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCall = () => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleWhatsApp = () => {
    openQuickWhatsApp(contact);
  };

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/contacts/${contact.id}`)}
      className={`mb-2.5 rounded-2xl border ${palette.surface} ${palette.border} p-3.5 shadow-sm active:opacity-80`}
    >
      <View className="flex-row items-center justify-between">
        {/* Avatar & Info */}
        <View className="flex-row items-center gap-x-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <Text className="text-sm font-black text-indigo-400">{initials}</Text>
          </View>

          <View className="flex-1">
            <Text className={`text-sm font-black ${palette.text} tracking-tight`} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text className={`text-[11px] font-medium ${palette.textMuted} mt-0.5`} numberOfLines={1}>
              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
              {contact.account?.name || 'Individual'}
            </Text>

            {contact.phone ? (
              <Text className={`text-[10px] font-mono ${palette.textSoft} mt-0.5`} numberOfLines={1}>
                {contact.phone}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action Shortcuts */}
        <View className="flex-row items-center gap-x-1.5 ml-2">
          {contact.phone && (
            <>
              <Pressable
                onPress={handleWhatsApp}
                className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 active:opacity-70"
              >
                <Ionicons name="logo-whatsapp" size={15} color="#10b981" />
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 active:opacity-70"
              >
                <Ionicons name="call-outline" size={15} color="#0ea5e9" />
              </Pressable>
            </>
          )}

          <View className="h-9 w-6 items-center justify-center">
            <Ionicons name="chevron-forward" size={14} color={palette.textMutedColor} />
          </View>
        </View>
      </View>

      {/* Tags Row */}
      {contact.tags && contact.tags.length > 0 && (
        <View className={`mt-2.5 flex-row flex-wrap items-center gap-1.5 pt-2 border-t ${palette.border}`}>
          {contact.tags.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              className={`rounded-lg ${palette.surfaceAlt} px-2 py-0.5 border ${palette.border}`}
            >
              <Text className={`text-[9px] font-bold ${palette.textMuted}`}>{tag}</Text>
            </View>
          ))}
          {contact.tags.length > 3 && (
            <Text className={`text-[9px] ${palette.textMuted} font-semibold`}>
              +{contact.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
