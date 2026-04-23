import React, { useState, useMemo } from 'react';
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
    Users,
    Filter,
    Eye,
    Wifi,
    WifiOff,
    Coffee,
    Briefcase,
} from 'lucide-react-native';
import MapView from '@/components/MapView';
import { useLocation } from '@/providers/LocationProvider';
import Colors from '@/constants/colors';

type StatusFilter = 'all' | 'ON_JOB' | 'AVAILABLE' | 'BREAK' | 'OFFLINE';

export default function AdminTrackingScreen() {
    const { driverLocations, getAllDrivers } = useLocation();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    const filteredDrivers = useMemo(() => {
        if (statusFilter === 'all') return driverLocations;
        return driverLocations.filter(d => d.status === statusFilter);
    }, [driverLocations, statusFilter]);

    const markers = useMemo(() => {
        return filteredDrivers.map(d => ({
            id: d.driverId,
            latitude: d.latitude,
            longitude: d.longitude,
            title: `${d.driverName} (${d.status.replace('_', ' ')})`,
            type: (d.status === 'ON_JOB' ? 'driver' : 'carrier') as 'driver' | 'carrier',
            heading: d.heading,
        }));
    }, [filteredDrivers]);

    const totalDrivers = driverLocations.length;
    const onJobCount = driverLocations.filter(d => d.status === 'ON_JOB').length;
    const availableCount = driverLocations.filter(d => d.status === 'AVAILABLE').length;
    const breakCount = driverLocations.filter(d => d.status === 'BREAK').length;
    const offlineCount = driverLocations.filter(d => d.status === 'OFFLINE').length;

    const filters: { key: StatusFilter; label: string; count: number; color: string; icon: typeof Truck }[] = [
        { key: 'all', label: 'All', count: totalDrivers, color: Colors.adminPrimary, icon: Users },
        { key: 'ON_JOB', label: 'On Job', count: onJobCount, color: '#0066FF', icon: Briefcase },
        { key: 'AVAILABLE', label: 'Available', count: availableCount, color: '#3B82F6', icon: Wifi },
        { key: 'BREAK', label: 'Break', count: breakCount, color: '#F59E0B', icon: Coffee },
        { key: 'OFFLINE', label: 'Offline', count: offlineCount, color: '#94A3B8', icon: WifiOff },
    ];

    const statusColors: Record<string, string> = {
        ON_JOB: '#0066FF',
        AVAILABLE: '#3B82F6',
        BREAK: '#F59E0B',
        OFFLINE: '#94A3B8',
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Navigation size={22} color="#fff" />
                        <Text style={styles.headerTitle}>Live Tracking</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <Radio size={12} color="#0066FF" />
                        <Text style={styles.headerBadgeText}>{onJobCount} active</Text>
                    </View>
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {filters.map(f => {
                        const isActive = statusFilter === f.key;
                        const Icon = f.icon;
                        return (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterPill, isActive && { backgroundColor: f.color }]}
                                onPress={() => setStatusFilter(f.key)}
                            >
                                <Icon size={14} color={isActive ? '#fff' : f.color} />
                                <Text style={[styles.filterText, isActive && { color: '#fff' }]}>
                                    {f.label} ({f.count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Map */}
                <View style={styles.mapContainer}>
                    <MapView
                        center={{ latitude: 51.6000, longitude: -3.6000 }}
                        zoom={9}
                        markers={markers}
                        height="100%"
                    />
                </View>

                {/* Utilization Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statPercent}>{Math.round((onJobCount / totalDrivers) * 100)}%</Text>
                        <Text style={styles.statCardLabel}>Utilization</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statPercent, { color: '#0066FF' }]}>{onJobCount}</Text>
                        <Text style={styles.statCardLabel}>Active Jobs</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statPercent, { color: '#3B82F6' }]}>{availableCount}</Text>
                        <Text style={styles.statCardLabel}>Ready</Text>
                    </View>
                </View>

                {/* Driver List */}
                <ScrollView style={styles.driverList} showsVerticalScrollIndicator={false}>
                    {filteredDrivers.map(d => (
                        <TouchableOpacity
                            key={d.driverId}
                            style={[
                                styles.driverItem,
                                selectedDriverId === d.driverId && styles.driverItemSelected,
                            ]}
                            onPress={() => setSelectedDriverId(d.driverId === selectedDriverId ? null : d.driverId)}
                        >
                            <View style={[styles.statusDot, { backgroundColor: statusColors[d.status] || '#94A3B8' }]} />
                            <View style={styles.driverItemInfo}>
                                <Text style={styles.driverItemName}>{d.driverName}</Text>
                                <Text style={styles.driverItemMeta}>
                                    {d.vehicleType} • {d.status.replace('_', ' ')}
                                    {d.currentJobId ? ` • Job ${d.currentJobId}` : ''}
                                </Text>
                            </View>
                            {d.speed > 0 && (
                                <View style={styles.speedBadge}>
                                    <Text style={styles.speedText}>{Math.round(d.speed)} km/h</Text>
                                </View>
                            )}
                            <Eye size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
        backgroundColor: Colors.adminPrimary,
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
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    headerBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    filterRow: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    mapContainer: {
        flex: 1,
        minHeight: 280,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 10,
    },
    statPercent: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.adminPrimary,
    },
    statCardLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
    driverList: {
        maxHeight: 200,
        backgroundColor: Colors.surface,
    },
    driverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        gap: 10,
    },
    driverItemSelected: {
        backgroundColor: '#FEF2F2',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    driverItemInfo: {
        flex: 1,
    },
    driverItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    driverItemMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    speedBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    speedText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primary,
    },
});
