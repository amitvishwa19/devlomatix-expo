import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = 'devlomatix.onboardingCompleted';

export async function hasCompletedOnboarding() {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function completeOnboarding() {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // ignore
  }
}

export async function resetOnboarding() {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
}
