import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'devlomatix.notifications';
const MAX_NOTIFICATIONS = 50;

const SEED_NOTIFICATIONS = [
  { id: 'seed_1', module: 'konnectx', title: 'Campaign completed', description: 'Welcome offer sent to 1,240 contacts with 68% open rate.', icon: 'chatbubble-ellipses', color: '#0284c7', time: new Date(Date.now() - 600000).toISOString(), read: false },
  { id: 'seed_2', module: 'curexa', title: 'New appointment booked', description: 'Dr. Sharma confirmed for patient Priya Mehta at 4:30 PM.', icon: 'medkit', color: '#059669', time: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: 'seed_3', module: 'solarbright', title: 'Energy report ready', description: 'Monthly generation report for Jaipur installations is ready to view.', icon: 'flash', color: '#d97706', time: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'seed_4', module: 'crystalaura', title: 'Low stock alert', description: '3 products are running low on inventory across 2 stores.', icon: 'warning', color: '#9333ea', time: new Date(Date.now() - 7200000).toISOString(), read: true },
  { id: 'seed_5', module: 'konnectx', title: 'Template approved', description: 'Your "Order Confirmation" template was approved by Meta.', icon: 'document-text', color: '#0284c7', time: new Date(Date.now() - 14400000).toISOString(), read: true },
  { id: 'seed_6', module: 'curexa', title: 'Prescription refill requested', description: 'Patient Amit Verma requested a refill for blood pressure medication.', icon: 'medkit', color: '#059669', time: new Date(Date.now() - 28800000).toISOString(), read: true },
];

const NotificationStoreContext = createContext(null);

export function NotificationStoreProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n) => !n.read).length);
          setIsReady(true);
          return;
        } catch {}
      }
      setNotifications(SEED_NOTIFICATIONS);
      setUnreadCount(SEED_NOTIFICATIONS.filter((n) => !n.read).length);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      setIsReady(true);
    });
  }, []);

  const persist = useCallback((items) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addNotification = useCallback((notification) => {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      module: notification.module,
      title: notification.title,
      description: notification.description || '',
      icon: notification.icon || 'notifications',
      color: notification.color || '#6b7280',
      time: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      const next = [entry, ...prev].slice(0, MAX_NOTIFICATIONS);
      persist(next);
      return next;
    });
    setUnreadCount((prev) => prev + 1);
  }, [persist]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(next);
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [persist]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persist(next);
      return next;
    });
    setUnreadCount(0);
  }, [persist]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    persist([]);
  }, [persist]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      const next = prev.filter((n) => n.id !== id);
      persist(next);
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [persist]);

  return (
    <NotificationStoreContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll, removeNotification, isReady }}
    >
      {children}
    </NotificationStoreContext.Provider>
  );
}

export function useNotificationStore() {
  const ctx = useContext(NotificationStoreContext);
  if (!ctx) throw new Error('useNotificationStore must be used within NotificationStoreProvider');
  return ctx;
}
