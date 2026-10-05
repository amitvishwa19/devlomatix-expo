import React from 'react';
import { Stack } from 'expo-router';
import { CrmProvider } from '~/providers/CrmProvider';

export default function CrmRootLayout() {
  return (
    <CrmProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="deals/[dealId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="contacts/[contactId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="accounts/[accountId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="analytics/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </CrmProvider>
  );
}
