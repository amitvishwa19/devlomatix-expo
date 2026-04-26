import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { storageKey } from '~/utils/constants';

const AUTH_SESSION_KEY = 'auth.session';

export async function saveSession(user) {
  if (!user) {
    throw new Error('Cannot save an empty user session');
  }

  const session = {
    isLoggedIn: true,
    user,
    accessToken: user.accessToken ?? null,
    refreshToken: user.refreshToken ?? null,
    savedAt: Date.now()
  };

  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  await SecureStore.setItemAsync(storageKey.ACCESSTOKEN, session.accessToken ?? '');

  return session;
}

export async function getSession() {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession);

    if (!parsedSession?.isLoggedIn || !parsedSession?.user) {
      await clearSession();
      return null;
    }

    if (!parsedSession.accessToken) {
      parsedSession.accessToken =
        (await SecureStore.getItemAsync(storageKey.ACCESSTOKEN)) || null;
    }

    return parsedSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function isLoggedIn() {
  const session = await getSession();
  return Boolean(session?.isLoggedIn);
}

export async function clearSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  await SecureStore.deleteItemAsync(storageKey.ACCESSTOKEN);
}
