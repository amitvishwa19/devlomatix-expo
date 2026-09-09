import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '~/theme/AppTheme';
import { aiTransformMessage } from '~/utils/aiMessage';

const ACTIONS = [
  { key: 'improve', label: 'Polish', icon: 'sparkles', tint: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
  { key: 'grammar', label: 'Grammar', icon: 'checkmark-done-circle-outline', tint: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { key: 'shorten', label: 'Shorten', icon: 'cut-outline', tint: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  { key: 'friendly', label: 'Friendly', icon: 'happy-outline', tint: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  { key: 'professional', label: 'Formal', icon: 'briefcase-outline', tint: '#0369a1', bg: 'rgba(3,105,161,0.1)' },
  { key: 'promo', label: 'Promo', icon: 'megaphone-outline', tint: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  { key: 'translate', label: 'Hindi', icon: 'language-outline', tint: '#0891b2', bg: 'rgba(8,145,178,0.1)', targetLanguage: 'Hindi' },
  { key: 'translate', label: 'English', icon: 'language-outline', tint: '#059669', bg: 'rgba(5,150,105,0.1)', targetLanguage: 'English' },
];

const RESULTS = {
  improve: 'Polishing your message',
  grammar: 'Fixing grammar & spelling',
  shorten: 'Making it shorter',
  friendly: 'Adding a friendly tone',
  professional: 'Making it professional',
  promo: 'Writing a promo version',
  translate: 'Translating',
};

export default function AiMessageToolbar({ text, onApply }) {
  const { palette } = useAppTheme();
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState(null);

  const hasDraft = !!String(text || '').trim();

  const runAction = async (action) => {
    if (!hasDraft) {
      Toast.show({ type: 'error', text1: 'Nothing to improve', text2: 'Type a message first.' });
      return;
    }
    setBusy(true);
    setResult(null);
    setStatusText(RESULTS[action.key] || 'Working on your message');
    try {
      const res = await aiTransformMessage({
        text,
        action: action.key,
        ...(action.targetLanguage ? { targetLanguage: action.targetLanguage } : {}),
      });
      if (res.success) {
        setResult({ text: res.text, label: action.label });
      } else {
        Toast.show({ type: 'error', text1: 'AI failed', text2: res.error });
      }
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (result?.text && onApply) onApply(result.text);
    setResult(null);
    Toast.show({ type: 'success', text1: 'Applied', text2: 'Message updated.' });
  };

  return (
    <>
      <View className="mb-4">
        <View className="mb-1 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="sparkles" size={13} color="#7c3aed" />
            <Text className={`text-[10px] font-bold uppercase tracking-wide ${palette.textMuted}`}>AI Assistant</Text>
          </View>
          {busy ? <Text className={`text-[10px] ${palette.textMuted}`}>{statusText}...</Text> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={`${a.key}-${a.label}`}
              onPress={() => runAction(a)}
              disabled={busy || !hasDraft}
              className="mr-2 flex-row items-center gap-1 rounded-full border border-sky-600/20 px-3 py-1.5"
              style={[{ opacity: busy || !hasDraft ? 0.5 : 1 }, i === 0 ? { borderColor: '#7c3aed' } : null]}>
              <Ionicons name={a.icon} size={13} color={a.tint} />
              <Text className="text-[11px] font-bold" style={{ color: a.tint }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={!!result} transparent animationType="fade" onRequestClose={() => setResult(null)}>
        <View className="flex-1 justify-center bg-black/50 px-5">
          <View className="rounded-[22px] p-5" style={{ backgroundColor: palette.colors.surface }}>
            <View className="mb-3 flex-row items-center gap-2">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                <Ionicons name="sparkles" size={18} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className={`text-[16px] font-bold ${palette.text}`}>AI {result?.label}</Text>
                <Text className={`text-[11px] ${palette.textSoft}`}>Suggested message</Text>
              </View>
              <TouchableOpacity onPress={() => setResult(null)} className="p-1.5">
                <Ionicons name="close" size={20} color={palette.textColor} />
              </TouchableOpacity>
            </View>

            <View className="mb-4 rounded-xl p-3" style={{ backgroundColor: palette.colors.surfaceAlt }}>
              <Text className={`text-[13px] leading-5 ${palette.text}`} selectable>
                {result?.text}
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <TouchableOpacity onPress={() => setResult(null)}
                className="flex-1 items-center rounded-xl border py-3" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[14px] font-bold ${palette.text}`}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={apply}
                className="flex-[1.4] flex-row items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 shadow-lg">
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text className="text-[14px] font-bold text-white">Use text</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}