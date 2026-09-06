import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useLanguage } from '~/contexts/LanguageContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  return (
    <>
      <CustomInput
        label={t('email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none" />
      

      <View className="mb-4 rounded-[18px] border border-emerald-500/30 bg-emerald-950/40 p-4">
        <Text className="mb-1 text-sm font-bold text-emerald-300">{t('resetPassword')}</Text>
        <Text className="text-[12.5px] leading-5 text-emerald-400/90">
          Enter your registered email address to receive a secure one-time verification code.
        </Text>
      </View>

      <CustomButton
        title={t('sendResetLink')}
        variant="primary"
        onPress={() => router.push('./verify')} />

      <CustomButton
        title={t('backToLogin')}
        variant="secondary"
        className="mt-3"
        onPress={() => router.replace('./login')} />
    </>);
}
