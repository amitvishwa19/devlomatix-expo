import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import { getSession } from '~/utils/authStorage';
import { useCrmTheme } from '../utils/colors';

export default function ContactCard({ contact, onShare }) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp } = useCrm();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getSession().then((s) => {
      const uid = s?.user?.id || s?.user?.userId || s?.user?._id;
      if (uid) setCurrentUserId(uid);
    });
  }, []);

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

  const ma = contact.moduleAccess || {};
  const isAts = Array.isArray(ma.modules) && ma.modules.includes('ats');
  const isKonnectx = Array.isArray(ma.modules) && ma.modules.includes('konnectx');
  const hasShares = (Array.isArray(ma.sharedWith) && ma.sharedWith.length > 0) || (Array.isArray(contact.sharedWith) && contact.sharedWith.length > 0);
  const isSharedWithMe = Boolean(currentUserId && contact.userId && contact.userId !== currentUserId);

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/contacts/${contact.id}`)}
      className="mb-2 rounded-[16px] border p-3 shadow-sm active:opacity-80"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Avatar & Info */}
        <View className="flex-row items-center gap-x-2.5 flex-1">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.primaryBorder,
            }}
          >
            <Text className="text-xs font-black" style={{ color: colors.primary }}>
              {initials}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-x-1.5">
              <Text
                className="text-[13px] font-black tracking-tight"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {contact.name}
              </Text>

              {/* Module Visibility Badges */}
              {isAts && (
                <View className="rounded px-1.5 py-0.2 border" style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoBorder }}>
                  <Text className="text-[8px] font-bold" style={{ color: colors.info }}>ATS</Text>
                </View>
              )}
              {isKonnectx && (
                <View className="rounded px-1.5 py-0.2 border" style={{ backgroundColor: colors.whatsappSoft, borderColor: colors.whatsappBorder }}>
                  <Text className="text-[8px] font-bold" style={{ color: colors.whatsapp }}>WA</Text>
                </View>
              )}
              {isSharedWithMe ? (
                <View className="rounded px-1.5 py-0.2 border" style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }}>
                  <Text className="text-[8px] font-bold" style={{ color: colors.primary }}>Shared with you</Text>
                </View>
              ) : hasShares ? (
                <View className="rounded px-1.5 py-0.2 border" style={{ backgroundColor: colors.copilotSoft, borderColor: colors.copilotBorder }}>
                  <Text className="text-[8px] font-bold" style={{ color: colors.copilot }}>Shared</Text>
                </View>
              ) : null}
            </View>

            <Text
              className="text-[11px] font-medium mt-0.5"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
              {contact.account?.name || 'Individual'}
            </Text>

            {contact.phone ? (
              <Text
                className="text-[10px] font-mono mt-0.5"
                style={{ color: colors.textSoft }}
                numberOfLines={1}
              >
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
                className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                style={{
                  backgroundColor: colors.whatsappSoft,
                  borderColor: colors.whatsappBorder,
                }}
              >
                <Ionicons name="logo-whatsapp" size={14} color={colors.whatsapp} />
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                style={{
                  backgroundColor: colors.callSoft,
                  borderColor: colors.callBorder,
                }}
              >
                <Ionicons name="call-outline" size={14} color={colors.call} />
              </Pressable>
            </>
          )}

          {onShare && (
            <Pressable
              onPress={() => onShare(contact)}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="share-social-outline" size={14} color={colors.textMuted} />
            </Pressable>
          )}

          <View className="h-8 w-5 items-center justify-center">
            <Ionicons name="chevron-forward" size={14} color={colors.textSoft} />
          </View>
        </View>
      </View>

      {/* Tags Row */}
      {contact.tags && contact.tags.length > 0 && (
        <View
          className="mt-2 flex-row flex-wrap items-center gap-1.5 pt-2 border-t"
          style={{ borderColor: colors.border }}
        >
          {contact.tags.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              className="rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.textMuted }}>
                {tag}
              </Text>
            </View>
          ))}
          {contact.tags.length > 3 && (
            <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
              +{contact.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

