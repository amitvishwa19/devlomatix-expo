import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

/**
 * Settings has moved to the primary CRM module:
 * src/app/(modules)/crm/settings/index.jsx
 * 
 * This screen redirects any legacy navigation to the unified CRM settings.
 */
export default function LegacySettingsRedirect() {
  const router = useRouter();
  const { palette } = useAppTheme();

  useEffect(() => {
    router.replace('/(modules)/crm/settings');
  }, [router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: palette?.colors?.page || '#ffffff' }}
    >
      <ActivityIndicator size="small" color={palette?.colors?.primary || '#4f46e5'} />
    </View>
  );
}
