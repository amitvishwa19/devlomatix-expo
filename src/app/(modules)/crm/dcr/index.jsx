import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';
import { getDcrRecords, createDcrRecord } from '~/services/crm';
import * as Location from 'expo-location';
import IosAlertModal from '~/components/IosAlertModal';

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

const QUICK_DCR_TAGS = [
  'Pricing Quoted',
  'Decision Maker Met',
  'Demo Given',
  'Budget Approved',
  'Callback Requested',
  'Follow-up Next Week',
  'Objection: Price',
  'Contract Sent',
];

export default function DcrScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // iOS-style Alert state
  const [iosAlert, setIosAlert] = useState({
    visible: false,
    title: '',
    message: '',
    icon: null,
    iconColor: null,
    buttons: [],
  });

  const showAlert = (title, message, buttons = null, options = {}) => {
    setIosAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
      icon: options.icon || null,
      iconColor: options.iconColor || null,
    });
  };

  const closeAlert = () => {
    setIosAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleAddQuickTag = (tag) => {
    setConversation((prev) => {
      const line = `• ${tag}`;
      return prev ? `${prev}\n${line}` : line;
    });
  };

  const handleGetLocation = async () => {
    try {
      setIsFetchingLocation(true);
      // 1. Request foreground permission
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        showAlert(
          'Location Permission Required',
          'Please allow location access to tag your field visit / call location with GPS.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              style: 'default',
              onPress: () => Linking.openSettings().catch(() => {}),
            },
          ],
          { icon: 'location', iconColor: '#3b82f6' }
        );
        return;
      }

      // 2. Check if device location service is enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        showAlert(
          'GPS Disabled',
          'Please turn on Location / GPS on your device to fetch coordinates.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              style: 'default',
              onPress: () =>
                Location.enableNetworkProviderAsync?.().catch(() =>
                  Linking.openSettings()
                ),
            },
          ],
          { icon: 'navigate-circle', iconColor: '#f59e0b' }
        );
        return;
      }

      // 3. Fetch position with balanced accuracy
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!pos?.coords) {
        throw new Error('Unable to retrieve GPS coordinates.');
      }

      const { latitude, longitude, accuracy } = pos.coords;
      setGpsCoords({ latitude, longitude, accuracy: Math.round(accuracy || 0) });

      // 4. Reverse geocode to street / area / city name
      let formatted = '';
      try {
        const reverseResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseResults && reverseResults.length > 0) {
          const r = reverseResults[0];
          const parts = [
            r.name || r.street,
            r.district || r.subregion,
            r.city,
            r.postalCode,
          ].filter(Boolean);

          const uniqueParts = parts.filter((item, idx) => parts.indexOf(item) === idx);
          formatted = uniqueParts.join(', ');
        }
      } catch (geoErr) {
        console.warn('Reverse geocode error:', geoErr?.message);
      }

      if (!formatted) {
        formatted = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      }

      setLocation(formatted);
    } catch (err) {
      console.warn('Failed to get location:', err);
      showAlert(
        'GPS Error',
        err.message || 'Could not fetch current location.',
        [{ text: 'OK', style: 'default' }],
        { icon: 'alert-circle', iconColor: '#ef4444' }
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleOpenMap = () => {
    if (gpsCoords?.latitude && gpsCoords?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${gpsCoords.latitude},${gpsCoords.longitude}`;
      Linking.openURL(url).catch(() => {});
    } else if (location.trim()) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
      Linking.openURL(url).catch(() => {});
    }
  };

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
      showAlert(
        'Required Field',
        'Please enter Client Name or Contact Person before saving.',
        [{ text: 'OK', style: 'default' }],
        { icon: 'alert-circle', iconColor: '#f59e0b' }
      );
      return;
    }
    if (!conversation.trim()) {
      showAlert(
        'Required Field',
        'Please enter conversation notes summarizing your discussion.',
        [{ text: 'OK', style: 'default' }],
        { icon: 'alert-circle', iconColor: '#f59e0b' }
      );
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
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      });

      if (res.success) {
        setIsModalVisible(false);
        // Reset form
        setClientName('');
        setContactPerson('');
        setPhone('');
        setConversation('');
        setDealValue('');
        setLocation('');
        setGpsCoords(null);
        loadRecords();

        showAlert(
          'Record Logged',
          'Daily Call Record logged successfully!',
          [{ text: 'Done', style: 'default' }],
          { icon: 'checkmark-circle', iconColor: '#10b981' }
        );
      } else {
        showAlert(
          'Error',
          res.error || 'Failed to create DCR record',
          [{ text: 'OK', style: 'default' }],
          { icon: 'close-circle', iconColor: '#ef4444' }
        );
      }
    } catch (err) {
      showAlert(
        'Error',
        err.message || 'Failed to submit call record',
        [{ text: 'OK', style: 'default' }],
        { icon: 'close-circle', iconColor: '#ef4444' }
      );
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
              Daily Call Records (DCR)
            </Text>
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              Daily Calls, Visits & Field Activity
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
          contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom + 80, 100), gap: 8 }}
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
                  <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                    <View
                      style={{ backgroundColor: `${outcomeConfig.color}15`, borderColor: `${outcomeConfig.color}40` }}
                      className="rounded-lg border px-2 py-0.5"
                    >
                      <Text style={{ color: outcomeConfig.color }} className="text-[10px] font-bold">
                        {outcomeConfig.label}
                      </Text>
                    </View>

                    {item.location ? (
                      <TouchableOpacity
                        onPress={() => {
                          const q = item.latitude && item.longitude
                            ? `${item.latitude},${item.longitude}`
                            : encodeURIComponent(item.location);
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
                        }}
                        className="flex-row items-center gap-1 rounded-lg px-2 py-0.5 border"
                        style={{
                          backgroundColor: colors.cardAlt,
                          borderColor: colors.border,
                          maxWidth: 160,
                        }}
                      >
                        <Ionicons name="location-outline" size={10} color={colors.primary} />
                        <Text className="text-[10px] font-semibold" style={{ color: colors.textSecondary }} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View className="flex-row items-center gap-2">
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
              </View>
            );
          }}
        />
      )}

      {/* Log Call Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(2, 6, 23, 0.7)' }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsModalVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{
              height: '92%',
              maxHeight: '94%',
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {/* Grab Bar Handle */}
            <View className="items-center pt-2.5 pb-1">
              <View
                style={{
                  width: 44,
                  height: 4.5,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#475569' : '#cbd5e1',
                }}
              />
            </View>

            {/* Header */}
            <View
              className="flex-row items-center justify-between px-4 py-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-10 h-10 rounded-2xl items-center justify-center border shadow-xs"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryBorder,
                  }}
                >
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-base font-black tracking-tight" style={{ color: colors.text }}>
                    Log Sales Activity
                  </Text>
                  <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                    Daily Call Record (DCR) • Visits, Calls & Notes
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                hitSlop={12}
                className="w-8 h-8 rounded-full items-center justify-center border"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              className="flex-1 px-4 pt-3.5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom: 20,
              }}
            >
              {/* Card 1: Client & Contact */}
              <View
                className="rounded-2xl border p-3.5 mb-3.5 shadow-xs"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Ionicons name="business" size={14} color={colors.primary} />
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: colors.primary }}
                  >
                    Client & Contact Details
                  </Text>
                </View>

                {/* Client Name */}
                <View className="mb-2.5">
                  <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                    Client / Company Name <Text style={{ color: colors.danger }}>*</Text>
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl border px-3"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="e.g. Apex Tech Solutions"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-2.5 text-xs font-medium"
                      style={{ color: colors.text }}
                    />
                  </View>
                </View>

                {/* Contact Person & Phone */}
                <View className="flex-row gap-2.5">
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                      Contact Person
                    </Text>
                    <View
                      className="flex-row items-center rounded-xl border px-3"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="person-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={contactPerson}
                        onChangeText={setContactPerson}
                        placeholder="Rajesh Kumar"
                        placeholderTextColor={colors.inputPlaceholder}
                        className="flex-1 py-2.5 text-xs font-medium"
                        style={{ color: colors.text }}
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                      Phone Number
                    </Text>
                    <View
                      className="flex-row items-center rounded-xl border px-3"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="call-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+91 98765..."
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.inputPlaceholder}
                        className="flex-1 py-2.5 text-xs font-medium"
                        style={{ color: colors.text }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Activity Type & Outcome */}
              <View
                className="rounded-2xl border p-3.5 mb-3.5 shadow-xs"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Ionicons name="flash" size={14} color={colors.warning} />
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: colors.warning }}
                  >
                    Interaction Type & Status
                  </Text>
                </View>

                {/* Interaction Type Grid */}
                <Text className="text-[11px] font-bold mb-1.5" style={{ color: colors.text }}>
                  Interaction Type
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {CALL_TYPES.map((t) => {
                    const isSelected = callType === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        onPress={() => setCallType(t.value)}
                        activeOpacity={0.75}
                        className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border shadow-xs"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <Ionicons
                          name={t.icon}
                          size={14}
                          color={isSelected ? '#ffffff' : t.color}
                        />
                        <Text
                          className="text-xs font-bold"
                          style={{ color: isSelected ? '#ffffff' : colors.text }}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Deal Potential (₹) */}
                <View className="mb-3">
                  <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                    Deal Potential (₹)
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl border px-3"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <Text className="text-xs font-black mr-1.5" style={{ color: colors.primary }}>₹</Text>
                    <TextInput
                      value={dealValue}
                      onChangeText={setDealValue}
                      placeholder="e.g. 50,000"
                      keyboardType="numeric"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-2.5 text-xs font-medium"
                      style={{ color: colors.text }}
                    />
                  </View>
                </View>

                {/* Location / Area with GPS and Map Actions */}
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                      Location / Area
                    </Text>

                    {/* Instant GPS Fetch Button */}
                    <TouchableOpacity
                      onPress={handleGetLocation}
                      disabled={isFetchingLocation}
                      activeOpacity={0.75}
                      className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg border shadow-xs"
                      style={{
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primaryBorder,
                        opacity: isFetchingLocation ? 0.7 : 1,
                      }}
                    >
                      {isFetchingLocation ? (
                        <>
                          <ActivityIndicator size={11} color={colors.primary} />
                          <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                            Locating...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="navigate" size={11} color={colors.primary} />
                          <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                            Fetch GPS
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View
                    className="flex-row items-center rounded-xl border px-3"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: gpsCoords ? colors.primary : colors.inputBorder,
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={15}
                      color={gpsCoords ? colors.primary : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      value={location}
                      onChangeText={(val) => {
                        setLocation(val);
                        if (!val) setGpsCoords(null);
                      }}
                      placeholder="e.g. Sector 62, Noida or tap Fetch GPS..."
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-2.5 text-xs font-medium"
                      style={{ color: colors.text }}
                    />

                    {/* Open in Map Icon button */}
                    {location.trim() ? (
                      <TouchableOpacity
                        onPress={handleOpenMap}
                        hitSlop={8}
                        className="p-1 mr-1 rounded-md"
                        style={{ backgroundColor: colors.cardAlt }}
                        title="Open in Maps"
                      >
                        <Ionicons name="map-outline" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    ) : null}

                    {/* Clear Button */}
                    {location.trim() ? (
                      <TouchableOpacity
                        onPress={() => {
                          setLocation('');
                          setGpsCoords(null);
                        }}
                        hitSlop={8}
                        className="p-1"
                      >
                        <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* GPS Coordinates & Accuracy Banner */}
                  {gpsCoords ? (
                    <View
                      className="flex-row items-center justify-between mt-1.5 px-2.5 py-1.5 rounded-xl border"
                      style={{
                        backgroundColor: isDark ? 'rgba(6, 78, 59, 0.25)' : '#ecfdf5',
                        borderColor: isDark ? '#065f46' : '#a7f3d0',
                      }}
                    >
                      <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                        <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                        <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300" numberOfLines={1}>
                          GPS Locked • {gpsCoords.latitude.toFixed(4)}°, {gpsCoords.longitude.toFixed(4)}° (±{gpsCoords.accuracy}m)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleOpenMap}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 shadow-xs"
                      >
                        <Ionicons name="map" size={10} color="#ffffff" />
                        <Text className="text-[9px] font-extrabold text-white">
                          View Map
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* Outcome Status Chips */}
                <Text className="text-[11px] font-bold mb-1.5" style={{ color: colors.text }}>
                  Outcome / Result
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {OUTCOMES.map((o) => {
                    const isSelected = outcome === o.value;
                    return (
                      <TouchableOpacity
                        key={o.value}
                        onPress={() => setOutcome(o.value)}
                        activeOpacity={0.75}
                        className="px-2.5 py-1.5 rounded-xl border flex-row items-center gap-1"
                        style={{
                          backgroundColor: isSelected ? o.color : colors.card,
                          borderColor: isSelected ? o.color : colors.border,
                        }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: isSelected ? '#ffffff' : colors.text }}
                        >
                          {o.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Card 3: Discussion Notes & Next Steps */}
              <View
                className="rounded-2xl border p-3.5 mb-2 shadow-xs"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Ionicons name="chatbubbles" size={14} color={colors.copilot} />
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: colors.copilot }}
                  >
                    Discussion Notes & Action Plan
                  </Text>
                </View>

                {/* Quick Tags */}
                <View className="mb-2.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: colors.textMuted }}>
                    Quick Tags (Tap to append)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                    {QUICK_DCR_TAGS.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => handleAddQuickTag(tag)}
                        activeOpacity={0.7}
                        className="rounded-full px-2.5 py-1 border flex-row items-center gap-1"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                      >
                        <Ionicons name="add" size={11} color={colors.primary} />
                        <Text className="text-[10px] font-semibold" style={{ color: colors.text }}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Key Discussion Points Textarea */}
                <View className="mb-3">
                  <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                    Key Discussion Points <Text style={{ color: colors.danger }}>*</Text>
                  </Text>
                  <TextInput
                    value={conversation}
                    onChangeText={setConversation}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="Requirements discussed, client queries, pricing quoted, objections handled..."
                    placeholderTextColor={colors.inputPlaceholder}
                    className="min-h-[100px] rounded-xl border p-3 text-xs font-medium leading-5"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Next Action */}
                <View>
                  <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                    Next Follow-up Action
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl border px-3"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <TextInput
                      value={nextAction}
                      onChangeText={setNextAction}
                      placeholder="e.g. Share quote on WhatsApp & follow up on Monday"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-2.5 text-xs font-medium"
                      style={{ color: colors.text }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Sticky Bottom Action Footer */}
            <View
              className="px-4 py-3 border-t shadow-lg"
              style={{
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <TouchableOpacity
                onPress={handleCreateDcr}
                disabled={submitting}
                activeOpacity={0.85}
                className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-3.5 shadow-md shadow-indigo-500/25"
                style={{
                  backgroundColor: colors.primary,
                  opacity: submitting ? 0.75 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text className="text-sm font-extrabold text-white tracking-wide">
                      Save Activity Record
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* iOS Style Alert Modal */}
      <IosAlertModal
        visible={iosAlert.visible}
        onClose={closeAlert}
        title={iosAlert.title}
        message={iosAlert.message}
        icon={iosAlert.icon}
        iconColor={iosAlert.iconColor}
        buttons={iosAlert.buttons}
      />
    </AppScreen>
  );
}
