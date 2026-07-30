import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const sampleNotes = [
  { id: '1', author: 'You', text: 'Strong technical background. Need to assess cultural fit in next round.', time: '2 hours ago', avatar: 'Y' },
  { id: '2', author: 'Anika Sharma', text: 'Candidate showed excellent problem-solving skills during the coding challenge.', time: '1 day ago', avatar: 'AS' },
  { id: '3', author: 'Rahul Mehta', text: 'Availability: Can join within 2 weeks. Salary expectation is within range.', time: '3 days ago', avatar: 'RM' },
];

export default function TeamNotes({ candidateName, notes: externalNotes }) {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(externalNotes || sampleNotes);

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now().toString(), author: 'You', text: newNote, time: 'Just now', avatar: 'Y' }, ...prev]);
    setNewNote('');
  };

  return (
    <View>
      {/* Add note */}
      <View className="mb-4">
        <TextInput
          value={newNote}
          onChangeText={setNewNote}
          placeholder={`Add a note about ${candidateName || 'this candidate'}...`}
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
          className="border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-900 mb-2 min-h-[70px]"
          textAlignVertical="top"
        />
        <Pressable
          onPress={addNote}
          disabled={!newNote.trim()}
          className={`self-end rounded-xl px-5 py-2 ${newNote.trim() ? 'bg-indigo-600' : 'bg-slate-200'}`}
        >
          <Text className={`text-[12px] font-bold ${newNote.trim() ? 'text-white' : 'text-slate-400'}`}>Post Note</Text>
        </Pressable>
      </View>

      {/* Notes list */}
      <Text className="text-[13px] font-bold text-slate-900 mb-3">Collaborative Discussion ({notes.length})</Text>
      {notes.map(n => (
        <View key={n.id} className="flex-row gap-3 mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
            <Text className="text-[9px] font-bold text-indigo-600">{n.avatar}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-bold text-slate-900">{n.author}</Text>
              <Text className="text-[9px] text-slate-400">{n.time}</Text>
            </View>
            <Text className="text-[11px] text-slate-700 mt-1 leading-4">{n.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
