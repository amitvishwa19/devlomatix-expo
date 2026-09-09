import { Stack } from 'expo-router';

export default function HireFlowRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="interviews" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="departments" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="[candidateId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
