import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppTheme } from '~/theme/AppTheme';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [email, setEmail] = useState('');

  const iconColor = isDark ? '#64748b' : '#94a3b8';
  const infoBg = isDark ? 'rgba(99,102,241,0.12)' : 'rgba(37,99,235,0.06)';
  const infoBorder = isDark ? 'rgba(99,102,241,0.3)' : 'rgba(37,99,235,0.18)';
  const infoTitle = isDark ? '#818cf8' : '#2563eb';
  const infoText = isDark ? '#94a3b8' : '#64748b';

  return (
    <>
      <CustomInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="name@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={<FontAwesome name="envelope-o" size={14} color={iconColor} />}
      />

      <View style={{
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: infoBg,
        borderWidth: 1,
        borderColor: infoBorder,
        padding: 14,
      }}>
        <Text style={{ marginBottom: 4, fontSize: 12, fontWeight: '700', color: infoTitle }}>
          Recovery email
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: infoText }}>
          We'll send a verification code to this email. Check your inbox and follow the instructions.
        </Text>
      </View>

      <CustomButton
        title="Send code"
        variant="primary"
        style={{ marginBottom: 10 }}
        onPress={() => router.push('./verify')}
      />

      <CustomButton
        title="Back to sign in"
        variant="secondary"
        onPress={() => router.replace('./login')}
      />
    </>
  );
}
