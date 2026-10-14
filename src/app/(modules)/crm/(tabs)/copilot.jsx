import Ionicons from '@expo/vector-icons/Ionicons';
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
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import { CRM_COPILOT_SUGGESTED_PROMPTS } from '../utils/constants';
import * as crmService from '~/services/crm';
import CrmHeader from '../_components/CrmHeader';

export default function CrmCopilotTab() {
  const { colors } = useCrmTheme();
  const { deals, forecast } = useCrm();
  const scrollViewRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am **FlowGenix Sales Copilot**.\n\nI have real-time visibility into your **${deals.length} active opportunities** (₹ ${(
        forecast?.summary?.totalPipelineValue || 0
      ).toLocaleString('en-IN')} total pipeline).\n\nAsk me for closing strategies, pitch drafts, deal health diagnostics, or objection handling!`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSend = async (customPrompt = null) => {
    const query = (customPrompt || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setLoading(true);

    try {
      const res = await crmService.askCopilotChat(
        query,
        nextHistory.map((m) => ({ role: m.role, content: m.content }))
      );

      if (res.success && res.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: res.data.reply,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `⚠️ ${res.error || 'Failed to generate response. Please try again.'}`,
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Error: ${e.message || 'Network error occurred.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Chat reset! Ask me anything about your active deals, client communications, or revenue forecasts.`,
      },
    ]);
  };

  return (
    <AppScreen>
      <CrmHeader
        title="FlowGenix Copilot"
        subtitle="AI Sales Strategist & Intelligence"
        rightActions={
          <Pressable
            onPress={clearChat}
            className="h-9 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl border active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
            <Text className="text-[11px] font-semibold" style={{ color: colors.textMuted }}>
              Clear
            </Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
          className="flex-1"
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
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

                <View
                  className={`max-w-[84%] rounded-2xl p-3 shadow-sm ${
                    isUser ? 'rounded-tr-xs' : 'rounded-tl-xs border'
                  }`}
                  style={{
                    backgroundColor: isUser ? colors.primary : colors.card,
                    borderColor: isUser ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-xs leading-5"
                    style={{
                      color: isUser ? '#ffffff' : colors.text,
                      fontWeight: isUser ? '700' : '500',
                    }}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View className="flex-row items-start gap-x-2 mb-3">
              <View
                className="h-7 w-7 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.copilot }}
              >
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
              <View
                className="rounded-2xl border p-3 rounded-tl-xs shadow-sm"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs font-semibold italic" style={{ color: colors.copilot }}>
                  FlowGenix AI is synthesizing pipeline intelligence...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested Prompts Horizon */}
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
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View className="flex-row items-center gap-x-2 pb-2.5 pt-1">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Copilot anything about your CRM..."
              placeholderTextColor={colors.inputPlaceholder}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              className="flex-1 rounded-2xl border px-3.5 py-2 text-xs"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            <Pressable
              onPress={() => handleSend()}
              disabled={loading || !inputText.trim()}
              className="h-9 w-9 items-center justify-center rounded-2xl active:opacity-80"
              style={{
                backgroundColor: colors.primary,
                opacity: loading || !inputText.trim() ? 0.5 : 1,
              }}
            >
              <Ionicons name="arrow-up" size={17} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

