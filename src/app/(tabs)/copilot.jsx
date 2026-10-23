import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AppScreen from '~/components/AppScreen';
import MarkdownMessage from '~/components/MarkdownMessage';
import { useCopilotChat } from '~/hooks/useCopilotChat';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '~/utils/crm/colors';
import { CRM_COPILOT_SUGGESTED_PROMPTS } from '~/utils/crm/constants';
import CrmHeader from '../_components/CrmHeader';

export default function CrmCopilotTab() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { deals, forecast, workspaceId, openCreateTask, openCreateDeal } = useCrm();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');

  const {
    messages,
    loading,
    streamingId,
    send,
    stop,
    clear,
    regenerate,
    isStreaming,
  } = useCopilotChat({ workspaceId, deals, forecast });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSend = (customPrompt = null) => {
    const query = (customPrompt ?? inputText).trim();
    if (!query || loading) return;
    setInputText('');
    send(query);
  };

  const handleCopy = async (content) => {
    await Clipboard.setStringAsync(content || '');
    Toast.show({ type: 'success', text1: 'Copied to clipboard' });
  };

  const handleAction = (action) => {
    if (!action) return;
    if (action.route) {
      router.push(action.route);
      return;
    }
    const payload = action.payload || action;
    if (action.type === 'create_task') {
      openCreateTask(payload);
      return;
    }
    if (action.type === 'create_deal') {
      openCreateDeal(payload.stageId || null);
      return;
    }
    const dealId = action.dealId || payload.dealId;
    if (dealId) {
      router.push(`/deals/${dealId}`);
      return;
    }
    const contactId = action.contactId || payload.contactId;
    if (contactId) {
      router.push(`/contacts/${contactId}`);
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <AppScreen>
      <CrmHeader
        title="FlowGenix Copilot"
        subtitle="AI Sales Strategist & Intelligence"
        rightActions={
          <View className="flex-row items-center gap-x-1.5">
            {messages.length > 1 && (
              <Pressable
                onPress={regenerate}
                disabled={loading}
                className="h-9 w-9 items-center justify-center rounded-xl border active:opacity-75"
                style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
              >
                <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
              </Pressable>
            )}
            <Pressable
              onPress={clear}
              className="h-9 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl border active:opacity-75"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
              <Text className="text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                Clear
              </Text>
            </Pressable>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
          className="flex-1"
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isPending = !isUser && m.pending && !m.content;
            return (
              <View
                key={m.id}
                className={`mb-3 flex-row items-start gap-x-2 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <View
                    className="h-7 w-7 items-center justify-center rounded-xl shadow-sm mt-0.5"
                    style={{ backgroundColor: colors.copilot }}
                  >
                    <Ionicons name="sparkles" size={13} color="#ffffff" />
                  </View>
                )}

                <View className={`max-w-[84%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <View
                    className={`rounded-2xl p-3 shadow-sm ${
                      isUser ? 'rounded-tr-xs' : 'rounded-tl-xs border'
                    }`}
                    style={{
                      backgroundColor: isUser ? colors.primary : colors.card,
                      borderColor: isUser ? colors.primary : colors.border,
                    }}
                  >
                    {isPending ? (
                      <View className="flex-row items-center gap-x-2">
                        <ActivityIndicator size="small" color={colors.copilot} />
                        <Text
                          className="text-[11px] font-semibold italic"
                          style={{ color: colors.copilot }}
                        >
                          Synthesizing pipeline intelligence...
                        </Text>
                      </View>
                    ) : isUser ? (
                      <Text className="text-xs leading-5 font-bold text-white">{m.content}</Text>
                    ) : (
                      <MarkdownMessage content={m.content} />
                    )}
                  </View>

                  {!isUser && (
                    <View className="mt-1 flex-row items-center gap-x-3 px-1">
                      <Pressable onPress={() => handleCopy(m.content)} className="flex-row items-center gap-x-1">
                        <Ionicons name="copy-outline" size={11} color={colors.textMuted} />
                        <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                          Copy
                        </Text>
                      </Pressable>
                      {streamingId === m.id && (
                        <Text className="text-[10px] font-semibold" style={{ color: colors.copilot }}>
                          Streaming...
                        </Text>
                      )}
                    </View>
                  )}

                  {Array.isArray(m.actions) && m.actions.length > 0 && (
                    <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                      {m.actions.map((action, idx) => (
                        <Pressable
                          key={`${m.id}-action-${idx}`}
                          onPress={() => handleAction(action)}
                          className="flex-row items-center gap-x-1 rounded-xl border px-2.5 py-1.5 active:opacity-75"
                          style={{ backgroundColor: colors.copilotSoft, borderColor: colors.copilotBorder }}
                        >
                          <Ionicons
                            name={action.icon || 'flash-outline'}
                            size={11}
                            color={colors.copilot}
                          />
                          <Text className="text-[10px] font-bold" style={{ color: colors.copilot }}>
                            {action.label || 'Take action'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {loading && lastMessage?.content && streamingId && (
            <View className="flex-row items-start gap-x-2 mb-3">
              <View
                className="h-7 w-7 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.copilot }}
              >
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            </View>
          )}
        </ScrollView>

        <View
          className="border-t px-3 pt-2"
          style={{
            backgroundColor: colors.header,
            borderColor: colors.border,
            paddingBottom: 76,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-x-1.5 pb-2"
          >
            {CRM_COPILOT_SUGGESTED_PROMPTS.map((p, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(p)}
                disabled={loading}
                className="rounded-xl border px-2.5 py-1.5 active:opacity-75 mr-1"
                style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
              >
                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row items-center gap-x-2 pb-2.5 pt-1">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Copilot anything about your CRM..."
              placeholderTextColor={colors.inputPlaceholder}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline
              className="flex-1 rounded-2xl border px-3.5 py-2.5 max-h-28 text-xs"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {isStreaming ? (
              <Pressable
                onPress={stop}
                className="h-11 w-11 items-center justify-center rounded-2xl active:opacity-80"
                style={{ backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }}
              >
                <Ionicons name="stop" size={18} color={colors.text} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleSend()}
                disabled={loading || !inputText.trim()}
                className="h-11 w-11 items-center justify-center rounded-2xl active:opacity-80"
                style={{
                  backgroundColor: colors.primary,
                  opacity: loading || !inputText.trim() ? 0.5 : 1,
                }}
              >
                <Ionicons name="arrow-up" size={18} color="#ffffff" />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
