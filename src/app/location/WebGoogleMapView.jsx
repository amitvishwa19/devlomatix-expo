import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * WebGoogleMapView: High-Performance Interactive Google Maps with Full Team & User HUD
 *
 * Displays:
 * - Full email pill badge with status dot and device indicator
 * - Dynamic SVG Walking (🚶) vs Driving (🚗) icons based on real-time speed threshold (2.5 m/s ≈ 9 km/h)
 * - Real-time speed badge (e.g. 0km/h, 15km/h, 45km/h)
 * - Radar pulsing beacon on the current active user
 * - Dual-layer glowing polylines for trails
 * - Google Roadmap, Satellite Hybrid, and Terrain layer switcher
 */
const WebGoogleMapView = forwardRef(function WebGoogleMapView(
  {
    points = [],
    currentLocation = null,
    currentUser = null,
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

  const initialZoom = points.length > 1 || teamUsers.length > 1 ? 14 : 16;

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

  useEffect(() => {
    if (loaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.switchLayer) { window.switchLayer('${mapType}'); } true;`
      );
    }
  }, [mapType, loaded]);

  useEffect(() => {
    if (loaded && webViewRef.current) {
      const payload = JSON.stringify({
        points,
        currentLocation,
        currentUser,
        teamUsers,
        selectedUserId,
        isTracking,
      });
      webViewRef.current.injectJavaScript(
        `if (window.updateMapData) { window.updateMapData(${payload}); } true;`
      );
    }
  }, [points, currentLocation, currentUser, teamUsers, selectedUserId, isTracking, loaded]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_USER' && onSelectUser) {
        onSelectUser(data.userId);
      }
    } catch {
      // Ignored
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

    /* Custom Leaflet DivIcon reset */
    .custom-div-icon {
      background: transparent !important;
      border: none !important;
    }

    /* Marker Container */
    .team-marker-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      cursor: pointer;
    }

    /* Email Pill Badge */
    .email-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(9, 13, 22, 0.94);
      padding: 3px 9px;
      border-radius: 9999px;
      border: 1.5px solid #0284c7;
      margin-bottom: 3px;
      max-width: 270px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.5);
      white-space: nowrap;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .email-text {
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .device-badge {
      background: rgba(255, 255, 255, 0.16);
      padding: 1.5px 6px;
      border-radius: 5px;
      font-size: 9px;
      font-weight: 700;
      color: #38bdf8;
    }

    /* Icon Circle */
    .icon-circle-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-circle {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2.5px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      z-index: 2;
    }
    .pulse-ring {
      position: absolute;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(2, 132, 199, 0.4);
      animation: pulseAnim 1.8s infinite ease-out;
      z-index: 1;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Speed Badge */
    .speed-tag {
      position: absolute;
      top: -7px;
      right: -10px;
      background: #090d16;
      border: 1.5px solid #38bdf8;
      padding: 1px 4.5px;
      border-radius: 9999px;
      font-size: 8.5px;
      font-weight: 800;
      color: #38bdf8;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      z-index: 3;
    }

    /* Anchor Needle Tip */
    .anchor-tip {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 7px solid #0284c7;
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
    var WALKING_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>';

    var DRIVING_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>';

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialLat}, ${initialLng}], ${initialZoom});

    // Google Maps Tile Layers
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

      // ── Build Team List (Ensure current user is always included with live coordinates) ──
      var users = (data.teamUsers && data.teamUsers.length > 0) ? data.teamUsers.slice() : [];
      var hasCurrentInTeam = users.some(function(u) { return u.isCurrent; });

      // If current user is not in the list, synthesize their marker from session
      if (!hasCurrentInTeam && data.currentUser) {
        var cLat = data.currentLocation ? Number(data.currentLocation.lat) : (pts.length ? Number(pts[pts.length - 1].lat) : null);
        var cLng = data.currentLocation ? Number(data.currentLocation.lng) : (pts.length ? Number(pts[pts.length - 1].lng) : null);
        if (cLat != null && cLng != null) {
          var cSpeed = data.currentLocation?.speed || 0;
          users.unshift({
            id: data.currentUser.id || 'current-user',
            name: data.currentUser.displayName || data.currentUser.name || 'You',
            email: data.currentUser.email || 'You',
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
      } else if (hasCurrentInTeam && data.currentLocation && data.currentLocation.lat != null) {
        // Update current user coordinates to live GPS position
        users = users.map(function(u) {
          if (u.isCurrent) {
            return Object.assign({}, u, {
              latestLocation: {
                lat: Number(data.currentLocation.lat),
                lng: Number(data.currentLocation.lng),
              },
              speed: data.currentLocation.speed !== undefined ? data.currentLocation.speed : u.speed,
              speedKmH: data.currentLocation.speed !== undefined ? Math.round(data.currentLocation.speed * 3.6) : u.speedKmH,
              isDriving: data.currentLocation.speed !== undefined ? data.currentLocation.speed >= 2.5 : u.isDriving,
            });
          }
          return u;
        });
      }

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
        var iconSvg = isDriving ? DRIVING_SVG : WALKING_SVG;

        // User trail polyline
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

        // Marker HTML with Email, Walking/Driving SVG, and Speed Tag
        var markerHtml =
          '<div class="team-marker-container" onclick="window.onMarkerClick(\\'' + u.id + '\\')">' +
            '<div class="email-pill" style="border-color:' + userColor + ';">' +
              '<div class="status-dot" style="background-color:' + userColor + ';"></div>' +
              '<span class="email-text">' + emailDisplay + '</span>' +
              '<span class="device-badge">' + deviceText + '</span>' +
            '</div>' +
            '<div class="icon-circle-wrapper">' +
              (u.isCurrent ? '<div class="pulse-ring" style="background:' + userColor + '40;"></div>' : '') +
              '<div class="icon-circle" style="background-color:' + userColor + ';">' +
                iconSvg +
                '<div class="speed-tag">' + speedKmH + 'km/h</div>' +
              '</div>' +
            '</div>' +
            '<div class="anchor-tip" style="border-top-color:' + userColor + ';"></div>' +
          '</div>';

        var userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: markerHtml,
          iconSize: [280, 80],
          iconAnchor: [140, 80]
        });

        if (!teamMarkersMap[u.id]) {
          var marker = L.marker([uLat, uLng], {
            icon: userIcon,
            zIndexOffset: u.isCurrent ? 120 : 60
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
      currentUser,
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
