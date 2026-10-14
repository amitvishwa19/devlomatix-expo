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
import { useCrmTheme } from '../utils/colors';
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
  const { colors, isDark } = useCrmTheme();

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
    <AppScreen style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b px-3 py-2.5"
        style={{ backgroundColor: colors.header, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            className="h-8 w-8 items-center justify-center rounded-xl border"
            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text className="text-sm font-black" style={{ color: colors.text }}>
              Activity Center
            </Text>
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              Calls, Visits & Meetings
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="flex-row items-center gap-1 rounded-xl px-2.5 py-1.5 shadow-sm"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={15} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Log Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Tabs */}
      <View
        className="flex-row items-center justify-around border-b py-1.5 px-3"
        style={{ backgroundColor: colors.card, borderBottomColor: colors.border }}
      >
        {['TODAY', 'YESTERDAY', 'ALL'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setDateFilter(tab)}
            className="rounded-lg px-3.5 py-1"
            style={{
              backgroundColor: dateFilter === tab ? colors.primary : 'transparent',
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color: dateFilter === tab ? '#ffffff' : colors.textMuted,
              }}
            >
              {tab === 'TODAY' ? 'Today' : tab === 'YESTERDAY' ? 'Yesterday' : 'All Logs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPI Metrics Summary Strip */}
      {metrics && (
        <View
          className="flex-row items-center justify-between border-b px-3 py-2"
          style={{ backgroundColor: colors.cardAlt, borderBottomColor: colors.border }}
        >
          <View className="items-center">
            <Text className="text-xs font-black" style={{ color: colors.primary }}>
              {metrics.totalCalls}
            </Text>
            <Text className="text-[9px]" style={{ color: colors.textMuted }}>Total Calls</Text>
          </View>
          <View className="h-5 w-[1px]" style={{ backgroundColor: colors.border }} />
          <View className="items-center">
            <Text className="text-xs font-black" style={{ color: colors.warning }}>
              {metrics.fieldVisitsCount}
            </Text>
            <Text className="text-[9px]" style={{ color: colors.textMuted }}>Field Visits</Text>
          </View>
          <View className="h-5 w-[1px]" style={{ backgroundColor: colors.border }} />
          <View className="items-center">
            <Text className="text-xs font-black" style={{ color: colors.success }}>
              {metrics.positiveOutcomesCount}
            </Text>
            <Text className="text-[9px]" style={{ color: colors.textMuted }}>Hot / Won</Text>
          </View>
          <View className="h-5 w-[1px]" style={{ backgroundColor: colors.border }} />
          <View className="items-center">
            <Text className="text-xs font-black" style={{ color: colors.copilot }}>
              ₹ {(metrics.totalDealPotential / 1000).toFixed(0)}k
            </Text>
            <Text className="text-[9px]" style={{ color: colors.textMuted }}>Potential</Text>
          </View>
        </View>
      )}

      {/* Main List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            Loading Activity Records...
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl mb-2.5"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <Ionicons name="call" size={24} color={colors.primary} />
          </View>
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            No Activity Records Found
          </Text>
          <Text className="mt-1 text-center text-xs" style={{ color: colors.textMuted }}>
            You haven't recorded any client calls or field visits for this timeframe.
          </Text>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="mt-3.5 rounded-xl px-3.5 py-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-bold text-white">Log First Activity</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRecords();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const typeConfig = CALL_TYPES.find((t) => t.value === item.callType) || CALL_TYPES[0];
            const outcomeConfig = OUTCOMES.find((o) => o.value === item.outcome) || OUTCOMES[2];

            return (
              <View
                className="rounded-2xl border p-3 shadow-sm"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{ backgroundColor: `${typeConfig.color}20` }}
                      className="h-7 w-7 items-center justify-center rounded-xl"
                    >
                      <Ionicons name={typeConfig.icon} size={15} color={typeConfig.color} />
                    </View>
                    <View>
                      <Text className="text-xs font-bold" style={{ color: colors.text }}>
                        {item.clientName}
                      </Text>
                      {item.contactPerson ? (
                        <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                          {item.contactPerson}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-1.5">
                    {item.phone ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleCall(item.phone)}
                          className="h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.callSoft }}
                        >
                          <Ionicons name="call" size={13} color={colors.call} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleWhatsApp(item.phone, item.clientName)}
                          className="h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.whatsappSoft }}
                        >
                          <Ionicons name="logo-whatsapp" size={13} color={colors.whatsapp} />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Conversation Summary */}
                <View
                  className="mt-2 rounded-xl border p-2"
                  style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                >
                  <Text className="text-[10px] font-bold mb-0.5" style={{ color: colors.primary }}>
                    {item.callPurpose || 'Sales Discussion'}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={3}>
                    {item.description}
                  </Text>
                </View>

                {/* Footer Badges */}
                <View className="mt-2 flex-row items-center justify-between pt-0.5">
                  <View
                    style={{ backgroundColor: `${outcomeConfig.color}15`, borderColor: `${outcomeConfig.color}40` }}
                    className="rounded-lg border px-2 py-0.5"
                  >
                    <Text style={{ color: outcomeConfig.color }} className="text-[10px] font-bold">
                      {outcomeConfig.label}
                    </Text>
                  </View>

                  {item.dealValue > 0 ? (
                    <Text className="text-xs font-black" style={{ color: colors.whatsapp }}>
                      ₹ {Number(item.dealValue).toLocaleString('en-IN')}
                    </Text>
                  ) : null}

                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
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
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <View
            className="max-h-[90%] rounded-t-3xl border-t p-4"
            style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
          >
            <View
              className="flex-row items-center justify-between pb-2.5 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="call" size={16} color={colors.primary} />
                <Text className="text-sm font-black" style={{ color: colors.text }}>
                  Log Sales Activity
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-2.5 space-y-2.5" showsVerticalScrollIndicator={false}>
              {/* Client Name */}
              <View>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Client / Company Name *
                </Text>
                <TextInput
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="e.g. Apex Tech Solutions"
                  placeholderTextColor={colors.inputPlaceholder}
                  className="rounded-xl border px-3 py-2 text-xs"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Contact Person & Phone */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                    Contact Person
                  </Text>
                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                    Phone Number
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>

              {/* Interaction Type */}
              <View>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Interaction Type
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {CALL_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setCallType(t.value)}
                      className="rounded-xl border px-2.5 py-1.5 flex-row items-center gap-1.5"
                      style={{
                        backgroundColor: callType === t.value ? colors.primary : colors.cardAlt,
                        borderColor: callType === t.value ? colors.primary : colors.border,
                      }}
                    >
                      <Ionicons
                        name={t.icon}
                        size={13}
                        color={callType === t.value ? '#ffffff' : t.color}
                      />
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: callType === t.value ? '#ffffff' : colors.text,
                        }}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Discussion Notes */}
              <View>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Key Discussion Points *
                </Text>
                <TextInput
                  value={conversation}
                  onChangeText={setConversation}
                  multiline
                  numberOfLines={3}
                  placeholder="Summary of requirements discussed, pricing quoted, client objections..."
                  placeholderTextColor={colors.inputPlaceholder}
                  className="min-h-[70px] rounded-xl border p-2.5 text-xs"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Outcome */}
              <View>
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Outcome / Result
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {OUTCOMES.map((o) => (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => setOutcome(o.value)}
                      className="rounded-xl border px-2.5 py-1.5"
                      style={{
                        backgroundColor: outcome === o.value ? colors.primary : colors.cardAlt,
                        borderColor: outcome === o.value ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: outcome === o.value ? '#ffffff' : colors.text,
                        }}
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
                  <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                    Deal Potential (₹)
                  </Text>
                  <TextInput
                    value={dealValue}
                    onChangeText={setDealValue}
                    placeholder="e.g. 50000"
                    keyboardType="numeric"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                    Location / Area
                  </Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Noida Sector 62"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreateDcr}
                disabled={submitting}
                className="mt-2 mb-6 items-center justify-center rounded-xl py-3 shadow-md"
                style={{
                  backgroundColor: colors.primary,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-xs font-bold text-white">Save Activity Record</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
