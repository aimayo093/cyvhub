import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Phone,
    MessageCircle,
    MapPin,
    Clock,
    Package,
    CheckCircle,
    Truck,
    Navigation,
    ChevronLeft,
} from 'lucide-react-native';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import Colors from '@/constants/colors';
import { useLocation } from '@/providers/LocationProvider';
import { TrackingSession } from '@/types';

const STATUS_TIMELINE = [
    { key: 'PENDING', label: 'Order Placed', icon: Package },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { key: 'DRIVER_ASSIGNED', label: 'Driver Assigned', icon: Truck },
    { key: 'PICKED_UP', label: 'Picked Up', icon: Package },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: Navigation },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export default function TrackDeliveryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        deliveryId?: string;
        driverName?: string;
        driverPhone?: string;
        vehicleType?: string;
    }>();

    const [session, setSession] = React.useState<TrackingSession | null>(null);
    const [loading, setLoading] = React.useState(true);

    // Fallback data loading for MVP
    React.useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    if (loading || !session) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Track Delivery</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff' }}>Tracking data not available.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const driverName = params.driverName || session?.driverName || 'Driver';
    const driverPhone = params.driverPhone || session?.driverPhone;
    const vehicleType = params.vehicleType || session?.vehicleType || 'Van';
    const currentStatus = session?.status || 'PENDING';

    const handleCall = () => {
        if (driverPhone) {
            Linking.openURL(`tel:${driverPhone}`);
        }
    };

    const getStatusIndex = (status: string) => {
        return STATUS_TIMELINE.findIndex(s => s.key === status);
    };

    const currentIdx = getStatusIndex(currentStatus);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Track Delivery</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Live Map */}
                <View style={styles.mapWrapper}>
                    <LiveTrackingMap
                        driverId={session.driverId}
                        pickupLatitude={session.pickupLatitude}
                        pickupLongitude={session.pickupLongitude}
                        dropoffLatitude={session.dropoffLatitude}
                        dropoffLongitude={session.dropoffLongitude}
                        driverName={driverName}
                        driverPhone={driverPhone}
                        vehicleType={vehicleType}
                        estimatedArrival={session.estimatedArrival}
                        status={currentStatus}
                        height={380}
                    />
                </View>

                {/* ETA Banner */}
                <View style={styles.etaBanner}>
                    <Clock size={18} color={Colors.customerPrimary} />
                    <View style={styles.etaContent}>
                        <Text style={styles.etaLabel}>Estimated Arrival</Text>
                        <Text style={styles.etaTime}>10:45 AM</Text>
                    </View>
                    <View style={styles.etaDistance}>
                        <Text style={styles.etaDistanceValue}>{session.distanceRemaining} km</Text>
                        <Text style={styles.etaDistanceLabel}>remaining</Text>
                    </View>
                </View>

                {/* Driver Contact Card */}
                <View style={styles.contactCard}>
                    <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>🚛</Text>
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{driverName}</Text>
                        <Text style={styles.contactVehicle}>{vehicleType} • CYV-DRV-001</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.ratingText}>⭐ 4.92</Text>
                            <Text style={styles.ratingCount}>(847 deliveries)</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Phone size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageButton}>
                        <MessageCircle size={18} color={Colors.customerPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Status Timeline */}
                <View style={styles.timelineCard}>
                    <Text style={styles.timelineTitle}>Delivery Progress</Text>
                    {STATUS_TIMELINE.map((step, index) => {
                        const isCompleted = index <= currentIdx;
                        const isCurrent = index === currentIdx;
                        const StepIcon = step.icon;
                        return (
                            <View key={step.key} style={styles.timelineStep}>
                                <View style={styles.timelineLeft}>
                                    <View style={[
                                        styles.timelineDot,
                                        isCompleted && styles.timelineDotCompleted,
                                        isCurrent && styles.timelineDotCurrent,
                                    ]}>
                                        <StepIcon size={12} color={isCompleted ? '#fff' : '#94A3B8'} />
                                    </View>
                                    {index < STATUS_TIMELINE.length - 1 && (
                                        <View style={[
                                            styles.timelineConnector,
                                            isCompleted && styles.timelineConnectorCompleted,
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.timelineLabel,
                                        isCompleted && styles.timelineLabelCompleted,
                                        isCurrent && styles.timelineLabelCurrent,
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {isCurrent && (
                                        <Text style={styles.timelineSubtext}>Driver is on the way</Text>
                                    )}
                                </View>
                                {isCompleted && !isCurrent && (
                                    <CheckCircle size={16} color={Colors.customerPrimary} />
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Delivery Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Delivery Details</Text>
                    <View style={styles.detailRow}>
                        <View style={[styles.detailDot, { backgroundColor: '#11a7fa' }]} />
                        <View>
                            <Text style={styles.detailLabel}>Pickup</Text>
                            <Text style={styles.detailValue}>15 Kingsway, Swansea SA1 5JQ</Text>
                        </View>
                    </View>
                    <View style={styles.detailConnector} />
                    <View style={styles.detailRow}>
                        <View style={[styles.detailDot, { backgroundColor: '#EF4444' }]} />
                        <View>
                            <Text style={styles.detailLabel}>Dropoff</Text>
                            <Text style={styles.detailValue}>Queens Arcade, Cardiff CF10 2BY</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        backgroundColor: Colors.navy,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingTop: Platform.OS === 'web' ? 14 : 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    mapWrapper: {
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    etaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#99F6E4',
        gap: 12,
    },
    etaContent: {
        flex: 1,
    },
    etaLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    etaTime: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.customerPrimary,
    },
    etaDistance: {
        alignItems: 'flex-end',
    },
    etaDistanceValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    etaDistanceLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    contactAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactAvatarText: {
        fontSize: 28,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    contactVehicle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    ratingCount: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.customerPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    timelineCard: {
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 14,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
    },
    timelineDot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineDotCompleted: {
        backgroundColor: Colors.customerPrimary,
    },
    timelineDotCurrent: {
        backgroundColor: Colors.customerPrimary,
        borderWidth: 3,
        borderColor: '#99F6E4',
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    timelineConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#E2E8F0',
    },
    timelineConnectorCompleted: {
        backgroundColor: Colors.customerPrimary,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 10,
        paddingBottom: 20,
    },
    timelineLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    timelineLabelCompleted: {
        color: Colors.text,
        fontWeight: '600',
    },
    timelineLabelCurrent: {
        color: Colors.customerPrimary,
        fontWeight: '700',
    },
    timelineSubtext: {
        fontSize: 12,
        color: Colors.customerPrimary,
        marginTop: 2,
    },
    detailsCard: {
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 14,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    detailConnector: {
        width: 2,
        height: 16,
        backgroundColor: Colors.border,
        marginLeft: 5,
        marginVertical: 2,
    },
});
