import { Slot, useSegments } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import AppScreen from '~/components/AppScreen';
import BrandLogo from '~/components/BrandLogo';
import { useAppTheme } from '~/theme/AppTheme';

const authRouteCopy = {
  login: {
    badge: 'DEVLOMATIX COMMAND HUB',
    title: 'Welcome back',
    subtitle: 'Sign in to access your workspace and CRM dashboard.',
  },
  signup: {
    badge: 'GET STARTED',
    title: 'Create account',
    subtitle: 'Set up your workspace and start managing your pipeline.',
  },
  'forgot-password': {
    badge: 'RECOVERY',
    title: 'Reset password',
    subtitle: 'Enter your email to receive a verification code.',
  },
  verify: {
    badge: 'VERIFICATION',
    title: 'Confirm access',
    subtitle: 'Enter the six-digit code sent to your email.',
  },
};

export default function AuthLayout() {
  const segments = useSegments();
  const routeKey = segments[segments.length - 1];
  const copy = authRouteCopy[routeKey] ?? authRouteCopy.login;
  const { isDark } = useAppTheme();

  const cardBg = isDark ? 'rgba(10,18,32,0.92)' : 'rgba(255,255,255,0.95)';
  const cardBorder = isDark ? 'rgba(79,70,229,0.35)' : 'rgba(37,99,235,0.18)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subtitleColor = isDark ? '#64748b' : '#94a3b8';
  const badgeBg = isDark ? 'rgba(79,70,229,0.18)' : 'rgba(37,99,235,0.08)';
  const badgeBorder = isDark ? 'rgba(129,140,248,0.45)' : 'rgba(37,99,235,0.25)';
  const badgeText = isDark ? '#a5b4fc' : '#1d4ed8';
  const dotColor = isDark ? '#34d399' : '#10b981';
  const orb1 = isDark ? 'rgba(79,70,229,0.22)' : 'rgba(37,99,235,0.12)';
  const orb2 = isDark ? 'rgba(14,165,233,0.16)' : 'rgba(14,165,233,0.09)';
  const orb3 = isDark ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.07)';

  return (
    <AppScreen imageOpacity={isDark ? 0.35 : 0.55}>
      {/* ── Ambient gradient glow orbs (rendered over AppScreen canvas) ── */}
      <View style={{ position: 'absolute', top: -110, right: -70, width: 320, height: 320, borderRadius: 160, backgroundColor: orb1 }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: 60, left: -110, width: 280, height: 280, borderRadius: 140, backgroundColor: orb2 }} pointerEvents="none" />
      <View style={{ position: 'absolute', bottom: -90, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: orb3 }} pointerEvents="none" />
      <View style={{ position: 'absolute', bottom: 100, left: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: orb1 }} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Brand header ── */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <BrandLogo variant="auth" />

            {/* Live status badge */}
            <View style={{
              marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 24, backgroundColor: badgeBg,
              borderWidth: 1, borderColor: badgeBorder,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
              <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.8, color: badgeText }}>
                {copy.badge}
              </Text>
            </View>

            <Text style={{
              marginTop: 14, fontSize: 28, fontWeight: '800', color: titleColor,
              textAlign: 'center', letterSpacing: -0.5, lineHeight: 34,
            }}>
              {copy.title}
            </Text>
            <Text style={{
              marginTop: 8, fontSize: 13, lineHeight: 21, color: subtitleColor,
              textAlign: 'center', maxWidth: 260, fontWeight: '400',
            }}>
              {copy.subtitle}
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={{
            backgroundColor: cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: cardBorder,
            paddingHorizontal: 20,
            paddingVertical: 22,
            shadowColor: isDark ? '#3730a3' : '#1e40af',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: isDark ? 0.5 : 0.12,
            shadowRadius: 32,
            elevation: 12,
          }}>
            <Slot />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
