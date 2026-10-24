import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * WebGoogleMapView: 100% Reliable, Zero-Native-Dependency Google Maps
 *
 * Powered by Google Maps Tile Servers (Roadmap, Satellite Hybrid, and Terrain layers)
 * with Leaflet rendering in React Native WebView.
 *
 * Supports:
 * - 60fps hardware accelerated interactive pan/pinch/zoom gestures
 * - All team members with walking/driving icons, email & device badges, and speeds
 * - Interactive marker clicks that select team users
 * - Multi-user polylines with glowing trails
 * - Live Uber/Radar style pulsing beacon on user's current GPS location
 * - Smooth camera movements (fitTrail, fitAllUsers, centerOnUser, centerOnCoords)
 * - Roadmap, Satellite, and Terrain live layer switching
 * - Light and Dark theme styling
 */
const WebGoogleMapView = forwardRef(function WebGoogleMapView(
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
  const webViewRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Initial map center
  const initialLat =
    currentLocation?.lat ||
    (teamUsers[0]?.latestLocation?.lat ? Number(teamUsers[0].latestLocation.lat) : null) ||
    (points.length ? Number(points[0].lat) : 22.3404);

  const initialLng =
    currentLocation?.lng ||
    (teamUsers[0]?.latestLocation?.lng ? Number(teamUsers[0].latestLocation.lng) : null) ||
    (points.length ? Number(points[0].lng) : 73.2257);

  const initialZoom = points.length > 1 || teamUsers.length > 1 ? 14 : 15;

  // Imperative methods exposed to parent
  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (currentLocation && webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.centerOnCoords) { window.centerOnCoords(${currentLocation.lat}, ${currentLocation.lng}); } true;`
        );
      }
    },
    fitTrail: () => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.fitTrailBounds) { window.fitTrailBounds(); } true;`
        );
      }
    },
    fitAllUsers: () => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.fitAllUsersBounds) { window.fitAllUsersBounds(); } true;`
        );
      }
    },
    centerOnCoords: (lat, lng) => {
      if (webViewRef.current && lat != null && lng != null) {
        webViewRef.current.injectJavaScript(
          `if (window.centerOnCoords) { window.centerOnCoords(${lat}, ${lng}); } true;`
        );
      }
    },
    setMapType: (type) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.switchLayer) { window.switchLayer('${type}'); } true;`
        );
      }
    },
  }));

  // Update map layer whenever mapType changes
  useEffect(() => {
    if (loaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.switchLayer) { window.switchLayer('${mapType}'); } true;`
      );
    }
  }, [mapType, loaded]);

  // Sync points, team members, and location updates into WebView smoothly without reload
  useEffect(() => {
    if (loaded && webViewRef.current) {
      const payload = JSON.stringify({
        points,
        currentLocation,
        teamUsers,
        selectedUserId,
        isTracking,
      });
      webViewRef.current.injectJavaScript(
        `if (window.updateMapData) { window.updateMapData(${payload}); } true;`
      );
    }
  }, [points, currentLocation, teamUsers, selectedUserId, isTracking, loaded]);

  // Handle messages from WebView (e.g. user clicked a marker)
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_USER' && onSelectUser) {
        onSelectUser(data.userId);
      }
    } catch {
      // Ignored non-json messages like 'READY'
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * {
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: ${isDark ? '#090d16' : '#f8fafc'};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .leaflet-control-attribution,
    .leaflet-control-zoom {
      display: none !important;
    }

    /* Google Roadmap Dark Mode Filter */
    ${
      isDark
        ? `
    .dark-tile-filter {
      filter: invert(100%) hue-rotate(180deg) brightness(92%) contrast(88%) saturate(120%);
    }
    `
        : ''
    }

    /* Current User Radar Pulsing Pin */
    .radar-wrapper {
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .radar-core {
      width: 14px;
      height: 14px;
      background: #0284c7;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(2, 132, 199, 0.9);
      z-index: 2;
    }
    .radar-wave {
      position: absolute;
      width: 32px;
      height: 32px;
      background: rgba(2, 132, 199, 0.4);
      border-radius: 50%;
      animation: radarPulse 1.8s infinite ease-out;
      z-index: 1;
    }
    @keyframes radarPulse {
      0% { transform: scale(0.35); opacity: 1; }
      100% { transform: scale(1.7); opacity: 0; }
    }

    /* Team Member Markers */
    .team-marker-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      cursor: pointer;
    }
    .email-pill {
      display: flex;
      align-items: center;
      background: #090d16;
      padding: 2.5px 7px;
      border-radius: 9999px;
      border: 1.5px solid #0284c7;
      margin-bottom: 2px;
      max-width: 220px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      white-space: nowrap;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 5px;
      flex-shrink: 0;
    }
    .email-text {
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      margin-right: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .device-badge {
      background: rgba(255, 255, 255, 0.15);
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      color: #94a3b8;
    }
    .icon-circle {
      position: relative;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      color: #ffffff;
      font-size: 16px;
    }
    .speed-tag {
      position: absolute;
      top: -6px;
      right: -8px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.7);
      padding: 0.5px 3.5px;
      border-radius: 9999px;
      font-size: 8px;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
    }
    .anchor-tip {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #0284c7;
      margin-top: -1px;
    }

    /* Start / End Badges */
    .pin-badge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    }
    .start-badge {
      background: #10b981;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .end-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border: 1.5px solid #ffffff;
      border-radius: 50%;
      margin-top: 1.5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialLat}, ${initialLng}], ${initialZoom});

    // Google Maps Tile Layers (Roadmap, Satellite Hybrid, Terrain)
    var googleRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: '0123',
      maxZoom: 21,
      className: '${isDark ? 'dark-tile-filter' : ''}'
    });

    var googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: '0123',
      maxZoom: 21
    });

    var googleTerrain = L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      subdomains: '0123',
      maxZoom: 21
    });

    var currentLayer = '${mapType}' === 'satellite' ? googleSatellite : ('${mapType}' === 'terrain' ? googleTerrain : googleRoadmap);
    currentLayer.addTo(map);

    window.switchLayer = function(type) {
      if (currentLayer) map.removeLayer(currentLayer);
      if (type === 'satellite') {
        currentLayer = googleSatellite;
      } else if (type === 'terrain') {
        currentLayer = googleTerrain;
      } else {
        currentLayer = googleRoadmap;
      }
      currentLayer.addTo(map);
    };

    // Dual-layer polylines for Selected User Trail
    var polylineGlow = L.polyline([], {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var polyline = L.polyline([], {
      color: '#0284c7',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var startMarker = null;
    var endMarker = null;
    var currentMarker = null;
    var teamMarkersMap = {};
    var teamPolylinesMap = {};

    var startIcon = L.divIcon({
      className: '',
      html: '<div class="pin-badge-container"><div class="start-badge">START</div><div class="badge-dot" style="background:#10b981;"></div></div>',
      iconSize: [40, 26],
      iconAnchor: [20, 26]
    });

    var endIcon = L.divIcon({
      className: '',
      html: '<div class="pin-badge-container"><div class="end-badge">LATEST</div><div class="badge-dot" style="background:#ef4444;"></div></div>',
      iconSize: [46, 26],
      iconAnchor: [23, 26]
    });

    var radarIcon = L.divIcon({
      className: '',
      html: '<div class="radar-wrapper"><div class="radar-wave"></div><div class="radar-core"></div></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    window.updateMapData = function(data) {
      if (!data) return;
      var pts = data.points || [];
      var latLngs = pts.map(function(p) { return [Number(p.lat), Number(p.lng)]; });

      polyline.setLatLngs(latLngs);
      polylineGlow.setLatLngs(latLngs);

      // Start Marker
      if (pts.length > 0) {
        if (!startMarker) {
          startMarker = L.marker([Number(pts[0].lat), Number(pts[0].lng)], { icon: startIcon, zIndexOffset: 50 }).addTo(map);
        } else {
          startMarker.setLatLng([Number(pts[0].lat), Number(pts[0].lng)]);
        }
      } else if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
      }

      // Latest Marker
      if (pts.length > 1) {
        var last = pts[pts.length - 1];
        if (!endMarker) {
          endMarker = L.marker([Number(last.lat), Number(last.lng)], { icon: endIcon, zIndexOffset: 55 }).addTo(map);
        } else {
          endMarker.setLatLng([Number(last.lat), Number(last.lng)]);
        }
      } else if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
      }

      // Current GPS Live Pulsing Radar Marker
      if (data.currentLocation && data.currentLocation.lat != null && data.currentLocation.lng != null) {
        if (!currentMarker) {
          currentMarker = L.marker([Number(data.currentLocation.lat), Number(data.currentLocation.lng)], {
            icon: radarIcon,
            zIndexOffset: 100
          }).addTo(map);
        } else {
          currentMarker.setLatLng([Number(data.currentLocation.lat), Number(data.currentLocation.lng)]);
        }
      }

      // ── Team Members Fleet ──
      var users = data.teamUsers || [];
      var seenUserIds = {};

      users.forEach(function(u) {
        if (!u.latestLocation || u.latestLocation.lat == null || u.latestLocation.lng == null) return;
        seenUserIds[u.id] = true;
        var uLat = Number(u.latestLocation.lat);
        var uLng = Number(u.latestLocation.lng);
        var userColor = u.color || '#0284c7';
        var isDriving = Boolean(u.isDriving || (u.speed >= 2.5));
        var speedKmH = u.speedKmH !== undefined ? u.speedKmH : Math.round((u.speed || 0) * 3.6);
        var deviceText = u.platform === 'mobile' ? '📱 Mobile' : '💻 Web';
        var emailDisplay = u.email || u.name || 'User';
        var iconSymbol = isDriving ? '🚗' : '🚶';

        // Team trail polyline
        if (u.trail && u.trail.length > 1) {
          var tPoints = u.trail.map(function(p) { return [Number(p.lat), Number(p.lng)]; });
          if (!teamPolylinesMap[u.id]) {
            teamPolylinesMap[u.id] = L.polyline(tPoints, {
              color: userColor,
              weight: 4,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
          } else {
            teamPolylinesMap[u.id].setLatLngs(tPoints);
            teamPolylinesMap[u.id].setStyle({ color: userColor });
          }
        } else if (teamPolylinesMap[u.id]) {
          map.removeLayer(teamPolylinesMap[u.id]);
          delete teamPolylinesMap[u.id];
        }

        // Marker HTML
        var markerHtml =
          '<div class="team-marker-container" onclick="window.onMarkerClick(\\'' + u.id + '\\')">' +
            '<div class="email-pill" style="border-color:' + userColor + ';">' +
              '<div class="status-dot" style="background-color:' + userColor + ';"></div>' +
              '<span class="email-text">' + emailDisplay + '</span>' +
              '<span class="device-badge">' + deviceText + '</span>' +
            '</div>' +
            '<div class="icon-circle" style="background-color:' + userColor + ';">' +
              '<span>' + iconSymbol + '</span>' +
              '<div class="speed-tag">' + speedKmH + 'km/h</div>' +
            '</div>' +
            '<div class="anchor-tip" style="border-top-color:' + userColor + ';"></div>' +
          '</div>';

        var userIcon = L.divIcon({
          className: '',
          html: markerHtml,
          iconSize: [120, 65],
          iconAnchor: [60, 65]
        });

        if (!teamMarkersMap[u.id]) {
          var marker = L.marker([uLat, uLng], {
            icon: userIcon,
            zIndexOffset: u.isCurrent ? 80 : 40
          }).addTo(map);
          teamMarkersMap[u.id] = marker;
        } else {
          teamMarkersMap[u.id].setLatLng([uLat, uLng]);
          teamMarkersMap[u.id].setIcon(userIcon);
        }
      });

      // Cleanup removed users
      Object.keys(teamMarkersMap).forEach(function(uid) {
        if (!seenUserIds[uid]) {
          map.removeLayer(teamMarkersMap[uid]);
          delete teamMarkersMap[uid];
        }
      });
      Object.keys(teamPolylinesMap).forEach(function(uid) {
        if (!seenUserIds[uid]) {
          map.removeLayer(teamPolylinesMap[uid]);
          delete teamPolylinesMap[uid];
        }
      });
    };

    window.onMarkerClick = function(userId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_USER', userId: userId }));
      }
    };

    window.centerOnCoords = function(lat, lng) {
      map.setView([Number(lat), Number(lng)], 17, { animate: true });
    };

    window.fitTrailBounds = function() {
      if (polyline.getLatLngs().length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [45, 45], animate: true, maxZoom: 18 });
      }
    };

    window.fitAllUsersBounds = function() {
      var allLatLngs = [];
      Object.keys(teamMarkersMap).forEach(function(uid) {
        allLatLngs.push(teamMarkersMap[uid].getLatLng());
      });
      if (currentMarker) {
        allLatLngs.push(currentMarker.getLatLng());
      }
      if (allLatLngs.length > 1) {
        var bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 17 });
      } else if (allLatLngs.length === 1) {
        map.setView(allLatLngs[0], 16, { animate: true });
      }
    };

    // Initial load
    var initialData = ${JSON.stringify({
      points,
      currentLocation,
      teamUsers,
      selectedUserId,
      isTracking,
    })};
    window.updateMapData(initialData);

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    }
  </script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onLoadEnd={() => setLoaded(true)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
      {!loaded && (
        <View style={[styles.loader, { backgroundColor: isDark ? '#090d16' : '#f8fafc' }]}>
          <ActivityIndicator size="large" color={colors.primary || '#0284c7'} />
        </View>
      )}
    </View>
  );
});

export default WebGoogleMapView;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
