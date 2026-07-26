import { createContext, useContext, useEffect, useState } from 'react';
import { getSession } from '~/utils/authStorage';

const CrystalAuraContext = createContext(null);

export function CrystalAuraProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getSession();
        if (session?.user?.userId) {
          setUserId(session.user.userId);
        }
      } catch (err) {
        console.error('Failed to load user session in CrystalAuraProvider', err);
      }
    }
    loadUser();
  }, []);

  const value = {
    userId,
    isLoading
  };

  return (
    <CrystalAuraContext.Provider value={value}>
      {children}
    </CrystalAuraContext.Provider>
  );
}

export function useCrystalAura() {
  const context = useContext(CrystalAuraContext);
  if (!context) {
    throw new Error('useCrystalAura must be used within CrystalAuraProvider');
  }
  return context;
}
