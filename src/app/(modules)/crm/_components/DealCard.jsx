import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';

const PRIORITY_THEMES = {
  URGENT: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: '#e11d48' },
  HIGH: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: '#d97706' },
  MEDIUM: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', dot: '#0284c7' },
  LOW: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: '#64748b' },
};

export default function DealCard({ deal, onStageChange }) {
  const router = useRouter();
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
      className="mb-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm active:bg-slate-50/80"
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
      <Text className="mt-2 text-base font-black text-slate-900 tracking-tight" numberOfLines={2}>
        {deal.title}
      </Text>

      {/* Value & Win Probability */}
      <View className="mt-2 flex-row items-baseline gap-x-2">
        <Text className="text-lg font-black text-indigo-700">
          {currencySymbol} {formattedVal}
        </Text>
        {deal.stage?.probability !== undefined ? (
          <Text className="text-[11px] font-semibold text-slate-500">
            ({deal.stage.probability}% win prob)
          </Text>
        ) : null}
      </View>

      {/* Contact & Company Association */}
      {(deal.contact || deal.account) && (
        <View className="mt-3 flex-row items-center gap-x-3 rounded-xl bg-slate-50 px-2.5 py-2 border border-slate-100">
          <Ionicons name="business-outline" size={14} color="#64748b" />
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-700" numberOfLines={1}>
              {deal.account?.name || deal.contact?.name}
            </Text>
            {deal.account?.name && deal.contact?.name && (
              <Text className="text-[10px] text-slate-400 font-medium" numberOfLines={1}>
                • {deal.contact.name}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Footer */}
      <View className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-3">
        <View className="flex-row items-center gap-x-1.5">
          {deal.contact?.phone ? (
            <>
              <Pressable
                onPress={handleWhatsApp}
                className="flex-row items-center gap-x-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 active:bg-emerald-100"
              >
                <Ionicons name="logo-whatsapp" size={13} color="#059669" />
                <Text className="text-[10px] font-bold text-emerald-700">WhatsApp</Text>
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="flex-row items-center gap-x-1 rounded-xl bg-sky-50 px-2.5 py-1.5 border border-sky-200 active:bg-sky-100"
              >
                <Ionicons name="call-outline" size={13} color="#0284c7" />
                <Text className="text-[10px] font-bold text-sky-700">Call</Text>
              </Pressable>
            </>
          ) : (
            <Text className="text-[10px] text-slate-400 italic">No phone attached</Text>
          )}
        </View>

        <View className="flex-row items-center gap-x-1">
          <Text className="text-[11px] font-bold text-indigo-600">View Dossier</Text>
          <Ionicons name="chevron-forward" size={12} color="#4f46e5" />
        </View>
      </View>
    </Pressable>
  );
}
