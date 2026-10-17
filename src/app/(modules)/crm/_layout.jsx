import React from 'react';
import { Stack } from 'expo-router';
import { CrmProvider } from '~/providers/CrmProvider';

export default function CrmRootLayout() {
  return (
    <CrmProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/[chatId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="deals/[dealId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="contacts/[contactId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="accounts/[accountId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="analytics/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dcr/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="quotations/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="quotations/new" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="quotations/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="candidates/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="candidates/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </CrmProvider>
  );
}
