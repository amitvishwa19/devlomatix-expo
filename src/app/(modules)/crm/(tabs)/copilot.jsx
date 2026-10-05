import React, { useState, useRef, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

const SUGGESTED_PROMPTS = [
  '⚡ Analyze pipeline risks & stalled deals',
  '🎯 Which top deals have the highest close momentum?',
  '✍️ Draft an irresistible WhatsApp follow-up pitch',
  '💡 How to overcome enterprise pricing objections?',
];

export default function CrmCopilotTab() {
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
            className="h-9 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl border border-slate-200 bg-white active:bg-slate-100"
          >
            <Ionicons name="trash-outline" size={14} color="#64748b" />
            <Text className="text-[11px] font-semibold text-slate-600">Clear</Text>
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
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          className="flex-1"
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={m.id}
                className={`mb-3.5 flex-row items-start gap-x-2.5 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                    <Ionicons name="sparkles" size={15} color="#ffffff" />
                  </View>
                )}

                <View
                  className={`max-w-[82%] rounded-2xl p-3.5 shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 rounded-tr-sm'
                      : 'bg-white border border-slate-200 rounded-tl-sm'
                  }`}
                >
                  <Text
                    className={`text-xs leading-5 ${
                      isUser ? 'font-bold text-white' : 'font-medium text-slate-800'
                    }`}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View className="flex-row items-start gap-x-2.5 mb-3.5">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
              <View className="rounded-2xl bg-white border border-slate-200 p-3.5 rounded-tl-sm shadow-sm">
                <Text className="text-xs font-semibold text-indigo-700 italic">
                  FlowGenix AI is synthesizing pipeline intelligence...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested Prompts Horizon */}
        <View className="bg-white border-t border-slate-200 px-3 pt-2" style={{ paddingBottom: 76 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-x-1.5 pb-2"
          >
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(p)}
                disabled={loading}
                className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 active:bg-indigo-100"
              >
                <Text className="text-[11px] font-bold text-indigo-900">{p}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View className="flex-row items-center gap-x-2 pb-2.5 pt-1">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Copilot anything about your CRM..."
              placeholderTextColor="#94a3b8"
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900"
            />

            <Pressable
              onPress={() => handleSend()}
              disabled={loading || !inputText.trim()}
              className={`h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 active:bg-indigo-700 ${
                loading || !inputText.trim() ? 'opacity-50' : ''
              }`}
            >
              <Ionicons name="arrow-up" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
