import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * GoogleMapView: Real Google Maps powered by Google Maps Tile Servers
 * (Roadmap, Satellite Hybrid, and Terrain layers).
 *
 * Loads 100% reliably in React Native WebView without API key referrer/SHA1 restrictions,
 * with full interactive gesture control, live movement polyline, and Uber-style pulse marker.
 */
const GoogleMapView = forwardRef(function GoogleMapView(
  {
    points = [],
    currentLocation = null,
    isDark = false,
    isTracking = false,
    mapType = 'roadmap', // 'roadmap' | 'satellite' | 'terrain'
    colors = {},
  },
  ref
) {
  const webViewRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

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
    setMapType: (type) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (window.switchLayer) { window.switchLayer('${type}'); } true;`
        );
      }
    },
  }));

  // Update map layer if mapType prop changes
  useEffect(() => {
    if (loaded && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.switchLayer) { window.switchLayer('${mapType}'); } true;`
      );
    }
  }, [mapType, loaded]);

  // Push new points to the WebView without reloading
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

  const initialLat = currentLocation?.lat || (points.length ? points[0].lat : 28.6139);
  const initialLng = currentLocation?.lng || (points.length ? points[0].lng : 77.2090);
  const initialZoom = points.length || currentLocation ? 16 : 14;

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

    /* Live Uber/Zomato Pulsing Radar Marker */
    .pulse-wrapper {
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-core {
      width: 14px;
      height: 14px;
      background: #0284c7;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(2, 132, 199, 0.9);
      z-index: 2;
    }
    .pulse-radar {
      position: absolute;
      width: 28px;
      height: 28px;
      background: rgba(2, 132, 199, 0.35);
      border-radius: 50%;
      animation: radar 1.8s infinite ease-out;
      z-index: 1;
    }
    @keyframes radar {
      0% { transform: scale(0.4); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    /* Pin Badges */
    .pin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    }
    .start-badge {
      background: #10b981;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 8px;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .end-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 8px;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .pin-dot-green {
      width: 8px;
      height: 8px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
      margin-top: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .pin-dot-red {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border: 2px solid #ffffff;
      border-radius: 50%;
      margin-top: 2px;
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

    // Active layer tracking
    var currentLayer = googleRoadmap;
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

    // Polyline for Movement Trail
    var polyline = L.polyline([], {
      color: '#0284c7',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Glow outline polyline under the main line
    var polylineGlow = L.polyline([], {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var startMarker = null;
    var endMarker = null;
    var currentMarker = null;

    var startIcon = L.divIcon({
      className: '',
      html: '<div class="pin-container"><div class="start-badge">START</div><div class="pin-dot-green"></div></div>',
      iconSize: [40, 26],
      iconAnchor: [20, 26]
    });

    var endIcon = L.divIcon({
      className: '',
      html: '<div class="pin-container"><div class="end-badge">LATEST</div><div class="pin-dot-red"></div></div>',
      iconSize: [46, 26],
      iconAnchor: [23, 26]
    });

    var pulseIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-wrapper"><div class="pulse-radar"></div><div class="pulse-core"></div></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    window.updateMapData = function(data) {
      if (!data) return;
      var pts = data.points || [];
      var latLngs = pts.map(function(p) { return [p.lat, p.lng]; });

      polyline.setLatLngs(latLngs);
      polylineGlow.setLatLngs(latLngs);

      // Start Marker
      if (pts.length > 0) {
        if (!startMarker) {
          startMarker = L.marker([pts[0].lat, pts[0].lng], { icon: startIcon }).addTo(map);
        } else {
          startMarker.setLatLng([pts[0].lat, pts[0].lng]);
        }
      } else if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
      }

      // Latest Marker (if > 1 point)
      if (pts.length > 1) {
        var last = pts[pts.length - 1];
        if (!endMarker) {
          endMarker = L.marker([last.lat, last.lng], { icon: endIcon }).addTo(map);
        } else {
          endMarker.setLatLng([last.lat, last.lng]);
        }
      } else if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
      }

      // Live Current Location Radar Marker
      if (data.currentLocation) {
        if (!currentMarker) {
          currentMarker = L.marker([data.currentLocation.lat, data.currentLocation.lng], { icon: pulseIcon }).addTo(map);
        } else {
          currentMarker.setLatLng([data.currentLocation.lat, data.currentLocation.lng]);
        }
      }

      // Auto fit when points exist
      if (latLngs.length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 18 });
      } else if (data.currentLocation) {
        map.setView([data.currentLocation.lat, data.currentLocation.lng], 16);
      }
    };

    window.centerOnCoords = function(lat, lng) {
      map.setView([lat, lng], 17, { animate: true });
    };

    window.fitTrailBounds = function() {
      if (polyline.getLatLngs().length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], animate: true, maxZoom: 18 });
      }
    };

    // Initial load
    var initialData = ${JSON.stringify({ points, currentLocation, isTracking })};
    window.updateMapData(initialData);

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

export default GoogleMapView;

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
