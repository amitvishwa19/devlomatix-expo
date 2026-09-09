import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxEntryIndex() {
  const { palette } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const val = await AsyncStorage.getItem('devlomatix.kabadx_onboarded');
        setIsOnboarded(val === 'true');
      } catch (e) {
        setIsOnboarded(false);
      } finally {
        setLoading(false);
      }
    }
    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${palette.page}`}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <Redirect href="/(modules)/kabadx/(misc)/onboarding" />;
  }

  return <Redirect href="/(modules)/kabadx/(tabs)" />;
}
