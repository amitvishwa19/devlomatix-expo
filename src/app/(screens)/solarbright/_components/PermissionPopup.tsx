import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type PermissionPopupProps = {
  visible: boolean;
  title: string;
  description: string;
  icon: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  onClose: () => void;
};

export default function PermissionPopup({
  visible,
  title,
  description,
  icon,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel = 'Not now',
  onSecondaryPress,
  onClose,
}: PermissionPopupProps) {
  const { palette } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-slate-950/35 px-5" onPress={onClose}>
        <View className="flex-1 items-center justify-center">
          <Pressable
            className={`w-full max-w-sm overflow-hidden rounded-3xl ${palette.surface}`}
            onPress={() => {}}>
            <View className={`px-6 pb-5 pt-6 ${palette.amberSoft}`}>
              <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100" />
              <View className="absolute -left-8 bottom-0 h-16 w-16 rounded-full bg-white/50" />
              <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-500">
                <FontAwesome name={icon as never} size={24} color="#ffffff" />
              </View>
              <Text className={`mt-4 text-2xl font-bold ${palette.text}`}>{title}</Text>
              <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>{description}</Text>
            </View>

            <View className="px-6 pb-6 pt-5">
              <View className={`rounded-2xl border px-4 py-3 ${palette.border} ${palette.amberSoft}`}>
                <Text className="text-xs font-bold uppercase tracking-[1px] text-amber-700">
                  Permission required
                </Text>
                <Text className={`mt-1 text-sm leading-5 ${palette.textSoft}`}>
                  Continue after access is enabled for this device.
                </Text>
              </View>

              <Pressable
                className="mt-5 rounded-2xl bg-amber-500 px-4 py-4"
                onPress={onPrimaryPress}>
                <Text className="text-center text-sm font-bold text-white">{primaryLabel}</Text>
              </Pressable>

              <Pressable
                className={`mt-3 rounded-2xl border px-4 py-4 ${palette.secondaryButtonBorder} ${palette.surfaceInset}`}
                onPress={onSecondaryPress ?? onClose}>
                <Text className={`text-center text-sm font-bold ${palette.secondaryButtonText}`}>
                  {secondaryLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
