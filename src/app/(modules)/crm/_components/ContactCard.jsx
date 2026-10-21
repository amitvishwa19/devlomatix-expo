import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

  // Inbound Source (e.g. WhatsApp Inbound, Web Lead, Referral)
  const leadSource = contact.leadSource || contact.source || (contact.phone ? 'Inbound WA' : null);

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/contacts/${contact.id}`)}
      className="mb-2 rounded-[16px] border p-3 active:opacity-85"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOpacity: colors.shadowOpacity,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-x-2.5">
        {/* Avatar on Left */}
        <View className="relative">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.primaryBorder,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              {initials}
            </Text>
          </View>
          {contact.online && (
            <View
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-900 bg-emerald-500"
            />
          )}
        </View>

        {/* Content Layout: Left column stacked, Right column stacked items-end */}
        <View className="flex-1 flex-row justify-between items-center">
          {/* Left Column: Name, Phone, Email, Company */}
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-x-1.5 flex-wrap">
              <Text
                className="text-[13px] font-bold tracking-tight"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {contact.name}
              </Text>
              {isSharedWithMe && (
                <View
                  className="rounded px-1.5 py-0.2 border"
                  style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }}
                >
                  <Text className="text-[8px] font-bold" style={{ color: colors.primary }}>
                    Shared
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-[11px] font-medium mt-0.5"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
              {contact.account?.name || 'Individual Client'}
            </Text>

            {contact.phone ? (
              <Text className="text-[10px] font-mono mt-0.5" style={{ color: colors.textSoft }}>
                {contact.phone}
              </Text>
            ) : contact.email ? (
              <Text className="text-[10px] font-mono mt-0.5" style={{ color: colors.textSoft }}>
                {contact.email}
              </Text>
            ) : null}
          </View>

          {/* Right Column: Badges & Speed Action Chips stacked items-end */}
          <View className="items-end gap-y-1.5">
            {leadSource && (
              <View
                className="rounded-full px-2 py-0.5 border"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-[9px] font-semibold" style={{ color: colors.textSecondary }}>
                  {leadSource}
                </Text>
              </View>
            )}

            {/* Quick Action Buttons */}
            <View className="flex-row items-center gap-x-1.5">
              {contact.phone && (
                <>
                  <Pressable
                    onPress={handleWhatsApp}
                    className="h-7 w-7 items-center justify-center rounded-lg border active:opacity-75"
                    style={{
                      backgroundColor: colors.whatsappSoft,
                      borderColor: colors.whatsappBorder,
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={13} color={colors.whatsapp} />
                  </Pressable>

                  <Pressable
                    onPress={handleCall}
                    className="h-7 w-7 items-center justify-center rounded-lg border active:opacity-75"
                    style={{
                      backgroundColor: colors.callSoft,
                      borderColor: colors.callBorder,
                    }}
                  >
                    <Ionicons name="call-outline" size={13} color={colors.call} />
                  </Pressable>
                </>
              )}

              {onShare && (
                <Pressable
                  onPress={() => onShare(contact)}
                  className="h-7 w-7 items-center justify-center rounded-lg border active:opacity-75"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="share-social-outline" size={13} color={colors.textMuted} />
                </Pressable>
              )}

              <Ionicons name="chevron-forward" size={14} color={colors.textSoft} />
            </View>
          </View>
        </View>
      </View>

      {/* Tags & Open Deskflow Support Tickets Row */}
      {((contact.tags && contact.tags.length > 0) || isAts || isKonnectx) && (
        <View
          className="mt-2 flex-row flex-wrap items-center gap-1.5 pt-2 border-t"
          style={{ borderColor: colors.border }}
        >
          {isKonnectx && (
            <View
              className="rounded-lg px-2 py-0.5 border"
              style={{ backgroundColor: colors.whatsappSoft, borderColor: colors.whatsappBorder }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.whatsapp }}>
                WhatsApp Campaign Active
              </Text>
            </View>
          )}

          {isAts && (
            <View
              className="rounded-lg px-2 py-0.5 border"
              style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoBorder }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.info }}>
                ATS Candidate
              </Text>
            </View>
          )}

          {contact.tags?.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              className="rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[9px] font-medium" style={{ color: colors.textMuted }}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
