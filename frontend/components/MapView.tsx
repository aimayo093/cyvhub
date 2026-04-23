import React, { useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// Only load native map on mobile devices to prevent web crash
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Map = Platform.OS !== 'web' ? require('react-native-maps').default : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Marker, Polyline, Polygon } = Platform.OS !== 'web' ? require('react-native-maps') : { Marker: null, Polyline: null, Polygon: null };

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    type?: 'driver' | 'pickup' | 'dropoff' | 'carrier';
    heading?: number;
    color?: string;
}

export interface MapPolygon {
    id: string;
    coordinates: { latitude: number; longitude: number }[];
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

interface MapViewProps {
    center: { latitude: number; longitude: number };
    zoom?: number;
    markers?: MapMarker[];
    routeLine?: { latitude: number; longitude: number }[];
    polygons?: MapPolygon[];
    height?: number | string;
    onMarkerPress?: (markerId: string) => void;
}

const generateMapHTML = (
    center: { latitude: number; longitude: number },
    zoom: number,
    markers: MapMarker[],
    routeLine: { latitude: number; longitude: number }[],
    polygons: MapPolygon[]
) => {
    const markerIcons: Record<string, { emoji: string; color: string }> = {
        driver: { emoji: '🚛', color: '#2563EB' },
        pickup: { emoji: '📦', color: '#0066FF' },
        dropoff: { emoji: '📍', color: '#EF4444' },
        carrier: { emoji: '🚚', color: '#EA580C' },
    };

    const markersJS = markers.map(m => {
        const icon = markerIcons[m.type || 'driver'];
        const rotation = m.heading || 0;
        return `
      L.marker([${m.latitude}, ${m.longitude}], {
        icon: L.divIcon({
          html: '<div style="font-size:28px;transform:rotate(${rotation}deg);filter:drop-shadow(1px 2px 2px rgba(0,0,0,0.3))">${icon.emoji}</div>',
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
      }).addTo(map)${m.title ? `.bindPopup('<b>${m.title.replace(/'/g, "\\'")}</b>')` : ''};
    `;
    }).join('\n');

    const routeJS = routeLine.length > 1 ? `
    var routeCoords = [${routeLine.map(p => `[${p.latitude}, ${p.longitude}]`).join(',')}];
    L.polyline(routeCoords, {
      color: '#2563EB',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 6',
      lineCap: 'round'
    }).addTo(map);
  ` : '';

    const polygonsJS = polygons.map(poly => `
    var polyCoords = [${poly.coordinates.map(p => `[${p.latitude}, ${p.longitude}]`).join(',')}];
    L.polygon(polyCoords, {
        color: '${poly.strokeColor || '#2563EB'}',
        fillColor: '${poly.fillColor || '#3B82F6'}',
        fillOpacity: 0.2,
        weight: ${poly.strokeWidth || 2}
    }).addTo(map);
    `).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${center.latitude}, ${center.longitude}],
      zoom: ${zoom},
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    ${markersJS}
    ${routeJS}
    ${polygonsJS}
    ${markers.length > 1 ? `
    var bounds = L.latLngBounds([${markers.map(m => `[${m.latitude}, ${m.longitude}]`).join(',')}]);
    map.fitBounds(bounds, { padding: [40, 40] });
    ` : ''}
  </script>
</body>
</html>`;
};

// Zoom level math helper for latitudeDelta
const getRegionForZoom = (lat: number, lon: number, zoom: number) => {
    const accuracy = 0.05; // Base map delta
    const multiplier = Math.pow(2, 14 - Math.max(zoom, 1));
    return {
        latitude: lat,
        longitude: lon,
        latitudeDelta: accuracy * multiplier,
        longitudeDelta: accuracy * multiplier,
    };
};

export default function MapView({
    center,
    zoom = 11,
    markers = [],
    routeLine = [],
    polygons = [],
    height = 400,
    onMarkerPress,
}: MapViewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    if (Platform.OS === 'web') {
        const html = generateMapHTML(center, zoom, markers, routeLine, polygons);
        return (
            <View style={[styles.container, { height: typeof height === 'number' ? height : undefined }]}>
                <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 12,
                    }}
                    title="Map"
                />
            </View>
        );
    }

    if (!Map) {
        return (
             <View style={[styles.container, styles.nativeContainer, { height: typeof height === 'number' ? height : 400 }]}>
                <Text>Map not available</Text>
             </View>
        );
    }

    const region = getRegionForZoom(center.latitude, center.longitude, zoom);

    return (
        <View style={[styles.container, { height: typeof height === 'number' ? height : 400 }]}>
            <Map
                style={styles.map}
                initialRegion={region}
                region={region}
            >
                {markers.map(m => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                        title={m.title}
                        rotation={m.heading}
                        pinColor={m.type === 'pickup' ? '#0066FF' : m.type === 'dropoff' ? '#EF4444' : '#2563EB'}
                        onPress={() => onMarkerPress?.(m.id)}
                    />
                ))}

                {routeLine.length > 1 && (
                    <Polyline
                        coordinates={routeLine}
                        strokeColor="#2563EB"
                        strokeWidth={4}
                        lineDashPattern={[10, 6]}
                    />
                )}

                {polygons.map(poly => (
                    <Polygon
                        key={poly.id}
                        coordinates={poly.coordinates}
                        fillColor={poly.fillColor || 'rgba(59, 130, 246, 0.2)'}
                        strokeColor={poly.strokeColor || '#2563EB'}
                        strokeWidth={poly.strokeWidth || 2}
                    />
                ))}
            </Map>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    nativeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
});
