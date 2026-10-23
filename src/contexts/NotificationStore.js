import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  MAX_STORED_NOTIFICATIONS,
  NOTIFICATION_STORAGE_KEY,
  normalizeNotification,
  readStoredNotifications,
} from '~/utils/notificationStorage';

const NotificationStoreContext = createContext(null);

export function NotificationStoreProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    readStoredNotifications()
      .then((items) => setNotifications(items))
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      readStoredNotifications()
        .then((items) => setNotifications(items))
        .catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  const persist = useCallback((items) => {
    AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const addNotification = useCallback(
    (notification = {}) => {
      const entry = normalizeNotification(notification);

      setNotifications((prev) => {
        if (
          entry.dedupeKey &&
          prev.some((item) => item.dedupeKey && item.dedupeKey === entry.dedupeKey)
        ) {
          return prev;
        }
        const next = [entry, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markAsRead = useCallback(
    (id) => {
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persist(next);
      return next;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [persist]);

  const removeNotification = useCallback(
    (id) => {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationStoreContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        isReady,
      }}
    >
      {children}
    </NotificationStoreContext.Provider>
  );
}

export function useNotificationStore() {
  const ctx = useContext(NotificationStoreContext);
  if (!ctx) {
    throw new Error('useNotificationStore must be used within NotificationStoreProvider');
  }
  return ctx;
}
