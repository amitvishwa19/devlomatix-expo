import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import * as templatesService from '~/services/konnectx/templates';

export default function ShareTemplateDialog({ visible, onClose, template, userId, onUpdate }) {
  const { palette } = useAppTheme();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await templatesService.searchUsers(userId, '', searchQuery);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [userId, searchQuery]);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      searchUsers();
    }
  }, [visible, searchUsers]);

  const handleShare = async (email) => {
    if (!template?.id) return;
    try {
      await templatesService.shareTemplate(userId, template.id, email);
      Toast.show({ type: 'success', text1: 'Shared', text2: `Template shared with user` });
      onUpdate?.();
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleRemoveShare = async (sharedWithUserId) => {
    if (!template?.id) return;
    try {
      await templatesService.removeTemplateShare(userId, template.id, sharedWithUserId);
      Toast.show({ type: 'success', text1: 'Removed', text2: 'Share access removed' });
      searchUsers();
      onUpdate?.();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const sharedWith = template?.sharedWith || [];
  const excludedIds = new Set(sharedWith.map(s => s.sharedWithUserId));
  if (userId) excludedIds.add(userId);

  const availableUsers = users.filter(u => !excludedIds.has(u.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable className={`rounded-[28px] p-6 max-h-[80%] ${palette.surface}`}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-[20px] font-bold ${palette.text}`}>Share Template</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Template</Text>
          <Text className={`mb-4 text-[14px] ${palette.textSoft}`}>{template?.name}</Text>

          <Text className={`mb-2 text-[13px] font-semibold ${palette.text}`}>Search Users</Text>
          <View className="mb-4 flex-row items-center rounded-[20px] border px-4 py-3"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
            <Ionicons name="search" size={18} color={palette.textMutedColor} />
            <TextInput className="ml-2 flex-1 text-[14px]" style={{ color: palette.textColor }}
              placeholder="Search by name or email..." placeholderTextColor={palette.textMutedColor}
              value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={searchUsers} />
          </View>

          {sharedWith.length > 0 ? (
            <View className="mb-4">
              <Text className={`mb-2 text-[12px] font-bold ${palette.textSoft}`}>Already shared with:</Text>
              {sharedWith.map(share => (
                <View key={share.id} className="flex-row items-center justify-between mb-2 rounded-xl border p-3"
                  style={{ borderColor: palette.colors.border }}>
                  <Text className={`text-[13px] flex-1 ${palette.text}`}>
                    {share.sharedWith?.displayName || share.sharedWith?.email || share.sharedWithUserId}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveShare(share.sharedWithUserId)}>
                    <Ionicons name="close-circle" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <Text className={`mb-2 text-[12px] font-bold ${palette.textSoft}`}>Available users:</Text>
          <FlatList
            data={availableUsers}
            keyExtractor={(item) => item.id?.toString()}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 200 }}
            ListEmptyComponent={
              <Text className={`text-center text-[13px] ${palette.textMuted}`}>
                {loading ? 'Searching...' : 'No users found'}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleShare(item.email)}
                className="flex-row items-center gap-3 mb-2 rounded-xl border p-3"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <View className="h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                  <Text className="text-[12px] font-bold text-sky-600">
                    {(item.displayName || item.email)?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-[13px] font-bold ${palette.text}`}>{item.displayName || 'Unknown'}</Text>
                  <Text className={`text-[11px] ${palette.textSoft}`}>{item.email}</Text>
                </View>
                <Ionicons name="share-outline" size={18} color="#0284c7" />
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
