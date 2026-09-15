import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function CurexaEntryGate() {
  const { palette } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const value = await AsyncStorage.getItem('devlomatix.curexa_onboarded');
        setIsOnboarded(value === 'true');
      } catch (e) {
        setIsOnboarded(false);
      } finally {
        setLoading(false);
      }
    }
    checkOnboardingStatus();
  }, []);

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${palette.page}`}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <Redirect href="/(modules)/curexa/onboarding" />;
  }

  return <Redirect href="/(modules)/curexa/(tabs)" />;
}
