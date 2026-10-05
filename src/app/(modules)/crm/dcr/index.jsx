import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { getDcrRecords, createDcrRecord } from '~/services/crm';

const CALL_TYPES = [
  { value: 'PHONE_CALL', label: 'Phone Call', icon: 'call', color: '#3b82f6' },
  { value: 'FIELD_VISIT', label: 'Field Visit', icon: 'car', color: '#f59e0b' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#10b981' },
  { value: 'VIDEO_DEMO', label: 'Video Demo', icon: 'videocam', color: '#a855f7' },
  { value: 'PAYMENT_COLLECTION', label: 'Payment', icon: 'cash', color: '#059669' },
];

const OUTCOMES = [
  { value: 'HOT_LEAD', label: '🔥 Hot Lead', color: '#e11d48' },
  { value: 'PROPOSAL_SENT', label: '📄 Proposal Sent', color: '#6366f1' },
  { value: 'FOLLOWUP_SCHEDULED', label: '⏰ Follow-up Set', color: '#d97706' },
  { value: 'WON', label: '🏆 Deal Won', color: '#10b981' },
  { value: 'GATEKEEPER', label: '⏳ No Answer', color: '#64748b' },
  { value: 'NOT_INTERESTED', label: '❌ Not Interested', color: '#ef4444' },
];

export default function DcrScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('TODAY'); // 'TODAY', 'YESTERDAY', 'ALL'
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [callType, setCallType] = useState('PHONE_CALL');
  const [callPurpose, setCallPurpose] = useState('Product Demo & Sales Pitch');
  const [conversation, setConversation] = useState('');
  const [outcome, setOutcome] = useState('FOLLOWUP_SCHEDULED');
  const [nextAction, setNextAction] = useState('Send WhatsApp quote and follow up');
  const [dealValue, setDealValue] = useState('');
  const [location, setLocation] = useState('');

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().slice(0, 10);
      let dateParam = todayStr;
      if (dateFilter === 'YESTERDAY') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        dateParam = y.toISOString().slice(0, 10);
      } else if (dateFilter === 'ALL') {
        dateParam = 'ALL';
      }

      const res = await getDcrRecords({ date: dateParam });
      if (res.success) {
        setRecords(res.data || []);
        setMetrics(res.metrics || null);
      }
    } catch (err) {
      console.warn('Failed to load DCR records:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleCreateDcr = async () => {
    if (!clientName.trim() && !contactPerson.trim()) {
      Alert.alert('Required', 'Please enter Client Name or Contact Person');
      return;
    }
    if (!conversation.trim()) {
      Alert.alert('Required', 'Please enter conversation notes');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createDcrRecord({
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        callType,
        callPurpose: callPurpose.trim(),
        conversation: conversation.trim(),
        outcome,
        nextFollowUpAction: nextAction.trim(),
        dealValue: dealValue ? parseFloat(dealValue) : 0,
        location: location.trim(),
      });

      if (res.success) {
        Alert.alert('Success', 'Daily Call Record logged successfully!');
        setIsModalVisible(false);
        // Reset form
        setClientName('');
        setContactPerson('');
        setPhone('');
        setConversation('');
        setDealValue('');
        setLocation('');
        loadRecords();
      } else {
        Alert.alert('Error', res.error || 'Failed to create DCR record');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit call record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = (num) => {
    if (!num) return;
    Linking.openURL(`tel:${num.replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsApp = (num, name) => {
    if (!num) return;
    const cleanNum = num.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hi ${name || 'there'}! Thank you for speaking with me earlier today. Following up on our discussion.`);
    Linking.openURL(`https://wa.me/${cleanNum}?text=${msg}`);
  };

  return (
    <AppScreen style="p-0">
      {/* Header */}
      <View className={`flex-row items-center justify-between border-b ${palette.border} ${palette.surface} px-4 py-3.5`}>
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            className={`h-9 w-9 items-center justify-center rounded-xl border ${palette.border} ${palette.surfaceAlt}`}
          >
            <Ionicons name="arrow-back" size={18} color={palette.textColor} />
          </TouchableOpacity>
          <View>
            <Text className={`text-base font-black ${palette.text}`}>Activity Center</Text>
            <Text className={`text-[11px] font-medium ${palette.textMuted}`}>Calls, Visits & Meetings</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="flex-row items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 shadow-sm"
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Log Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Tabs */}
      <View className={`flex-row items-center justify-around border-b ${palette.border} ${palette.surface} py-2 px-3`}>
        {['TODAY', 'YESTERDAY', 'ALL'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setDateFilter(tab)}
            className={`rounded-lg px-4 py-1.5 ${
              dateFilter === tab ? 'bg-indigo-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                dateFilter === tab ? 'text-white' : palette.textMuted
              }`}
            >
              {tab === 'TODAY' ? 'Today' : tab === 'YESTERDAY' ? 'Yesterday' : 'All Logs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPI Metrics Summary Strip */}
      {metrics && (
        <View className={`flex-row items-center justify-between border-b ${palette.border} ${palette.surfaceAlt} px-4 py-2.5`}>
          <View className="items-center">
            <Text className="text-sm font-black text-indigo-400">{metrics.totalCalls}</Text>
            <Text className={`text-[10px] ${palette.textMuted}`}>Total Calls</Text>
          </View>
          <View className="h-6 w-[1px] bg-slate-700/50" />
          <View className="items-center">
            <Text className="text-sm font-black text-amber-500">{metrics.fieldVisitsCount}</Text>
            <Text className={`text-[10px] ${palette.textMuted}`}>Field Visits</Text>
          </View>
          <View className="h-6 w-[1px] bg-slate-700/50" />
          <View className="items-center">
            <Text className="text-sm font-black text-emerald-500">{metrics.positiveOutcomesCount}</Text>
            <Text className={`text-[10px] ${palette.textMuted}`}>Hot / Won</Text>
          </View>
          <View className="h-6 w-[1px] bg-slate-700/50" />
          <View className="items-center">
            <Text className="text-sm font-black text-purple-400">₹ {(metrics.totalDealPotential / 1000).toFixed(0)}k</Text>
            <Text className={`text-[10px] ${palette.textMuted}`}>Potential</Text>
          </View>
        </View>
      )}

      {/* Main List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className={`mt-2 text-xs ${palette.textMuted}`}>Loading Activity Records...</Text>
        </View>
      ) : records.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 mb-3">
            <Ionicons name="call" size={28} color="#6366f1" />
          </View>
          <Text className={`text-base font-bold ${palette.text}`}>No Activity Records Found</Text>
          <Text className={`mt-1 text-center text-xs ${palette.textMuted}`}>
            You haven't recorded any client calls or field visits for this timeframe.
          </Text>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5"
          >
            <Text className="text-xs font-bold text-white">Log First Activity</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 80, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRecords();
              }}
              tintColor="#6366f1"
            />
          }
          renderItem={({ item }) => {
            const typeConfig = CALL_TYPES.find((t) => t.value === item.callType) || CALL_TYPES[0];
            const outcomeConfig = OUTCOMES.find((o) => o.value === item.outcome) || OUTCOMES[2];

            return (
              <View className={`rounded-2xl border ${palette.border} ${palette.surface} p-3.5 shadow-sm`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{ backgroundColor: `${typeConfig.color}20` }}
                      className="h-8 w-8 items-center justify-center rounded-xl"
                    >
                      <Ionicons name={typeConfig.icon} size={16} color={typeConfig.color} />
                    </View>
                    <View>
                      <Text className={`text-sm font-bold ${palette.text}`}>{item.clientName}</Text>
                      {item.contactPerson ? (
                        <Text className={`text-[11px] ${palette.textMuted}`}>{item.contactPerson}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-1.5">
                    {item.phone ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleCall(item.phone)}
                          className="h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15"
                        >
                          <Ionicons name="call" size={13} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleWhatsApp(item.phone, item.clientName)}
                          className="h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15"
                        >
                          <Ionicons name="logo-whatsapp" size={13} color="#10b981" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Conversation Summary */}
                <View className={`mt-2.5 rounded-xl border ${palette.border} ${palette.surfaceAlt} p-2.5`}>
                  <Text className="text-[10px] font-bold text-indigo-400 mb-0.5">
                    {item.callPurpose || 'Sales Discussion'}
                  </Text>
                  <Text className={`text-xs ${palette.text}`} numberOfLines={3}>
                    {item.description}
                  </Text>
                </View>

                {/* Footer Badges */}
                <View className="mt-2.5 flex-row items-center justify-between pt-1">
                  <View
                    style={{ backgroundColor: `${outcomeConfig.color}15`, borderColor: `${outcomeConfig.color}40` }}
                    className="rounded-lg border px-2 py-0.5"
                  >
                    <Text style={{ color: outcomeConfig.color }} className="text-[10px] font-bold">
                      {outcomeConfig.label}
                    </Text>
                  </View>

                  {item.dealValue > 0 ? (
                    <Text className="text-xs font-black text-emerald-500">
                      ₹ {Number(item.dealValue).toLocaleString('en-IN')}
                    </Text>
                  ) : null}

                  <Text className={`text-[10px] ${palette.textMuted}`}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Log Call Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[90%] rounded-t-3xl border-t ${palette.border} ${palette.surface} p-5`}>
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-700/50">
              <View className="flex-row items-center gap-2">
                <Ionicons name="call" size={18} color="#6366f1" />
                <Text className={`text-base font-black ${palette.text}`}>Log Sales Activity</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={22} color={palette.textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-3 space-y-3" showsVerticalScrollIndicator={false}>
              {/* Client Name */}
              <View>
                <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Client / Company Name *</Text>
                <TextInput
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="e.g. Apex Tech Solutions"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3 py-2.5 text-xs ${palette.text}`}
                />
              </View>

              {/* Contact Person & Phone */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Contact Person</Text>
                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3 py-2.5 text-xs ${palette.text}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Phone Number</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3 py-2.5 text-xs ${palette.text}`}
                  />
                </View>
              </View>

              {/* Interaction Type */}
              <View>
                <Text className={`text-xs font-bold mb-1.5 ${palette.text}`}>Interaction Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {CALL_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setCallType(t.value)}
                      className={`rounded-xl border px-3 py-1.5 flex-row items-center gap-1.5 ${
                        callType === t.value ? 'bg-indigo-600 border-indigo-500' : `${palette.surfaceAlt} ${palette.border}`
                      }`}
                    >
                      <Ionicons
                        name={t.icon}
                        size={13}
                        color={callType === t.value ? '#ffffff' : t.color}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          callType === t.value ? 'text-white' : palette.text
                        }`}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Discussion Notes */}
              <View>
                <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Key Discussion Points *</Text>
                <TextInput
                  value={conversation}
                  onChangeText={setConversation}
                  multiline
                  numberOfLines={4}
                  placeholder="Summary of requirements discussed, pricing quoted, client objections..."
                  placeholderTextColor={palette.textMutedColor}
                  className={`min-h-[80px] rounded-xl border ${palette.border} ${palette.surfaceAlt} p-3 text-xs ${palette.text}`}
                />
              </View>

              {/* Outcome */}
              <View>
                <Text className={`text-xs font-bold mb-1.5 ${palette.text}`}>Outcome / Result</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {OUTCOMES.map((o) => (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => setOutcome(o.value)}
                      className={`rounded-xl border px-3 py-1.5 ${
                        outcome === o.value ? 'bg-indigo-600 border-indigo-500' : `${palette.surfaceAlt} ${palette.border}`
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          outcome === o.value ? 'text-white' : palette.text
                        }`}
                      >
                        {o.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Potential Value */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Deal Potential (₹)</Text>
                  <TextInput
                    value={dealValue}
                    onChangeText={setDealValue}
                    placeholder="e.g. 50000"
                    keyboardType="numeric"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3 py-2.5 text-xs ${palette.text}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs font-bold mb-1 ${palette.text}`}>Location / Area</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Noida Sector 62"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border ${palette.border} ${palette.surfaceAlt} px-3 py-2.5 text-xs ${palette.text}`}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateDcr}
                disabled={submitting}
                className="mt-2 mb-6 items-center justify-center rounded-xl bg-indigo-600 py-3.5 shadow-md"
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-sm font-bold text-white">Save Activity Record</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
