import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function ModalScreen() {
  const { palette } = useAppTheme();

  return (
    <View className={`flex-1 items-center justify-center px-6 ${palette.page}`}>
      <View className={`w-full max-w-sm rounded-[28px] p-6 ${palette.surface}`}>
        <Text className={`text-center text-3xl font-bold ${palette.text}`}>Modal</Text>
        <View className={`my-6 h-px ${palette.border}`} />
        <Text className={`text-center text-[15px] leading-6 ${palette.textSoft}`}>
          This modal is part of the UI preview. Replace it with product details or contextual actions.
        </Text>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? palette.statusBar : 'auto'} />
    </View>
  );
}
