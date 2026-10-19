import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import IosAlertModal from '~/components/IosAlertModal';
import { createDcrRecord, deleteDcrRecord, getDcrRecords, updateDcrRecord } from '~/services/crm';
import { uploadImageToSupabase } from '~/services/supabaseStorage';
import { useCrmTheme } from '../utils/colors';

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
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

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

  // Field Photos / Attachments State
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

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

  const handlePickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'Camera Permission Required',
            'Please grant camera permission to capture field visit photos.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                style: 'default',
                onPress: () => Linking.openSettings().catch(() => { }),
              },
            ],
            { icon: 'camera', iconColor: '#3b82f6' }
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setSelectedImages((prev) => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              uri: asset.uri,
              name: asset.fileName || `visit_photo_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
            },
          ]);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'Gallery Permission Required',
            'Please grant photo library permission to choose attachments.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                style: 'default',
                onPress: () => Linking.openSettings().catch(() => { }),
              },
            ],
            { icon: 'images', iconColor: '#3b82f6' }
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newItems = result.assets.map((asset, idx) => ({
            id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            uri: asset.uri,
            name: asset.fileName || `attachment_${Date.now()}_${idx}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
          }));
          setSelectedImages((prev) => [...prev, ...newItems]);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showAlert(
        'Photo Selection Error',
        err.message || 'Could not access camera / gallery.',
        [{ text: 'OK' }],
        { icon: 'alert-circle', iconColor: '#ef4444' }
      );
    }
  };

  const handleRemoveImage = (id) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
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
              onPress: () => Linking.openSettings().catch(() => { }),
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
      Linking.openURL(url).catch(() => { });
    } else if (location.trim()) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
      Linking.openURL(url).catch(() => { });
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

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setClientName('');
    setContactPerson('');
    setPhone('');
    setCallType('PHONE_CALL');
    setCallPurpose('Product Demo & Sales Pitch');
    setConversation('');
    setOutcome('FOLLOWUP_SCHEDULED');
    setNextAction('Send WhatsApp quote and follow up');
    setDealValue('');
    setLocation('');
    setGpsCoords(null);
    setSelectedImages([]);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    if (!record) return;
    setEditingRecord(record);
    setClientName(record.clientName || '');
    setContactPerson(record.contactPerson || '');
    setPhone(record.phone || '');
    setCallType(record.callType || 'PHONE_CALL');
    setCallPurpose(record.callPurpose || 'Product Demo & Sales Pitch');
    setConversation(record.description || '');
    setOutcome(record.outcome || 'FOLLOWUP_SCHEDULED');
    setNextAction(record.nextFollowUpAction || '');
    setDealValue(record.dealValue ? String(record.dealValue) : '');
    setLocation(record.location || '');
    const coords =
      record.rawMetadata?.geolocation ||
      (record.latitude && record.longitude
        ? {
          latitude: record.latitude,
          longitude: record.longitude,
          accuracy: 10,
        }
        : null);
    setGpsCoords(coords);

    const rawImgs = Array.isArray(record.images)
      ? record.images
      : record.rawMetadata?.images || [];
    const mappedImgs = rawImgs.map((uri, idx) => ({
      id: `existing_${idx}_${Date.now()}`,
      uri,
      name: `Photo_${idx + 1}.jpg`,
      isExisting: true,
    }));
    setSelectedImages(mappedImgs);

    setIsDetailModalVisible(false);
    setIsModalVisible(true);
  };

  const handleOpenDetail = (record) => {
    setDetailRecord(record);
    setIsDetailModalVisible(true);
  };

  const handleDeleteDcr = (dcrId) => {
    if (!dcrId) return;
    showAlert(
      'Delete Activity Record?',
      'Are you sure you want to permanently delete this DCR record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await deleteDcrRecord(dcrId);
              if (res.success) {
                setIsDetailModalVisible(false);
                setDetailRecord(null);
                loadRecords();
                showAlert(
                  'Record Deleted',
                  'The activity record was deleted successfully.',
                  [{ text: 'OK', style: 'default' }],
                  { icon: 'trash', iconColor: '#ef4444' }
                );
              } else {
                showAlert('Error', res.error || 'Failed to delete record', [{ text: 'OK' }], {
                  icon: 'close-circle',
                  iconColor: '#ef4444',
                });
              }
            } catch (err) {
              showAlert('Error', err.message || 'Failed to delete record', [{ text: 'OK' }], {
                icon: 'close-circle',
                iconColor: '#ef4444',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { icon: 'trash', iconColor: '#ef4444' }
    );
  };

  const handleSaveDcr = async () => {
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

      // Separate existing URLs from new local images to upload
      const existingUrls = selectedImages
        .filter((img) => img.isExisting || img.uri?.startsWith('http'))
        .map((img) => img.uri);

      const newPhotosToUpload = selectedImages.filter(
        (img) => !img.isExisting && !img.uri?.startsWith('http')
      );

      const uploadedUrls = [];
      if (newPhotosToUpload.length > 0) {
        for (let i = 0; i < newPhotosToUpload.length; i++) {
          const img = newPhotosToUpload[i];
          setUploadProgressText(`Uploading photo ${i + 1}/${newPhotosToUpload.length}...`);
          try {
            const uploadRes = await uploadImageToSupabase({
              uri: img.uri,
              name: img.name,
              mimeType: img.mimeType,
              folder: 'dcr',
            });
            if (uploadRes?.publicUrl) {
              uploadedUrls.push(uploadRes.publicUrl);
            }
          } catch (uploadErr) {
            console.warn('Image upload error:', uploadErr);
          }
        }
      }

      setUploadProgressText('');
      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      const payload = {
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
        geolocation: gpsCoords
          ? {
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
            accuracy: gpsCoords.accuracy || 10,
            capturedAt: new Date().toISOString(),
          }
          : undefined,
        images: finalImageUrls,
      };

      if (editingRecord) {
        const res = await updateDcrRecord(editingRecord.id, payload);
        if (res.success) {
          setIsModalVisible(false);
          setEditingRecord(null);
          if (detailRecord?.id === editingRecord.id) {
            setDetailRecord((prev) => ({
              ...prev,
              ...payload,
              description: payload.conversation,
              images: finalImageUrls,
            }));
          }
          loadRecords();
          showAlert(
            'Record Updated',
            'Daily Call Record updated successfully!',
            [{ text: 'Done', style: 'default' }],
            { icon: 'checkmark-circle', iconColor: '#10b981' }
          );
        } else {
          showAlert(
            'Update Failed',
            res.error || 'Failed to update DCR record',
            [{ text: 'OK', style: 'default' }],
            { icon: 'close-circle', iconColor: '#ef4444' }
          );
        }
      } else {
        const res = await createDcrRecord(payload);
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
          setSelectedImages([]);
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
          onPress={handleOpenCreate}
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
            onPress={handleOpenCreate}
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
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleOpenDetail(item)}
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
                    {/* Quick Edit Button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleOpenEdit(item);
                      }}
                      hitSlop={6}
                      className="h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: colors.primarySoft }}
                    >
                      <Ionicons name="pencil" size={12} color={colors.primary} />
                    </TouchableOpacity>

                    {item.phone ? (
                      <>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleCall(item.phone);
                          }}
                          className="h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.callSoft }}
                        >
                          <Ionicons name="call" size={13} color={colors.call} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleWhatsApp(item.phone, item.clientName);
                          }}
                          className="h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: colors.whatsappSoft }}
                        >
                          <Ionicons name="logo-whatsapp" size={13} color={colors.whatsapp} />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Conversation Summary with View Details Prompt */}
                <View
                  className="mt-2 rounded-xl border p-2"
                  style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                >
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                      {item.callPurpose || 'Sales Discussion'}
                    </Text>
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                      View Full Details →
                    </Text>
                  </View>
                  <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={3}>
                    {item.description}
                  </Text>
                </View>

                {/* Attached Visit Photos Strip */}
                {Boolean(
                  (item.images && item.images.length > 0) ||
                  (item.rawMetadata?.images && item.rawMetadata.images.length > 0)
                ) && (
                    <View className="mt-2">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {(item.images || item.rawMetadata.images).map((imgUrl, imgIdx) => (
                          <TouchableOpacity
                            key={`${imgUrl}-${imgIdx}`}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              setPreviewImage(imgUrl);
                            }}
                            activeOpacity={0.8}
                            className="rounded-xl overflow-hidden border shadow-2xs"
                            style={{ borderColor: colors.border }}
                          >
                            <Image
                              source={{ uri: imgUrl }}
                              className="w-14 h-14 rounded-xl"
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

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
                        onPress={(e) => {
                          e.stopPropagation?.();
                          const q = item.latitude && item.longitude
                            ? `${item.latitude},${item.longitude}`
                            : encodeURIComponent(item.location);
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => { });
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
              </TouchableOpacity>
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
                  <Ionicons name={editingRecord ? 'create-outline' : 'document-text'} size={20} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-base font-black tracking-tight" style={{ color: colors.text }}>
                    {editingRecord ? 'Edit Activity Record' : 'Log Sales Activity'}
                  </Text>
                  <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                    {editingRecord ? 'Update meeting notes, outcome, or attachments' : 'Daily Call Record (DCR) • Visits, Calls & Notes'}
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
                    className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="e.g. Apex Tech Solutions"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-3 text-xs font-medium"
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
                      className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="person-outline" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={contactPerson}
                        onChangeText={setContactPerson}
                        placeholder="Rajesh Kumar"
                        placeholderTextColor={colors.inputPlaceholder}
                        className="flex-1 py-3 text-xs font-medium"
                        style={{ color: colors.text }}
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
                      Phone Number
                    </Text>
                    <View
                      className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="call-outline" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+91 98765..."
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.inputPlaceholder}
                        className="flex-1 py-3 text-xs font-medium"
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
                    className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
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
                      className="flex-1 py-3 text-xs font-medium"
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
                    className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
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
                      className="flex-1 py-3 text-xs font-medium"
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

              {/* Card 3: Field Photos & Attachments */}
              <View
                className="rounded-2xl border p-3.5 mb-3.5 shadow-xs"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="camera" size={14} color={colors.primary} />
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: colors.primary }}
                    >
                      Field Photos & Attachments
                    </Text>
                  </View>
                  {selectedImages.length > 0 && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.primarySoft }}
                    >
                      <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                        {selectedImages.length} {selectedImages.length === 1 ? 'Photo' : 'Photos'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Camera / Gallery Quick Action Buttons */}
                <View className="flex-row gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.75}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border shadow-xs"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="camera" size={15} color={colors.primary} />
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>
                      Take Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.75}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border shadow-xs"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="images" size={15} color={colors.primary} />
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>
                      Choose Gallery
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Image Thumbnails Strip */}
                {selectedImages.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row gap-2.5 py-1"
                  >
                    {selectedImages.map((img) => (
                      <View
                        key={img.id}
                        className="relative rounded-2xl overflow-hidden border shadow-xs"
                        style={{ borderColor: colors.border, width: 80, height: 80 }}
                      >
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setPreviewImage(img.uri)}
                          className="w-full h-full"
                        >
                          <Image
                            source={{ uri: img.uri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveImage(img.id)}
                          hitSlop={8}
                          activeOpacity={0.7}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center bg-black/75"
                        >
                          <Ionicons name="close" size={12} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View
                    className="rounded-xl border border-dashed py-3 px-3 items-center justify-center"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }}
                  >
                    <Text className="text-[11px] font-medium text-center" style={{ color: colors.textMuted }}>
                      Optional: Attach visit photos, shopfronts, visiting cards, or order drafts
                    </Text>
                  </View>
                )}
              </View>

              {/* Card 4: Discussion Notes & Next Steps */}
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
                        className="rounded-full px-2.5 py-1 border flex-row items-center gap-1 mr-1"
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
                    className="flex-row items-center rounded-xl border px-3.5 min-h-[46px]"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <Ionicons name="calendar-outline" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <TextInput
                      value={nextAction}
                      onChangeText={setNextAction}
                      placeholder="e.g. Share quote on WhatsApp & follow up on Monday"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="flex-1 py-3 text-xs font-medium"
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
                onPress={handleSaveDcr}
                disabled={submitting}
                activeOpacity={0.85}
                className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-3.5 shadow-md shadow-indigo-500/25"
                style={{
                  backgroundColor: colors.primary,
                  opacity: submitting ? 0.75 : 1,
                }}
              >
                {submitting ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text className="text-sm font-extrabold text-white tracking-wide">
                      {uploadProgressText || (editingRecord ? 'Updating Activity Record...' : 'Saving Activity Record...')}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text className="text-sm font-extrabold text-white tracking-wide">
                      {editingRecord ? 'Update Activity Record' : 'Save Activity Record'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPreviewImage(null)}
      >
        <View className="flex-1 bg-black/95 justify-between">
          <View
            className="flex-row items-center justify-between px-4 pb-3"
            style={{ paddingTop: Math.max(insets.top + 10, 44) }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="image" size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white">Attached Photo</Text>
            </View>
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center px-3">
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={{ width: '100%', height: '80%' }}
                resizeMode="contain"
              />
            )}
          </View>

          <View
            className="items-center pb-6"
            style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
          >
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              activeOpacity={0.8}
              className="px-6 py-2.5 rounded-full bg-white/20"
            >
              <Text className="text-xs font-bold text-white">Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Full Activity Details Modal */}
      <Modal
        visible={isDetailModalVisible && Boolean(detailRecord)}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)' }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsDetailModalVisible(false)}
          />

          <View
            style={{
              height: '88%',
              maxHeight: '92%',
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

            {/* Modal Header */}
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
                  <Ionicons name="clipboard" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-base font-black tracking-tight" style={{ color: colors.text }}>
                    Activity Record Details
                  </Text>
                  <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                    {detailRecord?.createdAt
                      ? new Date(detailRecord.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'Recorded Activity'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => handleOpenEdit(detailRecord)}
                  hitSlop={8}
                  className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryBorder,
                  }}
                >
                  <Ionicons name="pencil" size={13} color={colors.primary} />
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    Edit
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeleteDcr(detailRecord?.id)}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full items-center justify-center border"
                  style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                    borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fca5a5',
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setIsDetailModalVisible(false)}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full items-center justify-center border"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Body */}
            {detailRecord && (
              <ScrollView
                className="flex-1 px-4 pt-3.5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* Status & Type Banner */}
                {(() => {
                  const typeCfg =
                    CALL_TYPES.find((t) => t.value === detailRecord.callType) || CALL_TYPES[0];
                  const outcomeCfg =
                    OUTCOMES.find((o) => o.value === detailRecord.outcome) || OUTCOMES[2];
                  return (
                    <View
                      className="rounded-2xl border p-3.5 mb-3 flex-row items-center justify-between shadow-xs"
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <View
                          style={{ backgroundColor: `${typeCfg.color}20` }}
                          className="h-9 w-9 items-center justify-center rounded-xl"
                        >
                          <Ionicons name={typeCfg.icon} size={18} color={typeCfg.color} />
                        </View>
                        <View>
                          <Text className="text-xs font-black" style={{ color: colors.text }}>
                            {typeCfg.label}
                          </Text>
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                            Logged by {detailRecord.user?.displayName || 'Sales Rep'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: `${outcomeCfg.color}18`,
                          borderColor: `${outcomeCfg.color}45`,
                        }}
                        className="rounded-xl border px-3 py-1"
                      >
                        <Text style={{ color: outcomeCfg.color }} className="text-xs font-bold">
                          {outcomeCfg.label}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Client & Contact Card */}
                <View
                  className="rounded-2xl border p-3.5 mb-3 shadow-xs"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="business" size={14} color={colors.primary} />
                      <Text
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Client & Contact Info
                      </Text>
                    </View>
                    {detailRecord.dealValue > 0 && (
                      <View className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        <Text className="text-xs font-extrabold text-emerald-600">
                          ₹ {Number(detailRecord.dealValue).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-base font-extrabold" style={{ color: colors.text }}>
                    {detailRecord.clientName || 'Direct Client'}
                  </Text>

                  {detailRecord.contactPerson ? (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Ionicons name="person" size={12} color={colors.textMuted} />
                      <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        Met / Spoke with: <Text className="font-bold">{detailRecord.contactPerson}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {detailRecord.phone ? (
                    <View
                      className="mt-3 pt-2.5 border-t flex-row items-center justify-between"
                      style={{ borderTopColor: colors.border }}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="call" size={13} color={colors.primary} />
                        <Text className="text-xs font-bold" style={{ color: colors.text }}>
                          {detailRecord.phone}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => handleCall(detailRecord.phone)}
                          activeOpacity={0.75}
                          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: colors.callSoft }}
                        >
                          <Ionicons name="call" size={12} color={colors.call} />
                          <Text className="text-[11px] font-bold" style={{ color: colors.call }}>
                            Call
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleWhatsApp(
                              detailRecord.phone,
                              detailRecord.clientName || detailRecord.contactPerson
                            )
                          }
                          activeOpacity={0.75}
                          className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: colors.whatsappSoft }}
                        >
                          <Ionicons name="logo-whatsapp" size={12} color={colors.whatsapp} />
                          <Text
                            className="text-[11px] font-bold"
                            style={{ color: colors.whatsapp }}
                          >
                            WhatsApp
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {detailRecord.email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${detailRecord.email}`).catch(() => { })}
                      className="mt-2 flex-row items-center gap-1.5"
                    >
                      <Ionicons name="mail" size={12} color={colors.textMuted} />
                      <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                        {detailRecord.email}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Discussion Notes Card (Full Uncut Text) */}
                <View
                  className="rounded-2xl border p-3.5 mb-3 shadow-xs"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Ionicons name="chatbubbles" size={14} color={colors.primary} />
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: colors.primary }}
                    >
                      Meeting & Discussion Notes
                    </Text>
                  </View>

                  <View
                    className="rounded-xl px-2.5 py-1.5 mb-2.5 border"
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                      Purpose: {detailRecord.callPurpose || 'General Sales Inquiry'}
                    </Text>
                  </View>

                  <Text
                    selectable
                    className="text-xs leading-relaxed"
                    style={{ color: colors.textSecondary }}
                  >
                    {detailRecord.description || 'No discussion notes logged.'}
                  </Text>

                  {detailRecord.objections ? (
                    <View
                      className="mt-3 pt-2.5 border-t"
                      style={{ borderTopColor: colors.border }}
                    >
                      <View className="flex-row items-center gap-1 text-amber-600 mb-0.5">
                        <Ionicons name="alert-circle" size={13} color="#d97706" />
                        <Text className="text-[11px] font-bold text-amber-600">
                          Objection / Client Feedback:
                        </Text>
                      </View>
                      <Text className="text-xs text-amber-700 dark:text-amber-300">
                        {detailRecord.objections}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Next Steps & Follow-Up Card */}
                {(detailRecord.nextFollowUpAction || detailRecord.nextFollowUpDate) && (
                  <View
                    className="rounded-2xl border p-3.5 mb-3 shadow-xs"
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Ionicons name="calendar" size={14} color={colors.primary} />
                      <Text
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Agreed Next Follow-Up
                      </Text>
                    </View>

                    {detailRecord.nextFollowUpAction ? (
                      <View className="flex-row items-start gap-2 mb-2">
                        <Ionicons
                          name="arrow-forward-circle"
                          size={15}
                          color={colors.primary}
                          className="mt-0.5"
                        />
                        <Text className="text-xs font-semibold flex-1" style={{ color: colors.text }}>
                          {detailRecord.nextFollowUpAction}
                        </Text>
                      </View>
                    ) : null}

                    {detailRecord.nextFollowUpDate ? (
                      <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Ionicons name="alarm" size={13} color="#d97706" />
                        <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          Scheduled for:{' '}
                          {new Date(detailRecord.nextFollowUpDate).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Location & GPS Check-In Card */}
                {(detailRecord.location ||
                  detailRecord.latitude ||
                  detailRecord.rawMetadata?.geolocation) && (
                    <View
                      className="rounded-2xl border p-3.5 mb-3 shadow-xs"
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="location" size={14} color={colors.primary} />
                          <Text
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: colors.primary }}
                          >
                            Field Visit Location & GPS
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const lat =
                              detailRecord.latitude ||
                              detailRecord.rawMetadata?.geolocation?.latitude;
                            const lng =
                              detailRecord.longitude ||
                              detailRecord.rawMetadata?.geolocation?.longitude;
                            const q =
                              lat && lng
                                ? `${lat},${lng}`
                                : encodeURIComponent(detailRecord.location || '');
                            Linking.openURL(
                              `https://www.google.com/maps/search/?api=1&query=${q}`
                            ).catch(() => { });
                          }}
                          activeOpacity={0.75}
                          className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30"
                        >
                          <Ionicons name="navigate" size={11} color="#059669" />
                          <Text className="text-[10px] font-bold text-emerald-600">Open Maps</Text>
                        </TouchableOpacity>
                      </View>

                      {detailRecord.location ? (
                        <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                          {detailRecord.location}
                        </Text>
                      ) : null}

                      {Boolean(
                        detailRecord.latitude || detailRecord.rawMetadata?.geolocation
                      ) && (
                          <View className="flex-row items-center gap-1 mt-1">
                            <Ionicons name="radio" size={11} color={colors.primary} />
                            <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                              GPS:{' '}
                              {(
                                detailRecord.latitude ||
                                detailRecord.rawMetadata?.geolocation?.latitude
                              )?.toFixed(5)}
                              ,{' '}
                              {(
                                detailRecord.longitude ||
                                detailRecord.rawMetadata?.geolocation?.longitude
                              )?.toFixed(5)}{' '}
                              (±
                              {detailRecord.rawMetadata?.geolocation?.accuracy || 10}m)
                            </Text>
                          </View>
                        )}
                    </View>
                  )}

                {/* Attached Field Photos */}
                {Boolean(
                  (detailRecord.images && detailRecord.images.length > 0) ||
                  (detailRecord.rawMetadata?.images &&
                    detailRecord.rawMetadata.images.length > 0)
                ) && (
                    <View
                      className="rounded-2xl border p-3.5 mb-3 shadow-xs"
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-2.5">
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="images" size={14} color={colors.primary} />
                          <Text
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: colors.primary }}
                          >
                            Attached Field Photos (
                            {
                              (
                                detailRecord.images ||
                                detailRecord.rawMetadata.images
                              ).length
                            }
                            )
                          </Text>
                        </View>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row gap-2.5 py-1"
                      >
                        {(
                          detailRecord.images || detailRecord.rawMetadata.images
                        ).map((imgUrl, imgIdx) => (
                          <TouchableOpacity
                            key={`detail_img_${imgIdx}`}
                            onPress={() => setPreviewImage(imgUrl)}
                            activeOpacity={0.85}
                            className="rounded-xl overflow-hidden border shadow-xs"
                            style={{ borderColor: colors.border, width: 90, height: 90 }}
                          >
                            <Image
                              source={{ uri: imgUrl }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
              </ScrollView>
            )}

            {/* Bottom Actions */}
            <View
              className="px-4 py-3 border-t flex-row items-center gap-2.5"
              style={{
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <TouchableOpacity
                onPress={() => handleOpenEdit(detailRecord)}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 shadow-md"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="pencil" size={16} color="#ffffff" />
                <Text className="text-xs font-black text-white tracking-wide">
                  Edit Activity Record
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDetailModalVisible(false)}
                activeOpacity={0.85}
                className="px-5 py-3 rounded-2xl border"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
