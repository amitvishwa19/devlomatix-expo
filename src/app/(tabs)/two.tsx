import { Text, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl shadow-slate-900/10">
        <Text className="text-center text-3xl font-bold text-slate-900">Tab Two</Text>
        <View className="my-6 h-px bg-slate-200" />
        <Text className="text-center text-[15px] leading-6 text-slate-600">
          Legacy starter screen retained for reference.
        </Text>
      </View>
    </View>
  );
}
