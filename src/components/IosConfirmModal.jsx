import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function IosConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = 'Delete Item?',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
}) {
  const { palette } = useAppTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[320px] overflow-hidden rounded-[20px] bg-white shadow-2xl"
          style={{ backgroundColor: palette.isDark ? '#1e293b' : '#ffffff' }}
        >
          {/* Header & Body */}
          <View className="px-5 pt-5 pb-4 items-center">
            <Text className={`text-center text-[16px] font-bold ${palette.text}`}>
              {title}
            </Text>
            {message ? (
              <Text className={`mt-1 text-center text-[12px] leading-4 ${palette.textSoft}`}>
                {message}
              </Text>
            ) : null}
          </View>

          {/* iOS Style Action Buttons */}
          <View className="flex-row border-t border-slate-200/80" style={{ borderColor: palette.isDark ? '#334155' : '#e2e8f0' }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center py-3 border-r border-slate-200/80"
              style={{ borderColor: palette.isDark ? '#334155' : '#e2e8f0' }}
            >
              <Text className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onConfirm?.();
                onClose?.();
              }}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center py-3"
            >
              <Text
                className={`text-[14px] font-bold ${
                  isDestructive ? 'text-rose-600' : 'text-sky-600'
                }`}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
