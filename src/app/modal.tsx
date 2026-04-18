import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <View className="w-full max-w-sm rounded-[28px] bg-slate-900 p-6">
        <Text className="text-center text-3xl font-bold text-slate-50">Modal</Text>
        <View className="my-6 h-px bg-white/10" />
        <Text className="text-center text-[15px] leading-6 text-slate-300">
          This modal is part of the UI preview. Replace it with product details or contextual actions.
        </Text>
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
