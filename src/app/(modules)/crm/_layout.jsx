import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { CrmProvider } from '~/providers/CrmProvider';
import { CrmDrawerProvider } from './_components/CrmDrawer';
import { getSession } from '~/utils/authStorage';

export default function CrmRootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const session = await getSession();
      if (!isMounted) return;

      if (!session?.isLoggedIn) {
        router.replace('/(auth)/login');
        return;
      }
      setIsReady(true);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isReady) {
    return null;
  }

  return (
    <CrmProvider>
      <CrmDrawerProvider>
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
      </CrmDrawerProvider>
    </CrmProvider>
  );
}
