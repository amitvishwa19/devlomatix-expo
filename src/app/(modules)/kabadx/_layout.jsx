import { Stack } from 'expo-router';
import { KabadxProvider } from '~/providers/KabadxProvider';

export default function KabadxLayout() {
  return (
    <KabadxProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(misc)/onboarding" />
      </Stack>
    </KabadxProvider>
  );
}
