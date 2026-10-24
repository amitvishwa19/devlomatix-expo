import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import { AppState, Platform } from 'react-native';
import { haversineMeters, dailySessionId } from '~/utils/geoUtils';
import { logLocationPoint } from '~/services/location';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_DISTANCE_METERS = 10;         // Only record if user moved ≥ 10 m
const FOREGROUND_INTERVAL_MS = 5000;    // Poll every 5 s in foreground
const BACKGROUND_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

// ─── Background Task Definition ───────────────────────────────────────────────
// In environments where expo-task-manager native module isn't compiled into the dev client
// or when running Expo Go, gracefully handle missing native module.
let TaskManager = null;
try {
  TaskManager = require('expo-task-manager');
} catch (e) {
  // Native module not linked in current binary
  TaskManager = null;
}

if (TaskManager && typeof TaskManager.defineTask === 'function') {
  try {
    TaskManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.warn('[BG_LOCATION_TASK] Error:', error.message);
        return;
      }
      if (data?.locations?.length) {
        const loc = data.locations[data.locations.length - 1];
        await logLocationPoint({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          altitude: loc.coords.altitude,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
          sessionId: dailySessionId(),
          timestamp: new Date(loc.timestamp).toISOString(),
        });
      }
    });
  } catch (err) {
    console.warn('[BG_LOCATION_TASK] defineTask failed:', err?.message);
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [trail, setTrail] = useState([]);                   // [{lat, lng, timestamp}]
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [hasBgPermission, setHasBgPermission] = useState(false);

  const lastRecordedRef = useRef(null);   // last point we actually persisted
  const watcherRef = useRef(null);        // foreground Location.watchPositionAsync subscription
  const appStateRef = useRef(AppState.currentState);

  // ── Request Permissions ─────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    try {
      const { status: fgStatus } =
        await Location.requestForegroundPermissionsAsync();
      const fg = fgStatus === 'granted';
      setHasPermission(fg);

      if (fg && TaskManager) {
        try {
          const { status: bgStatus } =
            await Location.requestBackgroundPermissionsAsync();
          const bg = bgStatus === 'granted';
          setHasBgPermission(bg);
          return { fg, bg };
        } catch (bgErr) {
          console.warn('[LOCATION] Background permission request skipped/failed:', bgErr?.message);
          setHasBgPermission(false);
          return { fg, bg: false };
        }
      }
      return { fg, bg: false };
    } catch (err) {
      console.warn('[LOCATION] Permission request failed:', err?.message);
      return { fg: false, bg: false };
    }
  }, []);

  // ── Record a point if distance threshold is met ─────────────────────────────
  const maybeRecord = useCallback(async (coords) => {
    const point = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      speed: coords.speed,
      heading: coords.heading,
      sessionId: dailySessionId(),
      timestamp: new Date().toISOString(),
    };

    const prev = lastRecordedRef.current;

    if (prev) {
      const dist = haversineMeters(prev, point);
      if (dist < MIN_DISTANCE_METERS) return;  // not far enough — skip
    }

    // Threshold passed (or first point): record
    lastRecordedRef.current = point;
    setCurrentLocation({ lat: point.lat, lng: point.lng });
    setTrail((t) => [...t, { lat: point.lat, lng: point.lng, timestamp: point.timestamp }]);

    // Fire-and-forget POST
    await logLocationPoint(point);
  }, []);

  // ── Start foreground watcher ─────────────────────────────────────────────────
  const startForegroundWatcher = useCallback(async () => {
    if (watcherRef.current) return;  // already watching

    try {
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: MIN_DISTANCE_METERS,  // OS-level pre-filter
          timeInterval: FOREGROUND_INTERVAL_MS,
        },
        (loc) => {
          maybeRecord(loc.coords);
        }
      );
      setIsTracking(true);
    } catch (err) {
      console.warn('[LOCATION] Failed to start foreground watcher:', err?.message);
    }
  }, [maybeRecord]);

  // ── Stop foreground watcher ──────────────────────────────────────────────────
  const stopForegroundWatcher = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  // ── Start background task ────────────────────────────────────────────────────
  const startBackgroundTracking = useCallback(async () => {
    if (!TaskManager) return;
    try {
      const isRegistered = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_TASK_NAME
      ).catch(() => false);

      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(BACKGROUND_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: MIN_DISTANCE_METERS,
          timeInterval: FOREGROUND_INTERVAL_MS,
          showsBackgroundLocationIndicator: true,     // iOS blue bar
          foregroundService: {                         // Android persistent notification
            notificationTitle: 'Devlomatix',
            notificationBody: 'Tracking your location',
            notificationColor: '#0284c7',
          },
          pausesUpdatesAutomatically: false,
        });
      }
    } catch (err) {
      console.warn('[LOCATION] Background tracking start failed:', err?.message);
    }
  }, []);

  // ── Stop background task ─────────────────────────────────────────────────────
  const stopBackgroundTracking = useCallback(async () => {
    if (!TaskManager) return;
    try {
      const isRegistered = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_TASK_NAME
      ).catch(() => false);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
      }
    } catch (err) {
      console.warn('[LOCATION] Background tracking stop failed:', err?.message);
    }
  }, []);

  // ── Main init: request perms → get initial point → start watchers ────────────
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { fg, bg } = await requestPermissions();
      if (!fg || !mounted) return;

      // Snapshot current position as first trail point
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (mounted) await maybeRecord(loc.coords);
      } catch (err) {
        console.warn('[LOCATION] Initial position failed:', err?.message);
      }

      if (!mounted) return;

      // Foreground watcher (handles when app is visible)
      await startForegroundWatcher();

      // Background task (handles when app is backgrounded / screen locked)
      if (bg && TaskManager) {
        await startBackgroundTracking();
      }
    })();

    return () => {
      mounted = false;
      stopForegroundWatcher();
      // NOTE: We deliberately do NOT stop the background task on unmount
      // because the provider lives for the app lifetime. Stop it on explicit
      // user action or app logout instead.
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle app foreground/background transitions ─────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev !== 'active' && nextState === 'active') {
        // App came to foreground — resume foreground watcher
        if (hasPermission) await startForegroundWatcher();
      } else if (prev === 'active' && nextState !== 'active') {
        // App went to background — pause foreground watcher only if background task takes over
        if (TaskManager && hasBgPermission) {
          stopForegroundWatcher();
          setIsTracking(false);
        }
      }
    });

    return () => sub.remove();
  }, [hasPermission, startForegroundWatcher, stopForegroundWatcher]);

  // ── Public API ───────────────────────────────────────────────────────────────
  const clearTrail = useCallback(() => {
    setTrail([]);
    lastRecordedRef.current = null;
  }, []);

  return (
    <LocationContext.Provider
      value={{
        trail,
        currentLocation,
        isTracking,
        hasPermission,
        hasBgPermission,
        clearTrail,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    return {
      trail: [],
      currentLocation: null,
      isTracking: false,
      hasPermission: false,
      hasBgPermission: false,
      clearTrail: () => {},
    };
  }
  return ctx;
}
