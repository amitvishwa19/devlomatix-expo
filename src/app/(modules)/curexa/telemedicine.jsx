import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaTelemedicineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { appointments, patients } = useCurexa();

  const [inCall, setInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || {});
  const [whiteboardVisible, setWhiteboardVisible] = useState(false);
  const [whiteboardNotes, setWhiteboardNotes] = useState('• Left Ventricular Ejection Fraction: 60%\n• Normal Sinus Rhythm\n• Advised 20 mins daily walk & low sodium intake');
  const [inCallPrescription, setInCallPrescription] = useState('Paracetamol 650mg TDS x 3 days\nPantoprazole 40mg OD x 7 days');

  // Call timer
  useEffect(() => {
    let timer;
    if (inCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [inCall]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startConsultation = (patient) => {
    setSelectedPatient(patient);
    setInCall(true);
  };

  const endConsultation = () => {
    setInCall(false);
    Alert.alert(
      'Consultation Concluded',
      `Total Duration: ${formatTimer(callDuration)}\nPrescription and doctor consultation notes archived in patient EMR.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <AppScreen>
      <CurexaHeader title="Telemedicine Virtual OPD" subtitle="HD Encrypted Video Consultation" />

      {inCall ? (
        /* ================= ACTIVE VIDEO CONSULTATION ROOM ================= */
        <View className="flex-1 bg-slate-950 px-3 pt-2 pb-6 justify-between">
          {/* Top Call Banner */}
          <View className="flex-row items-center justify-between rounded-[16px] bg-slate-900/90 p-3 border border-white/10">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <View>
                <Text className="text-[13px] font-bold text-white">
                  {selectedPatient.displayName || selectedPatient.name || 'Eleanor Vance'}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  Cardiology Follow-Up • Secure WebRTC
                </Text>
              </View>
            </View>

            <View className="rounded-full bg-emerald-500/20 px-3 py-1 border border-emerald-500/40">
              <Text className="text-[11px] font-bold text-emerald-400 font-mono">
                {formatTimer(callDuration)}
              </Text>
            </View>
          </View>

          {/* Video Stream Simulation Grid */}
          <View className="flex-1 my-3 rounded-[24px] bg-slate-900 border border-slate-800 relative justify-center items-center overflow-hidden">
            {/* Main Remote Video (Patient) */}
            <View className="items-center">
              <View className="h-24 w-24 rounded-full bg-emerald-500/20 items-center justify-center border-2 border-emerald-400 mb-3">
                <Ionicons name="person" size={48} color="#34d399" />
              </View>
              <Text className="text-white text-[16px] font-bold">
                {selectedPatient.displayName || 'Patient'}
              </Text>
              <Text className="text-emerald-400 text-[11px]">
                HD 1080p • 60 FPS • Encrypted Stream
              </Text>
            </View>

            {/* Picture-in-Picture Local Doctor Feed */}
            <View className="absolute right-3 bottom-3 h-32 w-24 rounded-[16px] bg-slate-800 border border-white/20 items-center justify-center shadow-lg">
              <Ionicons name="medkit" size={24} color="#10b981" />
              <Text className="text-[9px] text-white font-bold mt-1">Dr. Sarah Lin</Text>
              <Text className="text-[8px] text-emerald-400">YOU (Host)</Text>
            </View>

            {/* Quick Medical Whiteboard Toggle */}
            <TouchableOpacity
              onPress={() => setWhiteboardVisible(true)}
              className="absolute left-3 bottom-3 flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 border border-white/20"
            >
              <Ionicons name="pencil" size={13} color="#10b981" />
              <Text className="text-[10px] font-bold text-white">Clinical Whiteboard</Text>
            </TouchableOpacity>
          </View>

          {/* In-Call Quick Prescription Box */}
          <View className="rounded-[16px] bg-slate-900/90 p-3 border border-white/10 mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Instant In-Call e-Prescription
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Sent', 'Prescription signed and transmitted to patient.')}
                className="rounded bg-emerald-600 px-2 py-0.5"
              >
                <Text className="text-[9px] font-bold text-white">Transmit e-Rx</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={inCallPrescription}
              onChangeText={setInCallPrescription}
              multiline
              className="text-[11px] text-slate-200 bg-slate-950/60 rounded-[10px] p-2"
            />
          </View>

          {/* Call Control Bar */}
          <View className="flex-row items-center justify-center gap-4">
            {/* Mic Toggle */}
            <TouchableOpacity
              onPress={() => setMicMuted(!micMuted)}
              className={`h-12 w-12 rounded-full items-center justify-center ${
                micMuted ? 'bg-rose-500' : 'bg-slate-800 border border-white/20'
              }`}
            >
              <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={20} color="#fff" />
            </TouchableOpacity>

            {/* Camera Toggle */}
            <TouchableOpacity
              onPress={() => setVideoDisabled(!videoDisabled)}
              className={`h-12 w-12 rounded-full items-center justify-center ${
                videoDisabled ? 'bg-rose-500' : 'bg-slate-800 border border-white/20'
              }`}
            >
              <Ionicons name={videoDisabled ? 'videocam-off' : 'videocam'} size={20} color="#fff" />
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              onPress={endConsultation}
              className="h-14 w-14 rounded-full bg-rose-600 items-center justify-center shadow-lg shadow-rose-900/50"
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ================= VIRTUAL OPD QUEUE LOBBY ================= */
        <ScrollView className="flex-1 px-3 pt-3 pb-24" showsVerticalScrollIndicator={false}>
          {/* Virtual Waiting Room Banner */}
          <View className={`rounded-[16px] p-3 shadow-sm mb-3 ${palette.surface}`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                  TELEHEALTH QUEUE
                </Text>
                <Text className={`text-[15px] font-bold ${palette.text}`}>
                  Online OPD Waiting Lounge
                </Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  Patients checked in and waiting for video consultation
                </Text>
              </View>
              <View className="rounded-full bg-emerald-500/15 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-emerald-700">
                  {appointments.length} in Queue
                </Text>
              </View>
            </View>
          </View>

          {/* Telemedicine Waiting Patients List */}
          <View className="gap-2.5">
            {appointments.map((apt) => (
              <View
                key={apt.id}
                className={`rounded-[14px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Ionicons name="videocam" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text className={`text-[13px] font-bold ${palette.text}`}>
                        {apt.patientName}
                      </Text>
                      <Text className={`text-[10.5px] ${palette.textMuted}`}>
                        Token: {apt.token} • {apt.timeSlot} • {apt.specialty}
                      </Text>
                    </View>
                  </View>
                  <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-700">READY</Text>
                  </View>
                </View>

                <Text className={`text-[11px] mb-2.5 ${palette.textMuted}`}>
                  Chief Complaint: {apt.symptoms}
                </Text>

                <TouchableOpacity
                  onPress={() => startConsultation({ displayName: apt.patientName, ...apt })}
                  className="rounded-[12px] bg-emerald-600 py-2.5 items-center flex-row justify-center gap-1.5 shadow-sm"
                >
                  <Ionicons name="videocam" size={15} color="#fff" />
                  <Text className="text-[12px] font-bold text-white">
                    Start Video Consultation
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Clinical Medical Whiteboard Modal */}
      <Modal visible={whiteboardVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setWhiteboardVisible(false)} />
          <View
            style={{
              maxHeight: '85%',
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            }}
            className={`rounded-t-[28px] p-4 ${palette.surface}`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pencil" size={18} color="#059669" />
                <Text className={`text-[15px] font-bold ${palette.text}`}>
                  Clinical Whiteboard & Notes
                </Text>
              </View>
              <TouchableOpacity onPress={() => setWhiteboardVisible(false)}>
                <Ionicons name="close-circle" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className={`text-[11px] mb-2 ${palette.textMuted}`}>
              Draw or note anatomical explanations shared with the patient during call.
            </Text>

            <TextInput
              value={whiteboardNotes}
              onChangeText={setWhiteboardNotes}
              multiline
              className={`rounded-[14px] p-3 text-[12px] min-h-[140px] mb-4 ${palette.surfaceInset} ${palette.text}`}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={() => {
                setWhiteboardVisible(false);
                Alert.alert('Saved', 'Whiteboard notes synced to patient EMR.');
              }}
              className="rounded-[14px] bg-emerald-600 py-3 items-center"
            >
              <Text className="text-[13px] font-bold text-white">Save to Consultation Chart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
