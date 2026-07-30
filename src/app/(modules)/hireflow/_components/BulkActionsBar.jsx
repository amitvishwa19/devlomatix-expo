import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

const actions = [
  { id: 'stage', label: 'Change Stage', icon: 'git-branch-outline', color: '#6366f1' },
  { id: 'assign', label: 'Assign', icon: 'person-add-outline', color: '#22c55e' },
  { id: 'email', label: 'Email', icon: 'mail-outline', color: '#f59e0b' },
  { id: 'archive', label: 'Archive', icon: 'archive-outline', color: '#f43f5e' },
];

export default function BulkActionsBar({ selectedCount, onAction, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <View className="absolute bottom-24 left-4 right-4 rounded-xl bg-slate-900 p-3 shadow-xl shadow-black/30">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-[12px] font-bold text-white">{selectedCount} selected</Text>
        <Pressable onPress={onClear}>
          <Text className="text-[11px] font-bold text-slate-400">Clear</Text>
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        {actions.map(a => (
          <Pressable key={a.id} onPress={() => onAction?.(a.id)} className="flex-1 items-center gap-1 rounded-lg bg-slate-800 py-2.5">
            <Ionicons name={a.icon} size={16} color={a.color} />
            <Text className="text-[8px] font-bold text-slate-300">{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
