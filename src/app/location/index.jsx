import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppScreen from '~/components/AppScreen';
import CrmHeader from '../_components/CrmHeader';
import GoogleMapView from './GoogleMapView';
import { useLocation } from '~/providers/LocationProvider';
import { getLocationTrail, clearLocationTrail } from '~/services/location';
import { formatDistance, dailySessionId } from '~/utils/geoUtils';
import { useCrmTheme } from '~/utils/crm/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(points) {
  if (!points || points.length < 2) return '—';
  const ms = new Date(points[points.length - 1].timestamp) - new Date(points[0].timestamp);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function computeLiveDistance(trail) {
  if (!trail || trail.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinA = Math.sin(dLat / 2);
    const sinB = Math.sin(dLng / 2);
    const c = sinA * sinA + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinB * sinB;
    d += R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  }
  return d;
}

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function LocationMapScreen() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const {
    trail: liveTrail,
    currentLocation,
    isTracking,
    clearTrail: clearLocalTrail,
  } = useLocation();

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'live'
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'
  const [totalDistance, setTotalDistance] = useState(0);
  const mapRef = useRef(null);

  // ── Fetch persisted trail from backend ───────────────────────────────────────
  const fetchTrail = useCallback(async (date) => {
    setLoading(true);
    const data = await getLocationTrail({ date });
    setPoints(data.points || []);
    setTotalDistance(data.totalDistanceMeters || 0);
    setLoading(false);

    if (data.points?.length > 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitTrail();
      }, 600);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'today') {
      fetchTrail(selectedDate);
    }
  }, [selectedDate, viewMode, fetchTrail]);

  const displayPoints = viewMode === 'live' ? liveTrail : points;
  const currentDistance =
    viewMode === 'live' ? computeLiveDistance(liveTrail) : totalDistance;

  // ── Center on current position ───────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    mapRef.current?.centerOnUser();
  }, []);

  // ── Fit trail bounds ────────────────────────────────────────────────────────
  const fitTrail = useCallback(() => {
    mapRef.current?.fitTrail();
  }, []);

  // ── Clear trail ─────────────────────────────────────────────────────────────
  const handleClearTrail = useCallback(() => {
    Alert.alert(
      'Clear Movement Trail',
      `Are you sure you want to delete today's (${todayStr()}) GPS trail from the server?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Trail',
          style: 'destructive',
          onPress: async () => {
            await clearLocationTrail({ sessionId: dailySessionId() });
            clearLocalTrail();
            setPoints([]);
            setTotalDistance(0);
          },
        },
      ]
    );
  }, [clearLocalTrail]);

  return (
    <AppScreen>
      {/* ── 1. Top Executive Navigation Bar ── */}
      <CrmHeader
        title="Field Movement Map"
        subtitle={
          isTracking
            ? '● Live GPS Tracking Active (≥10m filter)'
            : 'Route History & Movement Trail'
        }
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={() => (viewMode === 'today' ? fetchTrail(selectedDate) : null)}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="refresh" size={15} color={colors.primary} />
            </Pressable>

            <Pressable
              onPress={handleClearTrail}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.dangerSoft || 'rgba(239, 68, 68, 0.1)',
                borderColor: colors.dangerBorder || 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
            </Pressable>
          </View>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* ── 2. Executive Metric Bento Cards ── */}
        <View className="flex-row items-center justify-between gap-x-2 mb-2.5">
          {/* Distance Card */}
          <View
            className="flex-1 rounded-[14px] border p-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Distance
              </Text>
              <Ionicons name="navigate-outline" size={13} color={colors.primary} />
            </View>
            <Text className="text-sm font-bold mt-1" style={{ color: colors.text }}>
              {formatDistance(currentDistance)}
            </Text>
          </View>

          {/* Points Card */}
          <View
            className="flex-1 rounded-[14px] border p-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Points
              </Text>
              <Ionicons name="location-outline" size={13} color="#10b981" />
            </View>
            <Text className="text-sm font-bold mt-1" style={{ color: colors.text }}>
              {displayPoints.length} pts
            </Text>
          </View>

          {/* Duration Card */}
          <View
            className="flex-1 rounded-[14px] border p-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Duration
              </Text>
              <Ionicons name="time-outline" size={13} color="#8b5cf6" />
            </View>
            <Text className="text-sm font-bold mt-1" style={{ color: colors.text }}>
              {formatDuration(displayPoints)}
            </Text>
          </View>

          {/* Status Card */}
          <View
            className="flex-1 rounded-[14px] border p-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Trigger
              </Text>
              <Ionicons name="speedometer-outline" size={13} color="#f59e0b" />
            </View>
            <Text className="text-sm font-bold mt-1" style={{ color: colors.text }}>
              ≥ 10m
            </Text>
          </View>
        </View>

        {/* ── 3. Filter & Map Controls Row ── */}
        <View className="flex-row items-center justify-between mb-2.5">
          {/* Mode Pill Toggle (Today vs Live) */}
          <View
            className="flex-row items-center rounded-xl border p-0.5"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => setViewMode('today')}
              className="px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: viewMode === 'today' ? colors.primary : 'transparent',
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: viewMode === 'today' ? '#ffffff' : colors.textSecondary }}
              >
                Today's Route
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode('live')}
              className="px-2.5 py-1 rounded-lg flex-row items-center gap-x-1"
              style={{
                backgroundColor: viewMode === 'live' ? colors.primary : 'transparent',
              }}
            >
              <View
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: viewMode === 'live' ? '#ffffff' : '#ef4444' }}
              />
              <Text
                className="text-[11px] font-bold"
                style={{ color: viewMode === 'live' ? '#ffffff' : colors.textSecondary }}
              >
                Live Trail
              </Text>
            </Pressable>
          </View>

          {/* Google Maps Layer Switcher */}
          <View
            className="flex-row items-center rounded-xl border p-0.5"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            {[
              { id: 'roadmap', label: 'Map' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'terrain', label: 'Terrain' },
            ].map((layer) => (
              <Pressable
                key={layer.id}
                onPress={() => setMapType(layer.id)}
                className="px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: mapType === layer.id ? colors.card : 'transparent',
                }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{
                    color: mapType === layer.id ? colors.primary : colors.textMuted,
                  }}
                >
                  {layer.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── 4. Main Google Map Canvas ── */}
        <View
          className="flex-1 rounded-[18px] border overflow-hidden relative shadow-sm"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          {loading && viewMode === 'today' ? (
            <View
              className="absolute inset-0 items-center justify-center z-10"
              style={{ backgroundColor: isDark ? 'rgba(9, 13, 22, 0.65)' : 'rgba(255, 255, 255, 0.65)' }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-xs font-semibold mt-2" style={{ color: colors.textSecondary }}>
                Loading Google Maps trail...
              </Text>
            </View>
          ) : null}

          <GoogleMapView
            ref={mapRef}
            points={displayPoints}
            currentLocation={currentLocation}
            isDark={isDark}
            isTracking={isTracking}
            mapType={mapType}
            colors={colors}
          />

          {/* Floating Action Controls on Map */}
          <View className="absolute right-3 bottom-3 flex-col items-center gap-y-2 z-20">
            {/* Fit Trail Bounds Button */}
            <TouchableOpacity
              onPress={fitTrail}
              className="h-10 w-10 items-center justify-center rounded-xl border shadow-sm active:opacity-80"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="scan-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            {/* Center on User Location Button */}
            <TouchableOpacity
              onPress={centerOnUser}
              className="h-11 w-11 items-center justify-center rounded-xl shadow-md active:opacity-80"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              <Ionicons name="locate" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. Telemetry Status Bar ── */}
        <View
          className="mt-2.5 mb-3 rounded-[14px] border p-2.5 flex-row items-center justify-between"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center gap-x-2">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: isTracking ? '#10b981' : '#f59e0b' }}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {currentLocation
                ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : 'Acquiring GPS fix...'}
            </Text>
          </View>

          <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
            {displayPoints.length > 0
              ? `Last point logged at ${new Date(displayPoints[displayPoints.length - 1].timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Auto-logging movement ≥ 10m'}
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}
