import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import * as credentialsService from '~/services/konnectx/credentials';

const KonnectxContext = createContext(null);

export function KonnectxProvider({ children }) {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const creds = await credentialsService.getCredentials();
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
  }, [selectedCredential]);

  const value = {
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
