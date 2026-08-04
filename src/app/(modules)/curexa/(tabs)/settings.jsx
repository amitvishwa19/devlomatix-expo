import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { BedStatusModal, BillingSummaryModal } from '../_components/CurexaModals';

const doctorsRoster = [
  { id: 1, name: 'Dr. Sarah Jenkins', specialty: 'Chief of Cardiology', hours: '09:00 AM - 02:00 PM', status: 'On Duty' },
  { id: 2, name: 'Dr. Alan Vance', specialty: 'General & Emergency Medicine', hours: '08:00 AM - 04:00 PM', status: 'On Duty' },
  { id: 3, name: 'Dr. Emily Watson', specialty: 'Orthopedics & Spine', hours: '10:00 AM - 03:00 PM', status: 'On Call' },
  { id: 4, name: 'Dr. Jonathan Reed', specialty: 'Neurology & Stroke Unit', hours: '01:00 PM - 07:00 PM', status: 'Off Duty' },
];

export default function CurexaSettingsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const [showBedModal, setShowBedModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Settings Toggles
  const [smsReminders, setSmsReminders] = useState(true);
  const [aiScoring, setAiScoring] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  return (
    <AppScreen>
      <CurexaHeader title="System Settings" />
      <ScrollView className="flex-1 px-4 pt-3 pb-28" showsVerticalScrollIndicator={false}>
        {/* Header Profile */}
        <View className={`mb-3.5 rounded-[24px] p-4.5 ${palette.surface}`}>
          <View className="flex-row items-center gap-3.5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600">
              <Ionicons name="medical" size={24} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className={`text-[18px] font-bold ${palette.text}`}>Curexa Medical Center</Text>
              <Text className={`text-[12px] ${palette.textMuted}`}>License #HMS-8849-NY • Multi-Specialty</Text>
              <Text className="mt-0.5 text-[11px] font-semibold text-emerald-600">Helpline: 1800-555-CURE</Text>
            </View>
          </View>
        </View>

        {/* Hospital Sub-Module Shortcuts */}
        <Text className={`mb-2 text-[13px] font-bold ${palette.text}`}>Hospital Modules & Operations</Text>
        <View className="mb-3.5 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(modules)/curexa/beds')}
            className={`w-[48%] flex-row items-center gap-3 rounded-[20px] p-3.5 ${palette.surface}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <Ionicons name="bed-outline" size={18} color="#059669" />
            </View>
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Wards & Beds</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Live Occupancy</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/curexa/billing')}
            className={`w-[48%] flex-row items-center gap-3 rounded-[20px] p-3.5 ${palette.surface}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15">
              <Ionicons name="receipt-outline" size={18} color="#9333ea" />
            </View>
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Billing Hub</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Invoices & Claims</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/curexa/pharmacy')}
            className={`w-[48%] flex-row items-center gap-3 rounded-[20px] p-3.5 ${palette.surface}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
              <Ionicons name="medkit-outline" size={18} color="#0284c7" />
            </View>
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Pharmacy</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Active Rx & Stock</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/curexa/laboratory')}
            className={`w-[48%] flex-row items-center gap-3 rounded-[20px] p-3.5 ${palette.surface}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <Ionicons name="flask-outline" size={18} color="#d97706" />
            </View>
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Diagnostics</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Lab Test Queue</Text>
            </View>
          </Pressable>
        </View>

        {/* Doctor & Consultant Roster */}
        <View className={`mb-3.5 rounded-[24px] p-4 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between">
            <Text className={`text-[14px] font-bold ${palette.text}`}>Doctor & Consultant Roster</Text>
            <Pressable onPress={() => router.push('/(modules)/curexa/departments')}>
              <Text className="text-[11px] font-bold text-emerald-600">Departments →</Text>
            </Pressable>
          </View>
          <View className="gap-2">
            {doctorsRoster.map((doc) => (
              <View key={doc.id} className={`flex-row items-center justify-between rounded-xl p-3 ${palette.surfaceInset}`}>
                <View className="flex-1">
                  <Text className={`text-[13px] font-bold ${palette.text}`}>{doc.name}</Text>
                  <Text className={`text-[11px] ${palette.textMuted}`}>{doc.specialty}</Text>
                  <Text className={`mt-0.5 text-[10px] ${palette.textSoft}`}>{doc.hours}</Text>
                </View>
                <View
                  className={`rounded-full px-2.5 py-0.5 ${
                    doc.status === 'On Duty'
                      ? 'bg-emerald-500/20'
                      : doc.status === 'On Call'
                      ? 'bg-amber-500/20'
                      : 'bg-gray-500/20'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      doc.status === 'On Duty'
                        ? 'text-emerald-600'
                        : doc.status === 'On Call'
                        ? 'text-amber-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {doc.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System & Automation Preferences */}
        <View className={`mb-6 rounded-[24px] p-4 ${palette.surface}`}>
          <Text className={`mb-2.5 text-[14px] font-bold ${palette.text}`}>System & Automation Controls</Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-semibold ${palette.text}`}>Automated SMS Reminders</Text>
                <Text className={`text-[11px] ${palette.textSoft}`}>Send WhatsApp/SMS 2 hours prior to OPD visits</Text>
              </View>
              <Switch value={smsReminders} onValueChange={setSmsReminders} trackColor={{ true: '#059669' }} />
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-3">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-semibold ${palette.text}`}>AI Lead Scoring & Routing</Text>
                <Text className={`text-[11px] ${palette.textSoft}`}>Automatically score prospective CRM patient inquiries</Text>
              </View>
              <Switch value={aiScoring} onValueChange={setAiScoring} trackColor={{ true: '#059669' }} />
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-3">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-semibold ${palette.text}`}>Emergency Escalation Alerts</Text>
                <Text className={`text-[11px] ${palette.textSoft}`}>Push notifications for ICU bed updates & triage</Text>
              </View>
              <Switch value={emergencyAlerts} onValueChange={setEmergencyAlerts} trackColor={{ true: '#059669' }} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <BedStatusModal visible={showBedModal} onClose={() => setShowBedModal(false)} />
      <BillingSummaryModal visible={showBillingModal} onClose={() => setShowBillingModal(false)} />
    </AppScreen>
  );
}
