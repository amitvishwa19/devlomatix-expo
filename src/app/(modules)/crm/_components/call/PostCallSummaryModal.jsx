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
import { useAppTheme } from '~/theme/AppTheme';
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
  const { palette } = useAppTheme();
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
      <View className="flex-1 justify-end bg-black/60">
        <View
          className={`w-full rounded-t-[28px] border-t ${palette.border} ${palette.surface} p-5 pb-8 shadow-2xl max-h-[85%]`}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-700/20">
            <View className="flex-row items-center gap-2">
              <View className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                <Ionicons name="document-text-outline" size={18} color="#6366f1" />
              </View>
              <View>
                <Text className={`text-[16px] font-extrabold ${palette.text}`}>
                  Post-Call Summary
                </Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  {targetName} • {formatDuration(duration)}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleDismiss} className="p-1.5 rounded-full">
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Outcome Selection */}
            <Text className={`text-[12px] font-bold ${palette.text} mb-2`}>
              Call Outcome
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-4">
              {OUTCOMES.map((item) => {
                const isSelected = outcome === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.7}
                    onPress={() => setOutcome(item.value)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500'
                        : `${palette.surfaceAlt} ${palette.border}`
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-white' : palette.text
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Conversation Notes Input */}
            <Text className={`text-[12px] font-bold ${palette.text} mb-1.5`}>
              Meeting Notes & Next Steps
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter brief discussion summary, commitments, or follow-up date..."
              placeholderTextColor={palette.textMutedColor}
              className={`w-full rounded-2xl border ${palette.border} ${palette.surfaceAlt} p-3 text-[13px] ${palette.text} mb-5 min-h-[90px]`}
            />

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDismiss}
                className={`flex-1 py-3 rounded-xl border ${palette.border} items-center justify-center`}
              >
                <Text className={`text-[13px] font-bold ${palette.textMuted}`}>
                  Skip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-indigo-600 items-center justify-center shadow-md shadow-indigo-600/30 flex-row gap-2"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                    <Text className="text-[13px] font-bold text-white">
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
