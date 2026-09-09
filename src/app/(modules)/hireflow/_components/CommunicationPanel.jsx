import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const sampleHistory = [
  { id: '1', subject: 'Interview Invitation - Senior Frontend Developer', date: '2 days ago', type: 'sent' },
  { id: '2', subject: 'Application Received - Thank You', date: '5 days ago', type: 'sent' },
  { id: '3', subject: 'Follow-up: Availability for Next Round', date: '1 week ago', type: 'received' },
];

export default function CommunicationPanel({ candidateEmail, candidateName }) {
  const [tab, setTab] = useState('message');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const sendEmail = () => {
    // placeholder
    setSubject('');
    setMessage('');
  };

  return (
    <View>
      <View className="flex-row gap-2 mb-4">
        <Pressable onPress={() => setTab('message')} className={`rounded-lg px-3.5 py-2 ${tab === 'message' ? 'bg-indigo-600' : 'bg-slate-100'}`}>
          <Text className={`text-[11px] font-bold ${tab === 'message' ? 'text-white' : 'text-slate-600'}`}>New Message</Text>
        </Pressable>
        <Pressable onPress={() => setTab('history')} className={`rounded-lg px-3.5 py-2 ${tab === 'history' ? 'bg-indigo-600' : 'bg-slate-100'}`}>
          <Text className={`text-[11px] font-bold ${tab === 'history' ? 'text-white' : 'text-slate-600'}`}>History</Text>
        </Pressable>
      </View>

      {tab === 'message' ? (
        <View>
          <View className="flex-row items-center gap-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Ionicons name="mail-outline" size={14} color="#64748b" />
            <Text className="text-[11px] text-slate-500">To: {candidateEmail || 'candidate@example.com'}</Text>
          </View>
          <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-900 mb-3" />
          <TextInput value={message} onChangeText={setMessage} placeholder="Write your message..." placeholderTextColor="#94a3b8" multiline numberOfLines={5} className="border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-900 mb-3 min-h-[100px]" textAlignVertical="top" />
          <View className="flex-row gap-2">
            <Pressable className="flex-row items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2">
              <Ionicons name="sparkles-outline" size={14} color="#6366f1" />
              <Text className="text-[11px] font-bold text-indigo-600">AI Template</Text>
            </Pressable>
            <Pressable onPress={sendEmail} disabled={!subject || !message} className={`flex-1 rounded-xl py-2.5 items-center ${subject && message ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <Text className={`text-[12px] font-bold ${subject && message ? 'text-white' : 'text-slate-400'}`}>Send Email</Text>
            </Pressable>
          </View>

          {/* AI Nurture */}
          <View className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <View className="flex-row items-start gap-2">
              <Ionicons name="leaf-outline" size={18} color="#22c55e" />
              <View className="flex-1">
                <Text className="text-[12px] font-bold text-emerald-700">AI Nurture</Text>
                <Text className="text-[10px] text-emerald-600 mt-0.5">Send an automated nurture sequence to keep this candidate engaged.</Text>
                <Pressable className="mt-2 self-start rounded-lg bg-emerald-600 px-3.5 py-1.5">
                  <Text className="text-[10px] font-bold text-white">Send Nurture Update</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View>
          {sampleHistory.map(h => (
            <View key={h.id} className="flex-row items-start gap-3 p-3 mb-2 rounded-xl bg-slate-50 border border-slate-100">
              <View className={`h-8 w-8 items-center justify-center rounded-full ${h.type === 'sent' ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
                <Ionicons name={h.type === 'sent' ? 'arrow-up' : 'arrow-down'} size={14} color={h.type === 'sent' ? '#6366f1' : '#22c55e'} />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-bold text-slate-900">{h.subject}</Text>
                <Text className="text-[9px] text-slate-400 mt-0.5">{h.date} · {h.type === 'sent' ? 'Sent' : 'Received'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
