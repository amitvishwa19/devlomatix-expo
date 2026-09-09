import { Stack } from 'expo-router';
import { CurexaDrawerProvider } from './_components/CurexaDrawer';

export default function CurexaModuleLayout() {
  return (
    <CurexaDrawerProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="beds" />
        <Stack.Screen name="pharmacy" />
        <Stack.Screen name="laboratory" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="departments" />
        <Stack.Screen name="crm" />
      </Stack>
    </CurexaDrawerProvider>
  );
}
