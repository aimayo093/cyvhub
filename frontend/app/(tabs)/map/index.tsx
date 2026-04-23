import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
} from 'react-native';
import {
    MapPin,
    Navigation,
    Radio,
    Truck,
    Package,
    ChevronUp,
    ChevronDown,
    Phone,
    Clock,
    Wifi,
    WifiOff,
} from 'lucide-react-native';
import MapView from '@/components/MapView';
import { useAuth } from '@/providers/AuthProvider';
import { useLocation } from '@/providers/LocationProvider';
import { useJobs } from '@/providers/JobsProvider';
import Colors from '@/constants/colors';

export default function MapScreen() {
    const { userRole, driver } = useAuth();
    const { driverLocations, currentLocation, isTracking, startTracking, stopTracking, startSimulation, stopSimulation, getActiveDrivers } = useLocation();
    const isDriver = userRole === 'driver';
    const isCarrier = userRole === 'carrier';

    const [isOnline, setIsOnline] = useState(true);
    const [showJobCard, setShowJobCard] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    useEffect(() => {
        if (isDriver && isOnline) {
            startTracking();
            startSimulation('drv-001');
        }
        return () => {
            stopTracking();
            stopSimulation();
        };
    }, [isDriver, isOnline]);

    const activeDrivers = getActiveDrivers();

    // Build markers based on role
    const markers = useMemo(() => {
        if (isDriver) {
            const driverLoc = driverLocations.find(d => d.driverId === 'drv-001');
            const driverMarkers = driverLoc
                ? [{
                    id: 'me',
                    latitude: driverLoc.latitude,
                    longitude: driverLoc.longitude,
                    title: 'You',
                    type: 'driver' as const,
                    heading: driverLoc.heading,
                }]
                : [];

            // Add job pickup/dropoff markers
            return [
                ...driverMarkers,
                {
                    id: 'pickup-1',
                    latitude: 51.6320,
                    longitude: -3.9500,
                    title: 'Pickup: TechWorks Ltd',
                    type: 'pickup' as const,
                },
                {
                    id: 'dropoff-1',
                    latitude: 51.4816,
                    longitude: -3.1791,
                    title: 'Dropoff: Cardiff',
                    type: 'dropoff' as const,
                },
            ];
        }

        // Carrier: show all drivers
        return driverLocations.map(d => ({
            id: d.driverId,
            latitude: d.latitude,
            longitude: d.longitude,
            title: `${d.driverName} (${d.status})`,
            type: (d.status === 'ON_JOB' ? 'driver' : 'carrier') as 'driver' | 'carrier',
            heading: d.heading,
        }));
    }, [isDriver, driverLocations]);

    const routeLine = isDriver
        ? [
            { latitude: 51.6214, longitude: -3.9436 },
            { latitude: 51.6100, longitude: -3.8800 },
            { latitude: 51.5870, longitude: -3.6800 },
            { latitude: 51.5600, longitude: -3.3200 },
            { latitude: 51.4816, longitude: -3.1791 },
        ]
        : [];

    const center = isDriver
        ? { latitude: 51.5800, longitude: -3.5600 }
        : { latitude: 51.6000, longitude: -3.6000 };

    const accent = isDriver ? Colors.primary : Colors.carrierPrimary;

    const toggleOnline = () => {
        setIsOnline(prev => !prev);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: accent }]}>
                    <View style={styles.headerLeft}>
                        <MapPin size={22} color="#fff" />
                        <Text style={styles.headerTitle}>
                            {isDriver ? 'Driver Map' : 'Fleet Overview'}
                        </Text>
                    </View>
                    {isDriver && (
                        <TouchableOpacity
                            style={[styles.onlineToggle, { backgroundColor: isOnline ? '#11a7fa' : '#EF4444' }]}
                            onPress={toggleOnline}
                        >
                            {isOnline ? <Wifi size={14} color="#fff" /> : <WifiOff size={14} color="#fff" />}
                            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    <MapView
                        center={center}
                        zoom={isDriver ? 10 : 9}
                        markers={markers}
                        routeLine={routeLine}
                        height="100%"
                    />
                </View>

                {/* Stats Bar */}
                {isCarrier && (
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Truck size={16} color={Colors.carrierPrimary} />
                            <Text style={styles.statValue}>{activeDrivers.length}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Radio size={16} color="#11a7fa" />
                            <Text style={styles.statValue}>
                                {driverLocations.filter(d => d.status === 'ON_JOB').length}
                            </Text>
                            <Text style={styles.statLabel}>On Job</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Navigation size={16} color="#F59E0B" />
                            <Text style={styles.statValue}>
                                {driverLocations.filter(d => d.status === 'AVAILABLE').length}
                            </Text>
                            <Text style={styles.statLabel}>Available</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <WifiOff size={16} color="#94A3B8" />
                            <Text style={styles.statValue}>
                                {driverLocations.filter(d => d.status === 'OFFLINE').length}
                            </Text>
                            <Text style={styles.statLabel}>Offline</Text>
                        </View>
                    </View>
                )}

                {/* Driver Job Card */}
                {isDriver && isOnline && (
                    <View style={styles.jobCardContainer}>
                        <TouchableOpacity
                            style={styles.jobCardToggle}
                            onPress={() => setShowJobCard(!showJobCard)}
                        >
                            <View style={styles.dragIndicator} />
                            {showJobCard ? <ChevronDown size={18} color={Colors.textSecondary} /> : <ChevronUp size={18} color={Colors.textSecondary} />}
                        </TouchableOpacity>
                        {showJobCard && (
                            <View style={styles.jobCard}>
                                <View style={styles.jobCardHeader}>
                                    <View style={styles.jobBadge}>
                                        <Package size={14} color="#fff" />
                                        <Text style={styles.jobBadgeText}>Active Job</Text>
                                    </View>
                                    <Text style={styles.jobNumber}>CYV-2026-0847</Text>
                                </View>

                                <View style={styles.jobRoute}>
                                    <View style={styles.routePoint}>
                                        <View style={[styles.routeDot, { backgroundColor: '#11a7fa' }]} />
                                        <View>
                                            <Text style={styles.routeLabel}>Pickup</Text>
                                            <Text style={styles.routeAddress}>15 Kingsway, Swansea SA1 5JQ</Text>
                                        </View>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
                                        <View>
                                            <Text style={styles.routeLabel}>Dropoff</Text>
                                            <Text style={styles.routeAddress}>Queens Arcade, Cardiff CF10 2BY</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.jobFooter}>
                                    <View style={styles.jobDetail}>
                                        <Clock size={14} color={Colors.textSecondary} />
                                        <Text style={styles.jobDetailText}>ETA 10:45</Text>
                                    </View>
                                    <View style={styles.jobDetail}>
                                        <Navigation size={14} color={Colors.textSecondary} />
                                        <Text style={styles.jobDetailText}>67.3 km</Text>
                                    </View>
                                    <View style={styles.jobPriceTag}>
                                        <Text style={styles.jobPrice}>£185.50</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: accent }]}>
                                    <Navigation size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Navigate to Pickup</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Carrier Driver List */}
                {isCarrier && (
                    <ScrollView style={styles.driverList} showsVerticalScrollIndicator={false}>
                        {driverLocations.map(d => (
                            <TouchableOpacity
                                key={d.driverId}
                                style={[
                                    styles.driverItem,
                                    selectedDriverId === d.driverId && styles.driverItemSelected,
                                ]}
                                onPress={() => setSelectedDriverId(d.driverId === selectedDriverId ? null : d.driverId)}
                            >
                                <View style={[styles.statusDot, {
                                    backgroundColor:
                                        d.status === 'ON_JOB' ? '#11a7fa'
                                            : d.status === 'AVAILABLE' ? '#3B82F6'
                                                : d.status === 'BREAK' ? '#F59E0B'
                                                    : '#94A3B8',
                                }]} />
                                <View style={styles.driverItemInfo}>
                                    <Text style={styles.driverItemName}>{d.driverName}</Text>
                                    <Text style={styles.driverItemStatus}>
                                        {d.vehicleType} • {d.status.replace('_', ' ')}
                                        {d.speed > 0 ? ` • ${Math.round(d.speed)} km/h` : ''}
                                    </Text>
                                </View>
                                <Truck size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.navy,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'web' ? 16 : 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    onlineText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    mapContainer: {
        flex: 1,
        minHeight: 300,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    jobCardContainer: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    jobCardToggle: {
        alignItems: 'center',
        paddingVertical: 8,
        gap: 4,
    },
    dragIndicator: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    jobCard: {
        padding: 16,
        paddingTop: 0,
    },
    jobCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    jobBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    jobBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    jobNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    jobRoute: {
        marginBottom: 14,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    routeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    routeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    routeAddress: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: Colors.border,
        marginLeft: 5,
        marginVertical: 2,
    },
    jobFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 14,
    },
    jobDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    jobDetailText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    jobPriceTag: {
        marginLeft: 'auto',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    jobPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#11a7fa',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    driverList: {
        maxHeight: 200,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    driverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    driverItemSelected: {
        backgroundColor: '#FFF7ED',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    driverItemInfo: {
        flex: 1,
    },
    driverItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    driverItemStatus: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 1,
    },
});
