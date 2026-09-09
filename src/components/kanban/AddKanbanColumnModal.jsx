import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '~/theme/AppTheme';
import * as kanbanService from '~/services/kanban/kanban';

export default function AddKanbanColumnModal({ visible, workspaceId, onClose, onCreated }) {
  const { palette, isDark } = useAppTheme();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await kanbanService.createColumn({ workspaceId, title: title.trim() });
      setTitle('');
      if (onCreated) onCreated();
    } catch (e) {
      console.error('create column error', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-center" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="mx-6 rounded-3xl overflow-hidden" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: palette.colors.border }}>
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)' }}>
                <Ionicons name="grid-outline" size={18} color="#14b8a6" />
              </View>
              <Text className="text-[18px] font-bold" style={{ color: palette.textColor }}>New Column</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>

          <View className="px-5 py-6 gap-2">
            <Text className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: palette.textMutedColor }}>Column Title</Text>
            <TextInput
              className="h-12 px-4 rounded-2xl text-[14px] font-bold"
              style={{ backgroundColor: palette.colors.surfaceMuted, color: palette.textColor }}
              placeholder="e.g. TO DO, IN PROGRESS, DONE"
              placeholderTextColor={palette.textMutedColor}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View className="px-5 pb-5 flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: palette.colors.surfaceMuted }}>
              <Text className="text-[13px] font-bold" style={{ color: palette.textMutedColor }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} disabled={!title.trim() || saving}
              className="flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2"
              style={{ backgroundColor: !title.trim() || saving ? (isDark ? '#334155' : '#cbd5e1') : '#14b8a6' }}>
              {saving ? <ActivityIndicator size={16} color="#fff" /> : null}
              <Text className="text-[13px] font-bold" style={{ color: !title.trim() || saving ? palette.textMutedColor : '#fff' }}>
                {saving ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
