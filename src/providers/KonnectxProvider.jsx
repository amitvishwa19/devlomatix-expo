import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession } from '~/utils/authStorage';
import * as credentialsService from '~/services/konnectx/credentials';
import konnectxClient, { setClientCredential } from '~/services/konnectx/client';
import { useUniversalLoader } from '~/providers/UniversalLoaderProvider';

const SELECTED_CRED_KEY = '@konnectx_selected_credential_id';

const KonnectxContext = createContext(null);

export function KonnectxProvider({ children }) {
  const { showLoader } = useUniversalLoader();
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredentialState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const selectedRef = useRef(null);

  const setSelectedCredential = useCallback((cred) => {
    if (cred) {
      const isDifferent = String(cred.id || cred._id || '') !== String(selectedRef.current?.id || selectedRef.current?._id || '');
      if (selectedRef.current && isDifferent) {
        showLoader(`Switching to ${cred.profile || 'WhatsApp Account'}...`);
      }
      selectedRef.current = cred;
    }
    setSelectedCredentialState(cred);
    setClientCredential(cred);
    if (cred?.id || cred?._id) {
      const credId = cred.id || cred._id;
      AsyncStorage.setItem(SELECTED_CRED_KEY, String(credId)).catch(() => {});
      if (userId) {
        credentialsService.setDefaultCredential(userId, credId).catch((e) => {
          console.warn('Failed to update default credential on server:', e?.message);
        });
      }
    }
  }, [userId, showLoader]);

  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getSession();
        const u = session?.user;
        const uid = u?.userId || u?.id || u?._id || u?.sub;
        if (uid) {
          setUserId(uid);
        }
      } catch (err) {
        console.error('Failed to load user session in KonnectxProvider', err);
      }
    }
    loadUser();
  }, []);

  const refreshCredentials = useCallback(async () => {
    let resolvedId = userId;
    if (!resolvedId) {
      const session = await getSession();
      const u = session?.user;
      resolvedId = u?.userId || u?.id || u?._id || u?.sub;
    }
    if (!resolvedId) return;
    try {
      setIsLoading(true);
      setError(null);
      const creds = await credentialsService.getCredentials(resolvedId);
      const list = Array.isArray(creds) ? creds : creds?.credentials ?? [];
      setCredentials(list);

      const savedCredId = await AsyncStorage.getItem(SELECTED_CRED_KEY).catch(() => null);
      let targetCred = null;
      if (savedCredId) {
        targetCred = list.find((c) => String(c.id || c._id) === String(savedCredId));
      }
      if (!targetCred) {
        targetCred = list.find((c) => c.isDefault) ?? list[0] ?? null;
      }

      if (targetCred) {
        setSelectedCredential(targetCred);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setSelectedCredential]);

  useEffect(() => {
    if (userId) {
      refreshCredentials();
    }
  }, [userId, refreshCredentials]);

  const value = {
    userId,
    credentials,
    selectedCredential,
    setSelectedCredential,
    refreshCredentials,
    isLoading,
    error
  };

  return (
    <KonnectxContext.Provider value={value}>
      {children}
    </KonnectxContext.Provider>
  );
}

export function useKonnectx() {
  const context = useContext(KonnectxContext);
  if (!context) {
    throw new Error('useKonnectx must be used within KonnectxProvider');
  }
  return context;
}
