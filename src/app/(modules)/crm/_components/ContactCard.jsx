import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';

export default function ContactCard({ contact }) {
  const router = useRouter();
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
      className="mb-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm active:bg-slate-50/80"
    >
      <View className="flex-row items-center justify-between">
        {/* Avatar & Info */}
        <View className="flex-row items-center gap-x-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100/80 border border-indigo-200">
            <Text className="text-sm font-black text-indigo-800">{initials}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-sm font-black text-slate-900 tracking-tight" numberOfLines={1}>
              {contact.name}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5" numberOfLines={1}>
              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
              {contact.account?.name || 'Individual'}
            </Text>

            {contact.phone ? (
              <Text className="text-[10px] font-mono text-slate-400 mt-0.5" numberOfLines={1}>
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
                className="h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 active:bg-emerald-100"
              >
                <Ionicons name="logo-whatsapp" size={15} color="#059669" />
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="h-8.5 w-8.5 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 active:bg-sky-100"
              >
                <Ionicons name="call-outline" size={15} color="#0284c7" />
              </Pressable>
            </>
          )}

          <View className="h-8.5 w-6 items-center justify-center">
            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
          </View>
        </View>
      </View>

      {/* Tags Row */}
      {contact.tags && contact.tags.length > 0 && (
        <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {contact.tags.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200"
            >
              <Text className="text-[9px] font-bold text-slate-600">{tag}</Text>
            </View>
          ))}
          {contact.tags.length > 3 && (
            <Text className="text-[9px] text-slate-400 font-semibold">
              +{contact.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
