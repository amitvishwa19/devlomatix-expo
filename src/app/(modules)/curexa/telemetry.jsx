import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
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

export default function CurexaTelemetryScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { telemetryBeds, updateTelemetryBedLocally } = useCurexa();

  const [selectedBedId, setSelectedBedId] = useState('ICU-Bed 01');
  const [liveVitals, setLiveVitals] = useState({
    hr: 72,
    spo2: 98,
    bpSys: 124,
    bpDia: 82,
    resp: 16,
    temp: 98.6,
  });

  const selectedBed =
    telemetryBeds.find((b) => b.bedId === selectedBedId) || telemetryBeds[0];

  // Animated ECG sweep scan line
  const ecgScanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(ecgScanAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [ecgScanAnim]);

  // Sync selected bed
  useEffect(() => {
    if (selectedBed) {
      setLiveVitals(selectedBed.vitals);
    }
  }, [selectedBedId, selectedBed]);

  // Subtle real-time vitals fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVitals((prev) => {
        const hrDelta = Math.floor(Math.random() * 3) - 1;
        const newHr = Math.max(55, Math.min(140, prev.hr + hrDelta));
        return {
          ...prev,
          hr: newHr,
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerCodeBlue = () => {
    Alert.alert(
      '🚨 CODE BLUE INITIATED',
      `Emergency resuscitation team dispatched to ${selectedBed.bedId} (${selectedBed.wardName}).\nCrash cart #04 alerted. STAT Anesthesiology paged.`,
      [{ text: 'Acknowledge & Mute Alarm' }]
    );
  };

  const simulateVitalsAlert = () => {
    updateTelemetryBedLocally(selectedBedId, { spo2: 88, hr: 128 });
    setLiveVitals((v) => ({ ...v, spo2: 88, hr: 128 }));
    Alert.alert('⚠️ Critical Vitals Threshold', `SpO2 fell below 90% (Current: 88%) on ${selectedBedId}. Nurse call placed.`);
  };

  return (
    <AppScreen>
      <CurexaHeader title="ICU Telemetry & Vitals" subtitle="Real-time Patient Monitoring" />

      {/* Bed Selector Tabs */}
      <View className="px-3 pt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {telemetryBeds.map((bed) => {
            const isSelected = bed.bedId === selectedBedId;
            return (
              <Pressable
                key={bed.bedId}
                onPress={() => setSelectedBedId(bed.bedId)}
                className={`rounded-[14px] px-3.5 py-2 flex-row items-center gap-1.5 ${
                  isSelected ? 'bg-emerald-600' : palette.surface
                }`}
              >
                <View
                  className={`h-2.5 w-2.5 rounded-full ${
                    bed.alarm ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <Text
                  className={`text-[12px] font-bold ${
                    isSelected ? 'text-white' : palette.text
                  }`}
                >
                  {bed.bedId}
                </Text>
                {bed.alarm && (
                  <View className="rounded bg-rose-500/20 px-1">
                    <Text className="text-[9px] font-bold text-rose-300">ALERT</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-3 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* Patient Identity Header Card */}
        <View className={`rounded-[16px] p-3 shadow-sm mb-3 ${palette.surface}`}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                {selectedBed.wardName}
              </Text>
              <Text className={`text-[16px] font-bold ${palette.text}`}>
                {selectedBed.patientName}
              </Text>
              <Text className={`text-[11px] ${palette.textMuted}`}>
                {selectedBed.age}Y / {selectedBed.gender} • {selectedBed.diagnosis}
              </Text>
            </View>
            <View className="items-end">
              <View className="rounded-full bg-emerald-500/15 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-emerald-700">
                  {selectedBed.leadStatus}
                </Text>
              </View>
              <Text className={`text-[10px] mt-1 ${palette.textMuted}`}>
                Attending: {selectedBed.doctor}
              </Text>
            </View>
          </View>
        </View>

        {/* Live ECG Waveform Display */}
        <View className="rounded-[20px] bg-slate-950 p-4 border border-emerald-500/30 shadow-xl mb-3 relative overflow-hidden">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <Text className="text-[12px] font-bold text-emerald-400 tracking-wider">
                LEAD II • ECG RHYTHM
              </Text>
            </View>
            <Text className="text-[11px] font-mono text-emerald-300">25mm/s • 10mm/mV</Text>
          </View>

          {/* ECG Simulated Grid Graphic with Waveform */}
          <View className="h-24 w-full justify-center relative border-y border-emerald-900/40 my-1">
            {/* Background Grid Lines */}
            <View className="absolute inset-0 flex-row justify-between opacity-15">
              {[...Array(12)].map((_, i) => (
                <View key={i} className="h-full w-[1px] bg-emerald-400" />
              ))}
            </View>

            {/* Stylized ECG Curve Line */}
            <View className="flex-row items-center justify-around w-full">
              {[...Array(4)].map((_, i) => (
                <View key={i} className="flex-row items-end h-16 w-16 justify-center">
                  <View className="h-1 w-3 bg-emerald-400 mb-6" />
                  <View className="h-4 w-1 bg-emerald-400 mb-6" />
                  <View className="h-1 w-2 bg-emerald-400 mb-6" />
                  <View className="h-14 w-1.5 bg-emerald-400" />
                  <View className="h-6 w-1 bg-emerald-400 mb-2" />
                  <View className="h-1 w-4 bg-emerald-400 mb-6" />
                </View>
              ))}
            </View>

            {/* Glowing Sweep Line */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#34d399',
                shadowColor: '#34d399',
                shadowOpacity: 0.8,
                shadowRadius: 6,
                transform: [
                  {
                    translateX: ecgScanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 320],
                    }),
                  },
                ],
              }}
            />
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[10px] text-emerald-500 font-mono">QRS: 88ms • QTc: 412ms</Text>
            <Text className="text-[10px] text-emerald-500 font-mono">ST: +0.02mV • STABLE</Text>
          </View>
        </View>

        {/* 4 Multi-Parameter Digital Vitals Readouts */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {/* HR */}
          <View className={`w-[48%] flex-1 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold text-emerald-600">HEART RATE</Text>
              <Ionicons name="heart" size={14} color="#059669" />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text className={`text-[26px] font-black ${palette.text}`}>{liveVitals.hr}</Text>
              <Text className={`text-[11px] font-bold ${palette.textMuted}`}>BPM</Text>
            </View>
            <Text className="text-[10px] text-emerald-600 font-medium">Normal Sinus Range</Text>
          </View>

          {/* SpO2 */}
          <View className={`w-[48%] flex-1 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-[11px] font-bold ${
                  liveVitals.spo2 < 92 ? 'text-rose-600' : 'text-cyan-600'
                }`}
              >
                OXYGEN (SpO2)
              </Text>
              <Ionicons
                name="water"
                size={14}
                color={liveVitals.spo2 < 92 ? '#e11d48' : '#0891b2'}
              />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text
                className={`text-[26px] font-black ${
                  liveVitals.spo2 < 92 ? 'text-rose-600' : palette.text
                }`}
              >
                {liveVitals.spo2}%
              </Text>
            </View>
            <Text
              className={`text-[10px] font-medium ${
                liveVitals.spo2 < 92 ? 'text-rose-600' : 'text-cyan-600'
              }`}
            >
              {liveVitals.spo2 < 92 ? '⚠️ Hypoxemia Alert' : 'Ambient Air 21%'}
            </Text>
          </View>

          {/* NIBP */}
          <View className={`w-[48%] flex-1 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold text-amber-600">NIBP (BP)</Text>
              <Ionicons name="speedometer-outline" size={14} color="#d97706" />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text className={`text-[22px] font-black ${palette.text}`}>
                {liveVitals.bpSys}/{liveVitals.bpDia}
              </Text>
              <Text className={`text-[11px] font-bold ${palette.textMuted}`}>mmHg</Text>
            </View>
            <Text className={`text-[10px] ${palette.textMuted}`}>Auto Cycle: 15 min</Text>
          </View>

          {/* Temp & Resp */}
          <View className={`w-[48%] flex-1 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold text-purple-600">TEMP & RESP</Text>
              <Ionicons name="thermometer-outline" size={14} color="#9333ea" />
            </View>
            <View className="mt-1">
              <Text className={`text-[15px] font-bold ${palette.text}`}>
                {liveVitals.temp} °F • {liveVitals.resp} rpm
              </Text>
            </View>
            <Text className={`text-[10px] ${palette.textMuted}`}>Axillary continuous probe</Text>
          </View>
        </View>

        {/* Emergency Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={simulateVitalsAlert}
            className="flex-1 rounded-[14px] bg-amber-500 py-3 items-center justify-center flex-row gap-1.5 shadow-sm"
          >
            <Ionicons name="warning" size={16} color="#fff" />
            <Text className="text-[12px] font-bold text-white">Simulate SpO2 Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerCodeBlue}
            className="flex-1 rounded-[14px] bg-rose-600 py-3 items-center justify-center flex-row gap-1.5 shadow-sm"
          >
            <Ionicons name="alarm" size={16} color="#fff" />
            <Text className="text-[12px] font-bold text-white">Call CODE BLUE 🚨</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
