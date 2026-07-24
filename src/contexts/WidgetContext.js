import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'devlomatix.widgets';

const DEFAULT_WIDGETS = {
  solarbright: true,
  curexa: true,
  konnectx: true,
  crystalaura: true,
};

const WidgetContext = createContext(null);

export function WidgetProvider({ children }) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWidgets((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
      setIsReady(true);
    });
  }, []);

  const toggleWidget = useCallback((key) => {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAll = useCallback((enabled) => {
    const next = Object.keys(DEFAULT_WIDGETS).reduce((acc, k) => ({ ...acc, [k]: enabled }), {});
    setWidgets(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return (
    <WidgetContext.Provider value={{ widgets, toggleWidget, setAll, isReady }}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidgets must be used within WidgetProvider');
  return ctx;
}
