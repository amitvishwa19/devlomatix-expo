import React, { useState } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCrmTheme } from '../../utils/colors';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import * as crmService from '~/services/crm';

const OUTCOMES = [
  { value: 'HOT_LEAD', label: '🔥 Hot Lead', color: '#f59e0b' },
  { value: 'PROPOSAL_SENT', label: '📄 Proposal Requested', color: '#6366f1' },
  { value: 'FOLLOWUP_SCHEDULED', label: '⏰ Follow-up Scheduled', color: '#3b82f6' },
  { value: 'WON', label: '🏆 Deal Won', color: '#10b981' },
  { value: 'GATEKEEPER', label: '⏳ Gatekeeper / Busy', color: '#8b5cf6' },
  { value: 'NOT_INTERESTED', label: '❌ Not Interested', color: '#ef4444' },
];

const formatDuration = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function PostCallSummaryModal() {
  const { colors, isDark } = useCrmTheme();
  const { postCallRecord, setPostCallRecord } = useCrmSocket();

  const [outcome, setOutcome] = useState('FOLLOWUP_SCHEDULED');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!postCallRecord) return null;

  const { targetName, duration, callType, contactOrDealInfo } = postCallRecord;

  const handleSave = async () => {
    try {
      setSaving(true);

      // Log call report directly to CRM DCR records
      await crmService.createDcrRecord({
        contactId: contactOrDealInfo?.contactId || null,
        clientName: targetName,
        callType: callType === 'video' ? 'VIDEO_CALL' : 'VOICE_CALL',
        discussionPoints: notes.trim() || `In-App Call with ${targetName}`,
        outcome,
        durationSeconds: duration,
        meetingType: 'PHONE_CALL',
      });

      Alert.alert('Report Saved', 'Call summary successfully logged to CRM DCR.');
      setPostCallRecord(null);
      setNotes('');
    } catch (e) {
      console.warn('Error saving post-call log:', e);
      // Still allow dismissal
      setPostCallRecord(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    setPostCallRecord(null);
    setNotes('');
  };

  return (
    <Modal visible={!!postCallRecord} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <View
          className="w-full rounded-t-[28px] border-t p-4 pb-7 shadow-2xl max-h-[85%]"
          style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
        >
          {/* Header Row */}
          <View
            className="flex-row items-center justify-between pb-2.5 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <View className="flex-row items-center gap-2">
              <View
                className="p-1.5 rounded-xl border"
                style={{
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primaryBorder,
                }}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text className="text-sm font-black" style={{ color: colors.text }}>
                  Post-Call Summary
                </Text>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  {targetName} • {formatDuration(duration)}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleDismiss} className="p-1 rounded-full">
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5">
            {/* Outcome Selection */}
            <Text className="text-xs font-bold mb-1.5" style={{ color: colors.text }}>
              Call Outcome
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {OUTCOMES.map((item) => {
                const isSelected = outcome === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.7}
                    onPress={() => setOutcome(item.value)}
                    className="px-2.5 py-1.5 rounded-xl border"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{
                        color: isSelected ? '#ffffff' : colors.text,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Conversation Notes Input */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Meeting Notes & Next Steps
            </Text>
            <TextInput
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter brief discussion summary, commitments, or follow-up date..."
              placeholderTextColor={colors.inputPlaceholder}
              className="w-full rounded-2xl border p-2.5 text-xs mb-4 min-h-[75px]"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDismiss}
                className="flex-1 py-2.5 rounded-xl border items-center justify-center"
                style={{ borderColor: colors.border }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.textMuted }}>
                  Skip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl items-center justify-center shadow-md flex-row gap-1.5"
                style={{
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={15} color="#ffffff" />
                    <Text className="text-xs font-bold text-white">
                      Save to CRM DCR
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
