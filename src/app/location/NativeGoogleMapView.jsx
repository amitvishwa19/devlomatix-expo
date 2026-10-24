import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';

// Dark Mode Map Style JSON for Google Maps Native SDK
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#021019' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255463' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

/**
 * NativeGoogleMapView: 100% Native Google Maps (react-native-maps + PROVIDER_GOOGLE)
 *
 * Renders hardware-accelerated 60fps native Google Maps with native gestures,
 * all team members with walking/driving icons & email badges, and multi-user route polylines.
 */
const NativeGoogleMapView = forwardRef(function NativeGoogleMapView(
  {
    points = [],
    currentLocation = null,
    teamUsers = [],
    selectedUserId = 'all',
    onSelectUser = null,
    isDark = false,
    isTracking = false,
    mapType = 'roadmap', // 'roadmap' | 'satellite' | 'terrain'
    colors = {},
  },
  ref
) {
  const mapRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const hasAutoFittedRef = useRef(false);

  const coords = points.map((p) => ({
    latitude: Number(p.lat),
    longitude: Number(p.lng),
  }));

  // Initial region centered on user or team members
  const initialLat =
    currentLocation?.lat ||
    (teamUsers[0]?.latestLocation?.lat ? Number(teamUsers[0].latestLocation.lat) : null) ||
    (points.length ? Number(points[0].lat) : 22.3404);

  const initialLng =
    currentLocation?.lng ||
    (teamUsers[0]?.latestLocation?.lng ? Number(teamUsers[0].latestLocation.lng) : null) ||
    (points.length ? Number(points[0].lng) : 73.2257);

  const initialRegion = {
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (mapRef.current && currentLocation) {
        isUserInteractingRef.current = false;
        mapRef.current.animateToRegion(
          {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500
        );
      }
    },
    centerOnCoords: (lat, lng) => {
      if (mapRef.current) {
        isUserInteractingRef.current = false;
        mapRef.current.animateToRegion(
          {
            latitude: Number(lat),
            longitude: Number(lng),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500
        );
      }
    },
    fitTrail: () => {
      if (mapRef.current && coords.length > 1) {
        isUserInteractingRef.current = false;
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
          animated: true,
        });
      }
    },
    fitAllUsers: () => {
      if (mapRef.current) {
        const userCoords = teamUsers
          .filter((u) => u.latestLocation?.lat && u.latestLocation?.lng)
          .map((u) => ({
            latitude: Number(u.latestLocation.lat),
            longitude: Number(u.latestLocation.lng),
          }));
        if (userCoords.length > 0) {
          isUserInteractingRef.current = false;
          mapRef.current.fitToCoordinates(userCoords, {
            edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
            animated: true,
          });
        }
      }
    },
  }));

  // Auto-fit bounds on initial load of team members or points
  useEffect(() => {
    if (!hasAutoFittedRef.current && !isUserInteractingRef.current) {
      const userCoords = teamUsers
        .filter((u) => u.latestLocation?.lat && u.latestLocation?.lng)
        .map((u) => ({
          latitude: Number(u.latestLocation.lat),
          longitude: Number(u.latestLocation.lng),
        }));

      if (userCoords.length > 1) {
        hasAutoFittedRef.current = true;
        const timer = setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(userCoords, {
              edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
              animated: true,
            });
          }
        }, 700);
        return () => clearTimeout(timer);
      } else if (coords.length > 1) {
        hasAutoFittedRef.current = true;
        const timer = setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
              animated: true,
            });
          }
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [teamUsers.length, coords.length]);

  // Convert mapType to react-native-maps format
  const nativeMapType =
    mapType === 'satellite'
      ? 'hybrid'
      : mapType === 'terrain'
      ? 'terrain'
      : 'standard';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        mapType={nativeMapType}
        customMapStyle={isDark && nativeMapType === 'standard' ? GOOGLE_MAPS_DARK_STYLE : []}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsIndoors={true}
        showsTraffic={false}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary || '#0284c7'}
        loadingBackgroundColor={isDark ? '#090d16' : '#f8fafc'}
        onTouchStart={() => {
          isUserInteractingRef.current = true;
        }}
        onPanDrag={() => {
          isUserInteractingRef.current = true;
        }}
      >
        {/* Glow Outline for Selected User Trail */}
        {coords.length > 1 && (
          <Polyline
            coordinates={coords}
            strokeColor="#38bdf8"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}

        {/* Core Movement Trail for Selected User */}
        {coords.length > 1 && (
          <Polyline
            coordinates={coords}
            strokeColor="#0284c7"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            zIndex={3}
          />
        )}

        {/* ── Organization Team Members (Walking/Driving Icons + Email Badges) ── */}
        {teamUsers.map((user) => {
          if (!user.latestLocation?.lat || !user.latestLocation?.lng) return null;
          const isDriving = Boolean(user.isDriving || (user.speed >= 2.5));
          const userColor = user.color || '#0284c7';
          const speedKmH = user.speedKmH !== undefined ? user.speedKmH : Math.round((user.speed || 0) * 3.6);

          return (
            <React.Fragment key={user.id}>
              {/* User Trail Polyline if available */}
              {user.trail && user.trail.length > 1 && (
                <Polyline
                  coordinates={user.trail.map((p) => ({
                    latitude: Number(p.lat),
                    longitude: Number(p.lng),
                  }))}
                  strokeColor={userColor}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                  zIndex={user.isCurrent ? 4 : 2}
                />
              )}

              {/* User Marker with Email & Human/Vehicle Icon */}
              <Marker
                coordinate={{
                  latitude: Number(user.latestLocation.lat),
                  longitude: Number(user.latestLocation.lng),
                }}
                title={user.name}
                description={`${user.email} • ${speedKmH} km/h • ${isDriving ? 'Driving' : 'Walking'}`}
                zIndex={user.isCurrent ? 25 : 15}
                onPress={() => onSelectUser && onSelectUser(user.id)}
              >
                <View style={styles.markerContainer}>
                  {/* Email & Device Pill Badge */}
                  <View style={[styles.emailPill, { borderColor: userColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: userColor }]} />
                    <Text style={styles.emailText} numberOfLines={1}>
                      {user.email}
                    </Text>
                    <View style={styles.deviceBadge}>
                      <Text style={styles.deviceText}>
                        {user.platform === 'mobile' ? '📱 Mobile' : '💻 Web'}
                      </Text>
                    </View>
                  </View>

                  {/* Icon Circle (Human Walking vs Vehicle Driving) */}
                  <View style={[styles.iconCircle, { backgroundColor: userColor }]}>
                    <Ionicons
                      name={isDriving ? 'car' : 'walk'}
                      size={17}
                      color="#ffffff"
                    />
                    {/* Speed Badge */}
                    <View style={styles.speedBadge}>
                      <Text style={styles.speedText}>{speedKmH}km/h</Text>
                    </View>
                  </View>

                  {/* Anchor Tip */}
                  <View style={[styles.anchorTip, { borderTopColor: userColor }]} />
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>
    </View>
  );
});

export default NativeGoogleMapView;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1.5,
    marginBottom: 2,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  emailText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 4,
  },
  deviceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  deviceText: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  speedBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  speedText: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '800',
  },
  anchorTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: 5,
  },
});
