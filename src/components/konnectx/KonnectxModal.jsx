import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectxModal({ visible, onClose, title, children }) {
  const { palette } = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[20px] font-bold flex-1 ${palette.text}`}>{title}</Text>
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color={palette.textColor} />
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
