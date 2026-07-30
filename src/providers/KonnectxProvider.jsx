import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSession } from '~/utils/authStorage';
import * as credentialsService from '~/services/konnectx/credentials';

const KonnectxContext = createContext(null);

export function KonnectxProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const defaultCred = list.find((c) => c.isDefault) ?? list[0] ?? null;
      if (defaultCred && !selectedCredential) {
        setSelectedCredential(defaultCred);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedCredential]);

  useEffect(() => {
    refreshCredentials();
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
