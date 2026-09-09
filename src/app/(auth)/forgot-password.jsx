import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <>
      <CustomInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="name@company.com"
        keyboardType="email-address"
        autoCapitalize="none" />
      

      <View className="mb-4 rounded-[18px] bg-sky-50 p-4">
        <Text className="mb-1.5 text-sm font-bold text-slate-900">Recovery preview</Text>
        <Text className="text-[13px] leading-5 text-slate-600">
          This screen is UI only. Continue to the OTP verification screen to preview the next step.
        </Text>
      </View>

      <CustomButton
        title="Send code"
        variant="primary"
        onPress={() => router.push('./verify')} />

      <CustomButton
        title="Back to sign in"
        variant="secondary"
        className="mt-3"
        onPress={() => router.replace('./login')} />
    </>);

}
