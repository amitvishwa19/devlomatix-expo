import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'devlomatix.notifications';
const MAX_NOTIFICATIONS = 50;

const NotificationStoreContext = createContext(null);

export function NotificationStoreProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setNotifications(parsed);
        } catch (_) {}
      })
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback((items) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const addNotification = useCallback(
    (notification = {}) => {
      const entry = {
        id: notification.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        module: notification.module || 'crm',
        title: notification.title || 'New notification',
        description: notification.description || '',
        icon: notification.icon || 'notifications',
        color: notification.color || '#6b7280',
        time: notification.time || new Date().toISOString(),
        read: false,
        route: notification.route || null,
        data: notification.data || null,
        dedupeKey: notification.dedupeKey || null,
      };

      setNotifications((prev) => {
        if (
          entry.dedupeKey &&
          prev.some((item) => item.dedupeKey && item.dedupeKey === entry.dedupeKey)
        ) {
          return prev;
        }
        const next = [entry, ...prev].slice(0, MAX_NOTIFICATIONS);
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
