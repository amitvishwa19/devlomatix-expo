import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, Text, Platform, UIManager } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import WebGoogleMapView from './WebGoogleMapView';

// Safe check to verify if native AIRMap is compiled into the current app runtime
function isNativeAirMapAvailable() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  try {
    if (typeof UIManager?.hasViewManagerConfig === 'function') {
      return Boolean(UIManager.hasViewManagerConfig('AIRMap'));
    }
    if (typeof UIManager?.getViewManagerConfig === 'function') {
      return Boolean(UIManager.getViewManagerConfig('AIRMap'));
    }
  } catch {
    return false;
  }
  return false;
}

// React Error Boundary to catch any native Fabric/Paper view registry failures safely
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn(
      '[MapErrorBoundary] Native map view manager failed to mount. Falling back to WebView Google Maps:',
      error?.message
    );
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

// Lazy-require react-native-maps only when rendering the native component
let NativeMaps = null;
function getNativeMaps() {
  if (!NativeMaps) {
    try {
      NativeMaps = require('react-native-maps');
    } catch (e) {
      console.warn('[NativeGoogleMapView] react-native-maps package unavailable:', e?.message);
    }
  }
  return NativeMaps;
}

/**
 * NativeAirMapViewInternal: Hardware-accelerated native Google Maps view
 */
const NativeAirMapViewInternal = forwardRef(function NativeAirMapViewInternal(
  {
    points = [],
    currentLocation = null,
    currentUser = null,
    teamUsers = [],
    selectedUserId = 'all',
    onSelectUser = null,
    isDark = false,
    isTracking = false,
    mapType = 'roadmap',
    colors = {},
  },
  ref
) {
  const maps = getNativeMaps();
  if (!maps || !maps.default) {
    throw new Error('react-native-maps Native Module not available');
  }

  const MapView = maps.default;
  const Marker = maps.Marker;
  const Polyline = maps.Polyline;
  const PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;

  const mapRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const hasAutoFittedRef = useRef(false);

  const coords = points.map((p) => ({
    latitude: Number(p.lat),
    longitude: Number(p.lng),
  }));

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
    setMapType: () => {},
  }));

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

  const nativeMapType =
    mapType === 'satellite' ? 'hybrid' : mapType === 'terrain' ? 'terrain' : 'standard';

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

        {(() => {
          let allUsers = [...teamUsers];
          const hasCurrentInTeam = allUsers.some((u) => u.isCurrent);
          if (!hasCurrentInTeam && currentUser) {
            const cLat = currentLocation ? Number(currentLocation.lat) : (points.length ? Number(points[points.length - 1].lat) : null);
            const cLng = currentLocation ? Number(currentLocation.lng) : (points.length ? Number(points[points.length - 1].lng) : null);
            if (cLat != null && cLng != null) {
              const cSpeed = currentLocation?.speed || 0;
              allUsers.unshift({
                id: currentUser.id || 'current-user',
                name: currentUser.displayName || currentUser.name || 'You',
                email: currentUser.email || 'You',
                color: '#0284c7',
                isCurrent: true,
                platform: 'mobile',
                device: 'Mobile App',
                speed: cSpeed,
                speedKmH: Math.round(cSpeed * 3.6),
                isDriving: cSpeed >= 2.5,
                latestLocation: { lat: cLat, lng: cLng },
              });
            }
          } else if (hasCurrentInTeam && currentLocation && currentLocation.lat != null) {
            allUsers = allUsers.map((u) => {
              if (u.isCurrent) {
                const spd = currentLocation.speed !== undefined ? currentLocation.speed : u.speed;
                return {
                  ...u,
                  latestLocation: {
                    lat: Number(currentLocation.lat),
                    lng: Number(currentLocation.lng),
                  },
                  speed: spd,
                  speedKmH: spd !== undefined ? Math.round(spd * 3.6) : u.speedKmH,
                  isDriving: spd !== undefined ? spd >= 2.5 : u.isDriving,
                };
              }
              return u;
            });
          }

          return allUsers.map((user) => {
            if (!user.latestLocation?.lat || !user.latestLocation?.lng) return null;
          const isDriving = Boolean(user.isDriving || (user.speed >= 2.5));
          const userColor = user.color || '#0284c7';
          const speedKmH =
            user.speedKmH !== undefined ? user.speedKmH : Math.round((user.speed || 0) * 3.6);

          return (
            <React.Fragment key={user.id}>
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

                  <View style={[styles.iconCircle, { backgroundColor: userColor }]}>
                    <Ionicons name={isDriving ? 'car' : 'walk'} size={17} color="#ffffff" />
                    <View style={styles.speedBadge}>
                      <Text style={styles.speedText}>{speedKmH}km/h</Text>
                    </View>
                  </View>

                  <View style={[styles.anchorTip, { borderTopColor: userColor }]} />
                </View>
              </Marker>
            </React.Fragment>
          );
        });
      })()}
      </MapView>
    </View>
  );
});

/**
 * Universal NativeGoogleMapView
 *
 * Checks if native AIRMap is available in the current binary.
 * If available, renders native MapView with an ErrorBoundary.
 * If unavailable or if native linking fails, gracefully renders WebGoogleMapView.
 */
const NativeGoogleMapView = forwardRef(function NativeGoogleMapView(props, ref) {
  const [nativeFailed, setNativeFailed] = useState(() => !isNativeAirMapAvailable());

  if (nativeFailed) {
    return <WebGoogleMapView ref={ref} {...props} />;
  }

  return (
    <MapErrorBoundary
      fallback={<WebGoogleMapView ref={ref} {...props} />}
      onError={() => setNativeFailed(true)}
    >
      <NativeAirMapViewInternal ref={ref} {...props} />
    </MapErrorBoundary>
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
