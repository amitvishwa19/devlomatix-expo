import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * LeafletMap: High-performance, zero-native-compilation map with Leaflet & CartoDB tiles.
 * Works seamlessly in Expo Go, custom dev clients, Android, iOS, and Web without AIRMap.
 */
const LeafletMap = forwardRef(function LeafletMap(
  {
    points = [],
    currentLocation = null,
    isDark = false,
    isTracking = false,
    colors = {},
  },
  ref
) {
  const webViewRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Expose imperative methods to parent (e.g. centerOnUser, fitBounds)
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
  }));

  // Push new points to the WebView when props change without full page reloads
  useEffect(() => {
    if (loaded && webViewRef.current) {
      const payload = JSON.stringify({
        points,
        currentLocation,
        isTracking,
      });
      webViewRef.current.injectJavaScript(
        `if (window.updateMapData) { window.updateMapData(${payload}); } true;`
      );
    }
  }, [points, currentLocation, isTracking, loaded]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const initialLat = currentLocation?.lat || (points.length ? points[0].lat : 20.5937);
  const initialLng = currentLocation?.lng || (points.length ? points[0].lng : 78.9629);
  const initialZoom = points.length || currentLocation ? 15 : 5;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
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
    .leaflet-control-attribution {
      display: none !important;
    }
    .pulse-pin {
      width: 16px;
      height: 16px;
      background: #1C9ADB;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(28, 154, 219, 0.8);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(28, 154, 219, 0.7); }
      70% { box-shadow: 0 0 0 14px rgba(28, 154, 219, 0); }
      100% { box-shadow: 0 0 0 0 rgba(28, 154, 219, 0); }
    }
    .start-pin {
      background: #22c55e;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .end-pin {
      background: #ef4444;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    .pin-label {
      background: ${isDark ? '#1e293b' : '#ffffff'};
      color: ${isDark ? '#f8fafc' : '#0f172a'};
      border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      white-space: nowrap;
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

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var polyline = L.polyline([], {
      color: '#1C9ADB',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var startMarker = null;
    var endMarker = null;
    var currentMarker = null;

    var startIcon = L.divIcon({
      className: '',
      html: '<div class="start-pin"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    var endIcon = L.divIcon({
      className: '',
      html: '<div class="end-pin"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    var pulseIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-pin"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    window.updateMapData = function(data) {
      if (!data) return;
      var pts = data.points || [];
      var latLngs = pts.map(function(p) { return [p.lat, p.lng]; });
      polyline.setLatLngs(latLngs);

      // Start Marker
      if (pts.length > 0) {
        if (!startMarker) {
          startMarker = L.marker([pts[0].lat, pts[0].lng], { icon: startIcon }).addTo(map);
          startMarker.bindTooltip('<div class="pin-label">Start</div>', { permanent: false, direction: 'top' });
        } else {
          startMarker.setLatLng([pts[0].lat, pts[0].lng]);
        }
      } else if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
      }

      // End Marker (if > 1 point)
      if (pts.length > 1) {
        var last = pts[pts.length - 1];
        if (!endMarker) {
          endMarker = L.marker([last.lat, last.lng], { icon: endIcon }).addTo(map);
          endMarker.bindTooltip('<div class="pin-label">Latest</div>', { permanent: false, direction: 'top' });
        } else {
          endMarker.setLatLng([last.lat, last.lng]);
        }
      } else if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
      }

      // Current User Location Pulse Marker
      if (data.currentLocation) {
        if (!currentMarker) {
          currentMarker = L.marker([data.currentLocation.lat, data.currentLocation.lng], { icon: pulseIcon }).addTo(map);
        } else {
          currentMarker.setLatLng([data.currentLocation.lat, data.currentLocation.lng]);
        }
      }

      // Auto fit on initial data load
      if (latLngs.length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } else if (data.currentLocation) {
        map.setView([data.currentLocation.lat, data.currentLocation.lng], 16);
      }
    };

    window.centerOnCoords = function(lat, lng) {
      map.setView([lat, lng], 17, { animate: true });
    };

    window.fitTrailBounds = function() {
      if (polyline.getLatLngs().length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], animate: true });
      }
    };

    // Initial render with embedded points
    var initialData = ${JSON.stringify({ points, currentLocation, isTracking })};
    window.updateMapData(initialData);

    // Notify React Native that webview is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('READY');
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

export default LeafletMap;

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
