import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function VerifyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <>
      <Text className="mb-2 text-sm font-semibold text-slate-700">Verification code</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor="#94a3b8"
        keyboardType="number-pad"
        maxLength={6}
        className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-center text-xl font-semibold text-slate-900"
      />

      <View className="mb-5 mt-4 flex-row justify-between">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = code[index] ?? '';
          return (
            <View
              key={index}
              className="h-[52px] w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <Text className="text-xl font-bold text-slate-900">{char}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        className="h-12 items-center justify-center rounded-md bg-teal-700"
        onPress={() => router.replace('/home')}>
        <Text className="text-base font-bold text-slate-50">Verify and continue</Text>
      </Pressable>

      <Pressable
        className="mt-3 h-12 items-center justify-center rounded-md border border-slate-300 bg-slate-50"
        onPress={() => router.replace('./login')}>
        <Text className="text-base font-bold text-slate-900">Use another method</Text>
      </Pressable>

      <Text className="mt-3.5 text-center text-[13px] leading-5 text-slate-500">
        Didn&apos;t receive anything? Resend code in 00:21.
      </Text>
    </>
  );
}
