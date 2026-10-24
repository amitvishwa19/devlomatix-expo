import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppScreen from '~/components/AppScreen';
import CrmHeader from '../_components/CrmHeader';
import NativeGoogleMapView from './NativeGoogleMapView';
import { useLocation } from '~/providers/LocationProvider';
import { getLocationTrail, clearLocationTrail, getTeamLocations } from '~/services/location';
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
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'live'
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'
  const [totalDistance, setTotalDistance] = useState(0);
  const mapRef = useRef(null);

  // ── Fetch team members and their latest locations ──────────────────────────
  const fetchTeam = useCallback(async () => {
    try {
      const data = await getTeamLocations();
      if (Array.isArray(data.users)) {
        setTeamUsers(data.users);
      }
    } catch (e) {
      console.warn('[MAP_TEAM_FETCH_FAILED]', e);
    }
  }, []);

  // ── Fetch persisted trail from backend ───────────────────────────────────────
  const fetchTrail = useCallback(async (date, targetUserId = null) => {
    setLoading(true);
    const params = { date };
    if (targetUserId && targetUserId !== 'all') {
      params.userId = targetUserId;
    }
    const data = await getLocationTrail(params);
    setPoints(data.points || []);
    setTotalDistance(data.totalDistanceMeters || 0);
    setLoading(false);

    if (data.points?.length > 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitTrail();
      }, 600);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (viewMode === 'today') {
      fetchTrail(selectedDate, selectedUserId);
    }
  }, [selectedDate, viewMode, selectedUserId, fetchTrail]);

  const displayPoints = viewMode === 'live' ? liveTrail : points;
  const currentDistance =
    viewMode === 'live' ? computeLiveDistance(liveTrail) : totalDistance;

  // ── Handle Team Member Selection ───────────────────────────────────────────
  const handleSelectUser = useCallback(
    (userId) => {
      setSelectedUserId(userId);
      if (userId === 'all') {
        mapRef.current?.fitAllUsers?.();
      } else {
        const u = teamUsers.find((user) => user.id === userId);
        if (u?.latestLocation?.lat && u?.latestLocation?.lng) {
          mapRef.current?.centerOnCoords?.(
            Number(u.latestLocation.lat),
            Number(u.latestLocation.lng)
          );
        }
      }
    },
    [teamUsers]
  );

  // ── Center on current position ───────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    mapRef.current?.centerOnUser();
  }, []);

  // ── Fit trail / all users bounds ─────────────────────────────────────────────
  const fitTrail = useCallback(() => {
    if (selectedUserId === 'all') {
      mapRef.current?.fitAllUsers?.();
    } else {
      mapRef.current?.fitTrail?.();
    }
  }, [selectedUserId]);

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

  // Calculate driving vs walking counts
  const drivingCount = teamUsers.filter((u) => u.isDriving).length;
  const walkingCount = teamUsers.length - drivingCount;

  return (
    <AppScreen>
      {/* ── 1. Top Executive Navigation Bar ── */}
      <CrmHeader
        title="Field Movement Map"
        subtitle={
          teamUsers.length > 0
            ? `${teamUsers.length} Organization Users • ${drivingCount} Driving, ${walkingCount} Walking`
            : isTracking
            ? '● Live GPS Tracking Active'
            : 'Route History & Team Tracking'
        }
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={() => {
                fetchTeam();
                if (viewMode === 'today') fetchTrail(selectedDate, selectedUserId);
              }}
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
        <View className="flex-row items-center justify-between gap-x-2 mb-2">
          {/* Distance Card */}
          <View
            className="flex-1 rounded-[14px] border p-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Distance
              </Text>
              <Ionicons name="navigate-outline" size={12} color={colors.primary} />
            </View>
            <Text className="text-[13px] font-bold mt-0.5" style={{ color: colors.text }}>
              {formatDistance(currentDistance)}
            </Text>
          </View>

          {/* Points Card */}
          <View
            className="flex-1 rounded-[14px] border p-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Waypoints
              </Text>
              <Ionicons name="location-outline" size={12} color="#10b981" />
            </View>
            <Text className="text-[13px] font-bold mt-0.5" style={{ color: colors.text }}>
              {displayPoints.length} pts
            </Text>
          </View>

          {/* Org Users Card */}
          <View
            className="flex-1 rounded-[14px] border p-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Org Users
              </Text>
              <Ionicons name="people-outline" size={12} color="#8b5cf6" />
            </View>
            <Text className="text-[13px] font-bold mt-0.5" style={{ color: colors.text }}>
              {teamUsers.length || 4} Users
            </Text>
          </View>

          {/* Activity Breakdown Card */}
          <View
            className="flex-1 rounded-[14px] border p-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Fleet State
              </Text>
              <Ionicons name="speedometer-outline" size={12} color="#f59e0b" />
            </View>
            <Text className="text-[13px] font-bold mt-0.5" style={{ color: colors.text }}>
              {drivingCount} 🚗 / {walkingCount} 🚶
            </Text>
          </View>
        </View>

        {/* ── 3. Org Structure Team Member Selector Strip ── */}
        <View className="mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 1, gap: 6 }}
          >
            {/* "All (4)" chip */}
            <Pressable
              onPress={() => handleSelectUser('all')}
              className="flex-row items-center px-2.5 py-1.5 rounded-xl border active:opacity-80"
              style={{
                backgroundColor: selectedUserId === 'all' ? colors.primary : colors.card,
                borderColor: selectedUserId === 'all' ? colors.primary : colors.border,
              }}
            >
              <Ionicons
                name="globe-outline"
                size={13}
                color={selectedUserId === 'all' ? '#ffffff' : colors.textSecondary}
              />
              <Text
                className="text-[11px] font-bold ml-1.5"
                style={{ color: selectedUserId === 'all' ? '#ffffff' : colors.text }}
              >
                All Members ({teamUsers.length || 4})
              </Text>
            </Pressable>

            {/* Individual Team Member Chips */}
            {teamUsers.map((user) => {
              const isSelected = selectedUserId === user.id;
              const isDriving = Boolean(user.isDriving || (user.speed >= 2.5));
              const speedKmH = user.speedKmH !== undefined ? user.speedKmH : Math.round((user.speed || 0) * 3.6);
              const userColor = user.color || '#0284c7';

              return (
                <Pressable
                  key={user.id}
                  onPress={() => handleSelectUser(user.id)}
                  className="flex-row items-center px-2.5 py-1.5 rounded-xl border active:opacity-80"
                  style={{
                    backgroundColor: isSelected ? userColor : colors.card,
                    borderColor: isSelected ? userColor : colors.border,
                  }}
                >
                  {/* User Initial / Color Dot */}
                  <View
                    className="h-4 w-4 rounded-full items-center justify-center mr-1.5"
                    style={{ backgroundColor: isSelected ? '#ffffff' : userColor }}
                  >
                    <Text
                      className="text-[9px] font-extrabold"
                      style={{ color: isSelected ? userColor : '#ffffff' }}
                    >
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Text>
                  </View>

                  {/* User Email or Name */}
                  <Text
                    className="text-[11px] font-semibold mr-1.5 max-w-[110px]"
                    numberOfLines={1}
                    style={{ color: isSelected ? '#ffffff' : colors.text }}
                  >
                    {user.email ? user.email.split('@')[0] : user.name}
                  </Text>

                  {/* Device Indicator */}
                  <View
                    className="flex-row items-center px-1.5 py-0.5 rounded-md mr-1"
                    style={{
                      backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : colors.cardAlt,
                    }}
                  >
                    <Text
                      className="text-[9px] font-bold"
                      style={{ color: isSelected ? '#ffffff' : colors.textMuted }}
                    >
                      {user.platform === 'mobile' ? '📱 Mobile' : '💻 Web'}
                    </Text>
                  </View>

                  {/* Activity Icon: Walking vs Driving */}
                  <View
                    className="flex-row items-center px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : colors.cardAlt,
                    }}
                  >
                    <Ionicons
                      name={isDriving ? 'car' : 'walk'}
                      size={11}
                      color={isSelected ? '#ffffff' : isDriving ? '#38bdf8' : '#10b981'}
                    />
                    <Text
                      className="text-[9px] font-bold ml-0.5"
                      style={{
                        color: isSelected ? '#ffffff' : isDriving ? '#38bdf8' : '#10b981',
                      }}
                    >
                      {speedKmH}k
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 4. Filter & Map Layer Controls Row ── */}
        <View className="flex-row items-center justify-between mb-2">
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

        {/* ── 5. Main Google Map Canvas ── */}
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

          <NativeGoogleMapView
            ref={mapRef}
            points={displayPoints}
            currentLocation={currentLocation}
            teamUsers={teamUsers}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            isDark={isDark}
            isTracking={isTracking}
            mapType={mapType}
            colors={colors}
          />

          {/* Floating Action Controls on Map */}
          <View className="absolute right-3 bottom-3 flex-col items-center gap-y-2 z-20">
            {/* Fit Trail / All Users Button */}
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

        {/* ── 6. Telemetry Status Bar ── */}
        <View
          className="mt-2 mb-2.5 rounded-[14px] border p-2 flex-row items-center justify-between"
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
              {selectedUserId !== 'all'
                ? (() => {
                    const u = teamUsers.find((x) => x.id === selectedUserId);
                    return u
                      ? `${u.name} (${u.platform === 'mobile' ? '📱' : '💻'} ${u.isDriving ? '🚗 Drive' : '🚶 Walk'} • ${u.speedKmH || 0} km/h)`
                      : 'Focused User';
                  })()
                : currentLocation
                ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : `${teamUsers.length || 4} Org Members Active`}
            </Text>
          </View>

          <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
            {selectedUserId !== 'all'
              ? 'Tapped on user marker'
              : `${teamUsers.length || 4} users tracked • Auto-syncing`}
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}
