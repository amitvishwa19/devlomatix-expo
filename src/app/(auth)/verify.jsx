import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '~/contexts/LanguageContext';
import CustomButton from '../../components/CustomButton';

export default function VerifyScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [code, setCode] = useState('');

  return (
    <>
      <Text className="mb-2 text-xs font-semibold text-slate-200">{t('enterOtp')}</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor="#94a3b8"
        keyboardType="number-pad"
        maxLength={6}
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-center text-xl font-semibold text-slate-900 shadow-sm" />
      
      <View className="mb-5 mt-4 flex-row justify-between">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = code[index] ?? '';
          return (
            <View
              key={index}
              className="h-[52px] w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Text className="text-xl font-bold text-slate-900">{char}</Text>
            </View>);
        })}
      </View>

      <CustomButton
        title={t('verify')}
        variant="primary"
        onPress={() => router.replace('/(tabs)/home')} />

      <CustomButton
        title={t('backToLogin')}
        variant="secondary"
        className="mt-3"
        onPress={() => router.replace('./login')} />

      <Text className="mt-3.5 text-center text-[12.5px] leading-5 text-slate-400">
        Didn&apos;t receive anything? {t('resendCode')} in 00:21.
      </Text>
    </>);
}
