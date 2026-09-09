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
        <Stack.Screen name="auto-responder/index" />
        <Stack.Screen name="business-profile/index" />
        <Stack.Screen name="click-to-chat/index" />
        <Stack.Screen name="system/index" />
      </Stack>
    </KonnectxProvider>
  );
}
