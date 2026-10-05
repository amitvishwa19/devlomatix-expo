import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';

const PRIORITY_THEMES = {
  URGENT: { bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-400', dot: '#f43f5e' },
  HIGH: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', dot: '#f59e0b' },
  MEDIUM: { bg: 'bg-sky-500/15 border-sky-500/30', text: 'text-sky-400', dot: '#0ea5e9' },
  LOW: { bg: 'bg-slate-500/15 border-slate-500/30', text: 'text-slate-400', dot: '#94a3b8' },
};

export default function DealCard({ deal, onStageChange }) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { openQuickWhatsApp } = useCrm();

  if (!deal) return null;

  const priority = PRIORITY_THEMES[deal.priority] || PRIORITY_THEMES.MEDIUM;
  const stageColor = deal.stage?.color || '#4f46e5';
  const formattedVal = (parseFloat(deal.value) || 0).toLocaleString('en-IN');
  const currencySymbol = deal.currency === 'USD' ? '$' : deal.currency === 'EUR' ? '€' : '₹';

  const handleCall = () => {
    if (deal.contact?.phone) {
      Linking.openURL(`tel:${deal.contact.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (deal.contact) {
      openQuickWhatsApp(deal.contact, deal);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/deals/${deal.id}`)}
      className={`mb-3 rounded-2xl border ${palette.surface} ${palette.border} p-4 shadow-sm active:opacity-80`}
    >
      {/* Top Meta: Stage Pill & Priority */}
      <View className="flex-row items-center justify-between gap-x-2">
        <View className="flex-row items-center gap-x-1.5 flex-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: stageColor }}
          />
          <Text
            className="text-[11px] font-bold tracking-tight"
            style={{ color: stageColor }}
            numberOfLines={1}
          >
            {deal.stage?.name || 'In Pipeline'}
          </Text>
        </View>

        <View className={`flex-row items-center gap-x-1 rounded-full border px-2 py-0.5 ${priority.bg}`}>
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priority.dot }} />
          <Text className={`text-[9px] font-bold tracking-wider ${priority.text}`}>
            {deal.priority || 'MEDIUM'}
          </Text>
        </View>
      </View>

      {/* Deal Title */}
      <Text className={`mt-2 text-base font-black ${palette.text} tracking-tight`} numberOfLines={2}>
        {deal.title}
      </Text>

      {/* Value & Win Probability */}
      <View className="mt-2 flex-row items-baseline gap-x-2">
        <Text className="text-lg font-black text-indigo-400">
          {currencySymbol} {formattedVal}
        </Text>
        {deal.stage?.probability !== undefined ? (
          <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>
            ({deal.stage.probability}% win prob)
          </Text>
        ) : null}
      </View>

      {/* Contact & Company Association */}
      {(deal.contact || deal.account) && (
        <View className={`mt-3 flex-row items-center gap-x-3 rounded-xl ${palette.surfaceAlt} px-2.5 py-2 border ${palette.border}`}>
          <Ionicons name="business-outline" size={14} color={palette.textMutedColor} />
          <View className="flex-1 flex-row items-center justify-between">
            <Text className={`text-xs font-semibold ${palette.text}`} numberOfLines={1}>
              {deal.account?.name || deal.contact?.name}
            </Text>
            {deal.account?.name && deal.contact?.name && (
              <Text className={`text-[10px] ${palette.textMuted} font-medium`} numberOfLines={1}>
                • {deal.contact.name}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Footer */}
      <View className={`mt-3.5 flex-row items-center justify-between border-t ${palette.border} pt-3`}>
        <View className="flex-row items-center gap-x-1.5">
          {deal.contact?.phone ? (
            <>
              <Pressable
                onPress={handleWhatsApp}
                className="flex-row items-center gap-x-1 rounded-xl bg-emerald-500/15 px-2.5 py-1.5 border border-emerald-500/30 active:opacity-75"
              >
                <Ionicons name="logo-whatsapp" size={13} color="#10b981" />
                <Text className="text-[10px] font-bold text-emerald-400">WhatsApp</Text>
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="flex-row items-center gap-x-1 rounded-xl bg-sky-500/15 px-2.5 py-1.5 border border-sky-500/30 active:opacity-75"
              >
                <Ionicons name="call-outline" size={13} color="#0ea5e9" />
                <Text className="text-[10px] font-bold text-sky-400">Call</Text>
              </Pressable>
            </>
          ) : (
            <Text className={`text-[10px] ${palette.textMuted} italic`}>No phone attached</Text>
          )}
        </View>

        <View className="flex-row items-center gap-x-1">
          <Text className="text-[11px] font-bold text-indigo-400">View Dossier</Text>
          <Ionicons name="chevron-forward" size={12} color="#818cf8" />
        </View>
      </View>
    </Pressable>
  );
}
