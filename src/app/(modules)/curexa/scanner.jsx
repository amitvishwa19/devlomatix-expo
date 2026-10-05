import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaScannerScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { patients, medicines, labOrders, viewPatientDetails } = useCurexa();

  const [scanMode, setScanMode] = useState('WRISTBAND'); // WRISTBAND | MEDICINE | SPECIMEN
  const [scanningActive, setScanningActive] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrPatient, setSelectedQrPatient] = useState(null);

  const simulateScan = (itemType, itemData) => {
    setScanningActive(true);
    setTimeout(() => {
      setScanningActive(false);
      setLastScannedResult({ type: itemType, data: itemData, timestamp: new Date().toLocaleTimeString() });

      if (itemType === 'PATIENT') {
        Alert.alert(
          'Patient Wristband Scanned',
          `Verified Identity: ${itemData.displayName} (${itemData.sku})\nWard: ${itemData.ward}\nAllergies: ${(itemData.allergies || []).join(', ')}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Full EMR 360', onPress: () => viewPatientDetails(itemData) },
          ]
        );
      } else if (itemType === 'MEDICINE') {
        Alert.alert(
          'Medicine Barcode Verified',
          `Item: ${itemData.name}\nBatch: ${itemData.batch}\nStock Available: ${itemData.stock}\nExpiry: ${itemData.expiry}`,
          [
            { text: 'Close', style: 'cancel' },
            { text: 'Dispense 1 Unit', onPress: () => Alert.alert('Dispensed', `1 unit of ${itemData.name} dispensed. Stock updated.`) },
          ]
        );
      } else if (itemType === 'SPECIMEN') {
        Alert.alert(
          'Specimen Tube Scanned',
          `Order: ${itemData.orderNumber}\nPatient: ${itemData.patientName}\nTests: ${itemData.tests.join(', ')}\nStatus: IN_PROCESSING`,
          [{ text: 'OK' }]
        );
      }
    }, 1200);
  };

  return (
    <AppScreen>
      <CurexaHeader title="Hospital Barcode & QR Scanner" subtitle="Bedside EMR & Barcode Dispensing" />

      {/* Mode Selector */}
      <View className="px-3 pt-2">
        <View className={`flex-row rounded-[14px] p-1 ${palette.surface}`}>
          {[
            { key: 'WRISTBAND', label: 'Patient Wristband', icon: 'qr-code-outline' },
            { key: 'MEDICINE', label: 'Medicine Barcode', icon: 'barcode-outline' },
            { key: 'SPECIMEN', label: 'Lab Specimen', icon: 'flask-outline' },
          ].map((mode) => (
            <Pressable
              key={mode.key}
              onPress={() => {
                setScanMode(mode.key);
                setLastScannedResult(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-[10px] py-2 ${
                scanMode === mode.key ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name={mode.icon}
                size={14}
                color={scanMode === mode.key ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`text-[11px] font-bold ${
                  scanMode === mode.key ? 'text-white' : palette.textMuted
                }`}
              >
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-3 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* Live Camera Viewfinder Card */}
        <View className={`rounded-[20px] p-4 items-center justify-center relative shadow-lg bg-slate-950 mb-3`}>
          {/* Laser Scanner Line Animation */}
          <View className="h-44 w-full rounded-[16px] border border-dashed border-emerald-500/60 items-center justify-center relative bg-emerald-950/20 overflow-hidden">
            <View className="items-center">
              <Ionicons
                name={
                  scanMode === 'WRISTBAND'
                    ? 'qr-code'
                    : scanMode === 'MEDICINE'
                    ? 'barcode'
                    : 'flask'
                }
                size={44}
                color="#10b981"
              />
              <Text className="text-white text-[12px] font-bold mt-2">
                {scanningActive ? 'Processing Scan...' : 'Align Target in Frame'}
              </Text>
              <Text className="text-emerald-400 text-[10px] mt-0.5">
                {scanMode === 'WRISTBAND'
                  ? 'Scan Bedside Patient Wristband'
                  : scanMode === 'MEDICINE'
                  ? 'Scan Medicine Pack Barcode'
                  : 'Scan Blood Specimen Tube Barcode'}
              </Text>
            </View>

            {/* Glowing Scan Ray */}
            {scanningActive && (
              <View className="absolute inset-x-0 top-1/2 h-1 bg-emerald-400 shadow-md animate-pulse" />
            )}
          </View>
        </View>

        {/* Quick Test Barcode Simulator Matrix */}
        <View className={`rounded-[16px] p-3 shadow-sm mb-3 ${palette.surface}`}>
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Simulate Bedside Scan Targets ({scanMode})
          </Text>

          {scanMode === 'WRISTBAND' && (
            <View className="gap-2">
              {patients.slice(0, 3).map((p) => (
                <View
                  key={p.id}
                  className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Ionicons name="qr-code" size={16} color="#059669" />
                    </View>
                    <View>
                      <Text className={`text-[12px] font-bold ${palette.text}`}>
                        {p.displayName || p.name}
                      </Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {p.sku} • {p.ward}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedQrPatient(p);
                        setShowQrModal(true);
                      }}
                      className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-1"
                    >
                      <Text className={`text-[10px] font-semibold ${palette.text}`}>View QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => simulateScan('PATIENT', p)}
                      className="rounded bg-emerald-600 px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-bold text-white">Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {scanMode === 'MEDICINE' && (
            <View className="gap-2">
              {medicines.slice(0, 3).map((m) => (
                <View
                  key={m.id}
                  className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
                      <Ionicons name="barcode" size={16} color="#0d9488" />
                    </View>
                    <View>
                      <Text className={`text-[12px] font-bold ${palette.text}`}>{m.name}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        Batch: {m.batch} • Stock: {m.stock}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => simulateScan('MEDICINE', m)}
                    className="rounded bg-emerald-600 px-3 py-1"
                  >
                    <Text className="text-[10px] font-bold text-white">Scan Barcode</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {scanMode === 'SPECIMEN' && (
            <View className="gap-2">
              {labOrders.slice(0, 3).map((ord) => (
                <View
                  key={ord.id}
                  className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                      <Ionicons name="flask" size={16} color="#06b6d4" />
                    </View>
                    <View>
                      <Text className={`text-[12px] font-bold ${palette.text}`}>{ord.orderNumber}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {ord.patientName} • {ord.tests[0]}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => simulateScan('SPECIMEN', ord)}
                    className="rounded bg-cyan-600 px-3 py-1"
                  >
                    <Text className="text-[10px] font-bold text-white">Track Specimen</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Last Scanned Audit Card */}
        {lastScannedResult && (
          <View className={`rounded-[16px] p-3 shadow-sm border border-emerald-500/30 ${palette.surface}`}>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                LAST SCANNED TARGET
              </Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>{lastScannedResult.timestamp}</Text>
            </View>
            <Text className={`text-[13px] font-bold ${palette.text}`}>
              {lastScannedResult.data.displayName ||
                lastScannedResult.data.name ||
                lastScannedResult.data.orderNumber}
            </Text>
            <Text className={`text-[11px] mt-0.5 ${palette.textMuted}`}>
              Verification success • Stored in digital audit trail
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Patient QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 p-4">
          <View className={`w-full max-w-sm rounded-[24px] p-5 items-center ${palette.surface}`}>
            <Text className={`text-[16px] font-bold mb-1 ${palette.text}`}>
              Patient Bedside Wristband QR
            </Text>
            <Text className={`text-[11px] text-center mb-4 ${palette.textMuted}`}>
              {selectedQrPatient?.displayName} ({selectedQrPatient?.sku})
            </Text>

            {/* Generated Mock QR Block */}
            <View className="h-44 w-44 rounded-[16px] bg-white p-3 items-center justify-center border-2 border-emerald-500 shadow-md mb-4">
              <Ionicons name="qr-code" size={130} color="#0f172a" />
            </View>

            <Text className="text-[11px] font-bold text-emerald-600 mb-4">
              Ward: {selectedQrPatient?.ward || 'General'} • Bed: {selectedQrPatient?.bed || '302'}
            </Text>

            <TouchableOpacity
              onPress={() => setShowQrModal(false)}
              className="w-full rounded-[14px] bg-emerald-600 py-3 items-center"
            >
              <Text className="text-[13px] font-bold text-white">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
