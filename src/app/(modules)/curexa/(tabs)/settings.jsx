import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';

export default function CurexaSettingsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { hospitalInfo, portalMode, setPortalMode, currentPatientProfile } = useCurexa();

  // Settings Toggles
  const [smsReminders, setSmsReminders] = useState(true);
  const [criticalLabAlerts, setCriticalLabAlerts] = useState(true);
  const [bedAutoClean, setBedAutoClean] = useState(true);
  const [drugInteractionWarning, setDrugInteractionWarning] = useState(true);
  const [patientDirectBooking, setPatientDirectBooking] = useState(true);
  const [patientLabDownloads, setPatientLabDownloads] = useState(true);

  const isHospitalMode = portalMode === 'HOSPITAL';

  const handleToggleMode = (mode) => {
    setPortalMode(mode);
    Alert.alert(
      'App Portal Mode Updated',
      mode === 'HOSPITAL'
        ? '🏥 Switched to Clinic / Hospital Management Mode. All clinical tools (OPD queues, ICU Beds, Pharmacy, Billing, e-Rx) are active.'
        : '👤 Switched to Patient Care Portal Mode. Tailored for patients to view appointments, test reports, prescriptions, and join video consultations.'
    );
  };

  return (
    <AppScreen>
      <CurexaHeader title="Curexa Configuration" subtitle="App Role & Clinical Settings" />
      <ScrollView className="flex-1 px-3 pt-2 pb-24" showsVerticalScrollIndicator={false}>
        {/* App Mode Switcher (Hospital / Clinic vs. Patient Care) */}
        <View className={`mb-2.5 rounded-[16px] p-3 shadow-sm border border-emerald-500/30 ${palette.surface}`}>
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-emerald-600">
                APP PURPOSE & ROLE MODE
              </Text>
              <Text className={`text-[14px] font-bold ${palette.text}`}>
                {isHospitalMode ? '🏥 Clinic / Hospital Management' : '👤 Patient Care Portal'}
              </Text>
            </View>
            <View className="rounded-full bg-emerald-500/20 px-2.5 py-0.5">
              <Text className="text-[9.5px] font-bold text-emerald-700">
                {isHospitalMode ? 'STAFF / CLINIC' : 'PATIENT'}
              </Text>
            </View>
          </View>

          <Text className={`text-[11px] mb-3 leading-4 ${palette.textMuted}`}>
            {isHospitalMode
              ? 'Configured for doctors, nurses, and hospital administration. Full access to inpatient wards, OPD queues, electronic health records, pharmacy, and billing.'
              : 'Configured for patients & families. Streamlined access to book OPD slots, view electronic prescriptions, download lab reports, and launch virtual video consultations.'}
          </Text>

          {/* Segmented Mode Switcher */}
          <View className={`flex-row rounded-[12px] p-1 ${palette.surfaceInset}`}>
            <TouchableOpacity
              onPress={() => handleToggleMode('HOSPITAL')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] py-2 ${
                isHospitalMode ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="business"
                size={14}
                color={isHospitalMode ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`text-[11px] font-bold ${
                  isHospitalMode ? 'text-white' : palette.textMuted
                }`}
              >
                Clinic / Hospital
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleToggleMode('PATIENT')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] py-2 ${
                !isHospitalMode ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name="person"
                size={14}
                color={!isHospitalMode ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`text-[11px] font-bold ${
                  !isHospitalMode ? 'text-white' : palette.textMuted
                }`}
              >
                Patient Portal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hospital Profile Banner */}
        <View className={`mb-2.5 rounded-[16px] p-3 ${palette.surface}`}>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-emerald-600">
              <Ionicons name="medical" size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className={`text-[15px] font-bold ${palette.text}`}>{hospitalInfo.name}</Text>
              <Text className={`text-[11px] ${palette.textMuted}`}>{hospitalInfo.tagline}</Text>
              <Text className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                NABH Accredited • License #HMS-8849-US
              </Text>
            </View>
          </View>
        </View>

        {/* Patient Portal Specific Profile & Features (if in Patient mode) */}
        {!isHospitalMode && (
          <>
            <View className={`mb-2.5 rounded-[16px] p-3 ${palette.surface}`}>
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-sky-600">
                Patient Medical Profile
              </Text>
              <View className="gap-2">
                <View className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-[13px] font-bold ${palette.text}`}>
                      {currentPatientProfile?.displayName || 'Eleanor Vance'}
                    </Text>
                    <View className="rounded-full bg-sky-500/20 px-2 py-0.5">
                      <Text className="text-[9.5px] font-bold text-sky-700">
                        {currentPatientProfile?.uhid || 'CUX-889102'}
                      </Text>
                    </View>
                  </View>
                  <Text className={`text-[10.5px] ${palette.textMuted} mt-0.5`}>
                    Age: {currentPatientProfile?.age} • Gender: {currentPatientProfile?.gender} • Blood Group: {currentPatientProfile?.bloodGroup}
                  </Text>
                </View>

                <View className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-rose-600 mb-1">
                    Emergency Contact (ICE)
                  </Text>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>
                    {currentPatientProfile?.emergencyContact?.name} ({currentPatientProfile?.emergencyContact?.relation})
                  </Text>
                  <Text className="text-[11px] font-semibold text-rose-600">
                    {currentPatientProfile?.emergencyContact?.phone}
                  </Text>
                </View>

                <View className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-amber-600 mb-1">
                    Documented Allergies
                  </Text>
                  <View className="flex-row flex-wrap gap-1">
                    {currentPatientProfile?.allergies?.map((al, idx) => (
                      <View key={idx} className="rounded-full bg-amber-500/20 px-2 py-0.5">
                        <Text className="text-[9.5px] font-bold text-amber-700">{al}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View className={`mb-2.5 rounded-[16px] p-3 ${palette.surface}`}>
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-sky-600">
                Patient Portal Privileges
              </Text>
              <View className="gap-2.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className={`text-[13px] font-bold ${palette.text}`}>
                      Instant Online OPD Booking
                    </Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>
                      Allow patients to reserve doctor consultation tokens directly
                    </Text>
                  </View>
                  <Switch
                    value={patientDirectBooking}
                    onValueChange={setPatientDirectBooking}
                    trackColor={{ false: '#767577', true: '#0284c7' }}
                  />
                </View>

                <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-2">
                  <View className="flex-1 pr-2">
                    <Text className={`text-[13px] font-bold ${palette.text}`}>
                      Direct Lab Report Downloads
                    </Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>
                      Automatic PDF access as soon as tests are signed by pathologist
                    </Text>
                  </View>
                  <Switch
                    value={patientLabDownloads}
                    onValueChange={setPatientLabDownloads}
                    trackColor={{ false: '#767577', true: '#0284c7' }}
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* Clinical Operations Controls */}
        <View className={`mb-2.5 rounded-[16px] p-3 ${palette.surface}`}>
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-emerald-600">
            Clinical Safety & Notifications
          </Text>
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Drug Interaction Checker</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>
                  Warn when contra-indicated medicines are co-prescribed
                </Text>
              </View>
              <Switch
                value={drugInteractionWarning}
                onValueChange={setDrugInteractionWarning}
                trackColor={{ false: '#767577', true: '#059669' }}
              />
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-2">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Critical Lab Value Alerts</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>
                  Instant push notification when urgent lab tests finish
                </Text>
              </View>
              <Switch
                value={criticalLabAlerts}
                onValueChange={setCriticalLabAlerts}
                trackColor={{ false: '#767577', true: '#059669' }}
              />
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-2">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Auto Bed Cleaning Workflow</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>
                  Move discharged beds to CLEANING status automatically
                </Text>
              </View>
              <Switch
                value={bedAutoClean}
                onValueChange={setBedAutoClean}
                trackColor={{ false: '#767577', true: '#059669' }}
              />
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-200/10 pt-2">
              <View className="flex-1 pr-2">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Automated SMS Reminders</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>
                  Send OPD appointment reminder SMS 2 hours prior
                </Text>
              </View>
              <Switch
                value={smsReminders}
                onValueChange={setSmsReminders}
                trackColor={{ false: '#767577', true: '#059669' }}
              />
            </View>
          </View>
        </View>

        {/* Hospital Hub Module Jump Links */}
        <View className={`mb-2.5 rounded-[16px] p-3 ${palette.surface}`}>
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-emerald-600">
            Hospital Operations Hub
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'Wards & Beds', route: '/(modules)/curexa/beds', icon: 'bed-outline', color: '#059669' },
              { label: 'Pharmacy', route: '/(modules)/curexa/pharmacy', icon: 'medkit-outline', color: '#8b5cf6' },
              { label: 'Laboratory', route: '/(modules)/curexa/laboratory', icon: 'flask-outline', color: '#06b6d4' },
              { label: 'Invoices', route: '/(modules)/curexa/billing', icon: 'receipt-outline', color: '#f59e0b' },
              { label: 'Workflow', route: '/(modules)/curexa/workflow', icon: 'git-network-outline', color: '#ec4899' },
              { label: 'Reports', route: '/(modules)/curexa/reports', icon: 'bar-chart-outline', color: '#6366f1' },
            ].map((m, i) => (
              <Pressable
                key={i}
                onPress={() => router.push(m.route)}
                className={`w-[48%] flex-1 min-w-[140px] flex-row items-center gap-2 rounded-[12px] p-2.5 ${palette.surfaceInset}`}
              >
                <Ionicons name={m.icon} size={16} color={m.color} />
                <Text className={`text-[11px] font-bold ${palette.text}`}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Onboarding Tour Replay */}
        <Pressable
          onPress={() => router.push('/(modules)/curexa/onboarding')}
          className={`mb-2.5 flex-row items-center justify-between rounded-[16px] p-3 shadow-sm ${palette.surface}`}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-500/15">
              <Ionicons name="sparkles-outline" size={16} color="#059669" />
            </View>
            <View>
              <Text className={`text-[12px] font-bold ${palette.text}`}>Replay Onboarding Tour</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>View features walkthrough and slide guide</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={15} color="#059669" />
        </Pressable>

        {/* Return Button */}
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          className="rounded-[14px] bg-emerald-600 py-3 items-center justify-center shadow-sm"
        >
          <Text className="text-[12px] font-bold text-white">Return to Main Devlomatix Apps</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}
