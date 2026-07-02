import { Stack } from 'expo-router';

import { KonnectxProvider } from '~/providers/KonnectxProvider';

export default function KonnectxRootLayout() {
  return (
    <KonnectxProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="template/index" />
        <Stack.Screen name="analytics/index" />
        <Stack.Screen name="quick-message/index" />
        <Stack.Screen name="chatbot/index" />
        <Stack.Screen name="flows/index" />
      </Stack>
    </KonnectxProvider>
  );
}
