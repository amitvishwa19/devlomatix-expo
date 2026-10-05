import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaMessagingAutomationScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { appointments, patients, labOrders, whatsappLogs, addWhatsappLogLocally } = useCurexa();

  const [activeTab, setActiveTab] = useState('QUEUE_ALERTS'); // QUEUE_ALERTS | LAB_REPORTS | FAMILY_UPDATES | LOGS
  const [customMsg, setCustomMsg] = useState('');
  const [targetPhone, setTargetPhone] = useState('+1 (555) 234-5678');

  const sendTokenUpdate = (apt) => {
    const text = `Hello ${apt.patientName}, your OPD Token ${apt.token} with ${apt.doctorName} (${apt.specialty}) is next. Please report to Consultation Desk.`;
    const newLog = {
      id: `wa-${Date.now()}`,
      patientName: apt.patientName,
      phone: apt.patientPhone,
      type: 'TOKEN_UPDATE',
      message: text,
      status: 'DELIVERED',
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addWhatsappLogLocally(newLog);
    Alert.alert('WhatsApp Sent', `Token alert dispatched to ${apt.patientName} (${apt.patientPhone}) over KonnectX WhatsApp API.`);
  };

  const sendLabPdf = (order) => {
    const text = `Dear ${order.patientName}, your diagnostic lab report for ${order.tests.join(', ')} is ready. View/Download PDF: https://curexa.devlomatix.com/r/${order.orderNumber}`;
    const newLog = {
      id: `wa-${Date.now()}`,
      patientName: order.patientName,
      phone: '+1 (555) 432-8765',
      type: 'LAB_REPORT',
      message: text,
      status: 'DELIVERED',
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addWhatsappLogLocally(newLog);
    Alert.alert('Report Dispatched', `PDF lab report link delivered to ${order.patientName} via WhatsApp.`);
  };

  const sendFamilyStatusAlert = (patient, eventType) => {
    let msg = `Hospital Update: ${patient.displayName} has been successfully admitted to ${patient.ward} under ${patient.primaryDoctor}. Vitals are stable.`;
    if (eventType === 'SURGERY') {
      msg = `Surgery Update: ${patient.displayName} procedure completed safely. Transferred to Post-Op Recovery. Attending surgeon: ${patient.primaryDoctor}.`;
    } else if (eventType === 'DISCHARGE') {
      msg = `Discharge Clearance: ${patient.displayName} is cleared for discharge. Prescriptions and summary sent to your phone.`;
    }

    const newLog = {
      id: `wa-${Date.now()}`,
      patientName: patient.displayName,
      phone: patient.phone,
      type: 'FAMILY_UPDATE',
      message: msg,
      status: 'SENT',
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addWhatsappLogLocally(newLog);
    Alert.alert('Family Alert Dispatched', `WhatsApp notification sent to registered relative: ${patient.phone}`);
  };

  return (
    <AppScreen>
      <CurexaHeader title="WhatsApp & SMS Automation" subtitle="KonnectX Automated Hospital Messaging" />

      {/* Tabs */}
      <View className="px-3 pt-2">
        <View className={`flex-row rounded-[14px] p-1 ${palette.surface}`}>
          {[
            { key: 'QUEUE_ALERTS', label: 'OPD Tokens', icon: 'time-outline' },
            { key: 'LAB_REPORTS', label: 'Lab Reports', icon: 'document-text-outline' },
            { key: 'FAMILY_UPDATES', label: 'Family Alerts', icon: 'people-outline' },
            { key: 'LOGS', label: 'Dispatch Log', icon: 'list-outline' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-[10px] py-2 ${
                activeTab === tab.key ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={activeTab === tab.key ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`text-[10.5px] font-bold ${
                  activeTab === tab.key ? 'text-white' : palette.textMuted
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-3 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: OPD TOKEN ALERTS ================= */}
        {activeTab === 'QUEUE_ALERTS' && (
          <View className="gap-2.5">
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
                Live OPD Queue Dispatcher
              </Text>
              <Text className={`text-[11px] mb-2.5 ${palette.textMuted}`}>
                Notify patients automatically on WhatsApp when their consultation token is next in queue.
              </Text>

              <View className="gap-2">
                {appointments.map((apt) => (
                  <View
                    key={apt.id}
                    className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                        <Text className="text-[11px] font-extrabold text-emerald-700">
                          {apt.token}
                        </Text>
                      </View>
                      <View>
                        <Text className={`text-[12px] font-bold ${palette.text}`}>
                          {apt.patientName}
                        </Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {apt.doctorName} • {apt.timeSlot}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => sendTokenUpdate(apt)}
                      className="flex-row items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 shadow-sm"
                    >
                      <Ionicons name="logo-whatsapp" size={13} color="#fff" />
                      <Text className="text-[11px] font-bold text-white">Send Ping</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: LAB REPORT DISPATCH ================= */}
        {activeTab === 'LAB_REPORTS' && (
          <View className="gap-2.5">
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
                1-Tap WhatsApp Diagnostic Report Delivery
              </Text>
              <Text className={`text-[11px] mb-2.5 ${palette.textMuted}`}>
                Deliver signed PDF lab results directly to patient mobile numbers.
              </Text>

              <View className="gap-2">
                {labOrders.map((ord) => (
                  <View
                    key={ord.id}
                    className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                        <Ionicons name="document-text" size={16} color="#0891b2" />
                      </View>
                      <View>
                        <Text className={`text-[12px] font-bold ${palette.text}`}>
                          {ord.patientName}
                        </Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {ord.orderNumber} • {ord.tests[0]}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => sendLabPdf(ord)}
                      className="flex-row items-center gap-1 rounded bg-teal-600 px-3 py-1.5 shadow-sm"
                    >
                      <Ionicons name="send" size={12} color="#fff" />
                      <Text className="text-[11px] font-bold text-white">Send PDF</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 3: INPATIENT FAMILY ALERTS ================= */}
        {activeTab === 'FAMILY_UPDATES' && (
          <View className="gap-2.5">
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
                Inpatient & Surgery Family Notifications
              </Text>
              <Text className={`text-[11px] mb-2.5 ${palette.textMuted}`}>
                Keep patient emergency contacts and family informed during key hospital milestones.
              </Text>

              <View className="gap-2.5">
                {patients.slice(0, 3).map((p) => (
                  <View
                    key={p.id}
                    className={`rounded-[12px] p-3 ${palette.surfaceInset}`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>
                          {p.displayName || p.name}
                        </Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {p.ward} • Phone: {p.phone}
                        </Text>
                      </View>
                      <View className="rounded bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-emerald-700">
                          {p.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-1.5">
                      <TouchableOpacity
                        onPress={() => sendFamilyStatusAlert(p, 'ADMISSION')}
                        className="flex-1 rounded bg-slate-200 dark:bg-slate-700 py-1.5 items-center"
                      >
                        <Text className={`text-[10px] font-bold ${palette.text}`}>
                          Admitted Alert
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => sendFamilyStatusAlert(p, 'SURGERY')}
                        className="flex-1 rounded bg-amber-500 py-1.5 items-center"
                      >
                        <Text className="text-[10px] font-bold text-white">Post-Op Update</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => sendFamilyStatusAlert(p, 'DISCHARGE')}
                        className="flex-1 rounded bg-emerald-600 py-1.5 items-center"
                      >
                        <Text className="text-[10px] font-bold text-white">Discharge Note</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 4: DISPATCH LOGS ================= */}
        {activeTab === 'LOGS' && (
          <View className="gap-2">
            <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
              Real-time Automated Message Dispatch History
            </Text>
            {whatsappLogs.map((log) => (
              <View
                key={log.id}
                className={`rounded-[14px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                    <Text className={`text-[12px] font-bold ${palette.text}`}>
                      {log.patientName}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-[9px] font-bold text-emerald-600 uppercase">
                      {log.status}
                    </Text>
                    <Text className={`text-[9px] ${palette.textMuted}`}>• {log.sentAt}</Text>
                  </View>
                </View>
                <Text className={`text-[11px] leading-4 ${palette.textMuted}`}>{log.message}</Text>
                <Text className="text-[9px] text-emerald-600 font-semibold mt-1.5">
                  Route: KonnectX Cloud WhatsApp Gateway
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
