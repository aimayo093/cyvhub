import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, Clock } from 'lucide-react-native';
import * as h3 from 'h3-js';
import MapView, { MapPolygon } from '@/components/MapView';
import { useLocation } from '@/providers/LocationProvider';
import Colors from '@/constants/colors';

interface LiveTrackingMapProps {
    driverId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    driverName: string;
    driverPhone?: string;
    vehicleType?: string;
    estimatedArrival?: string;
    status?: string;
    height?: number | string;
    h3Resolution?: number; // Added H3 resolution prop (default 9)
}

export default function LiveTrackingMap({
    driverId,
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
    driverName,
    driverPhone,
    vehicleType,
    estimatedArrival,
    status,
    height = 350,
    h3Resolution = 9,
}: LiveTrackingMapProps) {
    const { getDriverLocation, startSimulation, stopSimulation } = useLocation();

    const driverLocation = getDriverLocation(driverId);

    useEffect(() => {
        startSimulation(driverId);
        return () => stopSimulation();
    }, [driverId, startSimulation, stopSimulation]);

    const markers = [
        ...(driverLocation
            ? [{
                id: 'driver',
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                title: driverName,
                type: 'driver' as const,
                heading: driverLocation.heading,
            }]
            : []),
        {
            id: 'pickup',
            latitude: pickupLatitude,
            longitude: pickupLongitude,
            title: 'Pickup',
            type: 'pickup' as const,
        },
        {
            id: 'dropoff',
            latitude: dropoffLatitude,
            longitude: dropoffLongitude,
            title: 'Dropoff',
            type: 'dropoff' as const,
        },
    ];

    const routeLine = driverLocation
        ? [
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
            { latitude: dropoffLatitude, longitude: dropoffLongitude },
        ]
        : [
            { latitude: pickupLatitude, longitude: pickupLongitude },
            { latitude: dropoffLatitude, longitude: dropoffLongitude },
        ];

    const center = driverLocation
        ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
        : { latitude: (pickupLatitude + dropoffLatitude) / 2, longitude: (pickupLongitude + dropoffLongitude) / 2 };

    const formatETA = (dateStr?: string) => {
        if (!dateStr) return '--:--';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate H3 Polygon if driver location is known
    const polygons: MapPolygon[] = [];
    if (driverLocation) {
        try {
            // Find the H3 cell for the driver's current location
            const h3Index = h3.latLngToCell(driverLocation.latitude, driverLocation.longitude, h3Resolution);
            // Get the boundary vertices of the cell
            const boundary = h3.cellToBoundary(h3Index);
            
            polygons.push({
                id: `h3-zone-${h3Index}`,
                coordinates: boundary.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
                fillColor: 'rgba(56, 189, 248, 0.25)', // Custom color for driver zone
                strokeColor: '#0ea5e9',
                strokeWidth: 2,
            });
        } catch (err) {
            console.warn('H3 calculation failed:', err);
        }
    }

    return (
        <View style={styles.container}>
            <MapView
                center={center}
                zoom={10}
                markers={markers}
                routeLine={routeLine}
                polygons={polygons}
                height={height}
            />

            {/* Driver Info Overlay */}
            <View style={styles.overlay}>
                <View style={styles.driverCard}>
                    <View style={styles.driverAvatar}>
                        <Text style={styles.driverAvatarText}>🚛</Text>
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.vehicleType}>{vehicleType || 'Van'}</Text>
                    </View>
                    <View style={styles.etaContainer}>
                        <Clock size={14} color={Colors.primary} />
                        <Text style={styles.etaText}>ETA {formatETA(estimatedArrival)}</Text>
                    </View>
                </View>

                {status && (
                    <View style={styles.statusBadge}>
                        <Navigation size={12} color="#fff" />
                        <Text style={styles.statusText}>
                            {status === 'IN_TRANSIT' ? 'Driver en route' : status === 'PICKED_UP' ? 'Package collected' : status}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    overlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        gap: 8,
    },
    driverCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    driverAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    driverAvatarText: {
        fontSize: 24,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    vehicleType: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    etaText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    statusBadge: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        alignSelf: 'center',
    },
    statusText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
