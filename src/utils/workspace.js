import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getSession } from '~/utils/authStorage';

/**
 * Resolves the active workspaceId from all potential storage locations and session contexts.
 * Caches the resolved workspaceId back to storage for fast subsequent resolution.
 */
export async function resolveWorkspaceId(providedWorkspaceId = null) {
  if (providedWorkspaceId) {
    try {
      await AsyncStorage.setItem('devlomatix.workspaceId', providedWorkspaceId);
      await SecureStore.setItemAsync('devlomatix.workspaceId', providedWorkspaceId);
    } catch {}
    return providedWorkspaceId;
  }

  try {
    // 1. Check SecureStore
    const secureWsId = await SecureStore.getItemAsync('devlomatix.workspaceId');
    if (secureWsId) return secureWsId;

    // 2. Check AsyncStorage
    const asyncWsId = await AsyncStorage.getItem('devlomatix.workspaceId');
    if (asyncWsId) return asyncWsId;

    // 3. Check auth.session via getSession()
    const session = await getSession();
    const sessionWsId =
      session?.user?.workspaceId ||
      session?.user?.currentWorkspace ||
      session?.user?.selectedServer ||
      (session?.user?.members?.length ? session.user.members[0]?.serverId : null) ||
      (session?.user?.workspaces?.length
        ? (session.user.workspaces.find((w) => w.default) || session.user.workspaces[0])?.id
        : null) ||
      (session?.user?.servers?.length
        ? (session.user.servers.find((s) => s.default) || session.user.servers[0])?.id
        : null);

    if (sessionWsId) {
      await AsyncStorage.setItem('devlomatix.workspaceId', sessionWsId);
      await SecureStore.setItemAsync('devlomatix.workspaceId', sessionWsId);
      return sessionWsId;
    }

    // 4. Check legacy devlomatix.session key
    const rawDevlomatixSession = await AsyncStorage.getItem('devlomatix.session');
    if (rawDevlomatixSession) {
      const devSession = JSON.parse(rawDevlomatixSession);
      const devWsId = devSession?.user?.workspaceId || devSession?.workspaceId;
      if (devWsId) {
        await AsyncStorage.setItem('devlomatix.workspaceId', devWsId);
        await SecureStore.setItemAsync('devlomatix.workspaceId', devWsId);
        return devWsId;
      }
    }

    // 5. Check legacy devlomatix.user key
    const rawUser = await AsyncStorage.getItem('devlomatix.user');
    if (rawUser) {
      const devUser = JSON.parse(rawUser);
      const userWsId = devUser?.workspaceId || devUser?.currentWorkspace;
      if (userWsId) {
        await AsyncStorage.setItem('devlomatix.workspaceId', userWsId);
        await SecureStore.setItemAsync('devlomatix.workspaceId', userWsId);
        return userWsId;
      }
    }
  } catch (e) {
    console.error('Error resolving workspace ID:', e);
  }

  return null;
}
