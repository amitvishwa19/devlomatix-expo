import { Stack } from 'expo-router';
import { CurexaDrawerProvider } from './_components/CurexaDrawer';
import { CurexaProvider } from '~/providers/CurexaProvider';

export default function CurexaModuleLayout() {
  return (
    <CurexaProvider>
      <CurexaDrawerProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="beds" />
          <Stack.Screen name="pharmacy" />
          <Stack.Screen name="laboratory" />
          <Stack.Screen name="billing" />
          <Stack.Screen name="departments" />
          <Stack.Screen name="prescriptions" />
          <Stack.Screen name="workflow" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="crm" />
        </Stack>
      </CurexaDrawerProvider>
    </CurexaProvider>
  );
}
