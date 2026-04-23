import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { CheckCircle, ArrowLeft } from 'lucide-react-native';
import { Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient, setToken } from '@/services/api';
import Colors from '@/constants/colors';
import { useQuoteStore } from '@/hooks/useQuoteStore';
import { usePayments } from '@/providers/PaymentProvider';

const Stepper = ({ currentStep }: { currentStep: number }) => {
    return (
        <View style={styles.stepperContainer}>
            <View style={[styles.stepBox, currentStep === 1 && styles.stepBoxActive, currentStep > 1 && styles.stepBoxCompleted]}>
                <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive, currentStep > 1 && styles.stepTextActive]}>QUOTE REQUEST</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 2 && styles.stepBoxActive, currentStep > 2 && styles.stepBoxCompleted]}>
                <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive, currentStep > 2 && styles.stepTextActive]}>BOOKING DETAILS</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 3 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 3 && styles.stepTextActive]}>REVIEW & BOOK</Text>
            </View>
        </View>
    );
};

export default function GuestReviewPage() {
    const { 
        fromAddress, fromPostcode, senderPhone, 
        toAddress, toPostcode, receiverPhone,
        parcels: storedParcels, totalDistanceMiles,
        estimatedPrice, selectedServiceType 
    } = useQuoteStore();
    const params = useLocalSearchParams();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [bookingRef, setBookingRef] = useState<string>('');

    const price = estimatedPrice || Number(params.price || 0);
    const vatAmount = price * 0.2;
    const totalIncVat = price + vatAmount;

    const { initiateStripeCheckout } = usePayments();

    const handleConfirmAndPay = async () => {
        if (isSubmitting) return; // Prevent double-click
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            // Step 1: Create the delivery booking
            const parcels = params.parcels ? JSON.parse(params.parcels as string) : [];
            
            const response = await apiClient('/deliveries', {
                method: 'POST',
                body: JSON.stringify({
                    guestEmail: params.email,
                    pickupContactName: `${params.firstName} ${params.lastName}`,
                    pickupContactPhone: senderPhone, 
                    pickupAddressLine1: params.collectionAddress || fromAddress,
                    pickupCity: params.collectionCity || 'Unknown', 
                    pickupPostcode: fromPostcode,
                    dropoffContactName: `${params.firstName} ${params.lastName}`,
                    dropoffContactPhone: receiverPhone,
                    dropoffAddressLine1: params.deliveryAddress || toAddress,
                    dropoffCity: params.deliveryCity || 'Unknown',
                    dropoffPostcode: toPostcode,
                    vehicleType: 'Standard Vehicle', // Could be from store if we had it
                    parcels: storedParcels.map((p: any) => ({
                        lengthCm: p.lengthCm,
                        widthCm: p.widthCm,
                        heightCm: p.heightCm,
                        weightKg: p.weightKg,
                        quantity: p.quantity,
                        description: p.description || 'Guest Item'
                    })),
                    distanceKm: totalDistanceMiles ? totalDistanceMiles * 1.609 : 20,
                    senderPhone, // Include specifically as requested
                    receiverPhone
                })
            });

            if (!response || !response.data || !response.data.id) {
                throw new Error('Could not retrieve delivery ID from response.');
            }

            const delivery = response.data;
            setBookingRef(delivery.jobNumber || delivery.trackingNumber);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Delivery created successfully. Redirect to branded checkout.
            if (Platform.OS === 'web') {
                const paramsData = new URLSearchParams({
                    jobId: delivery.id,
                    jobNumber: delivery.jobNumber || delivery.trackingNumber,
                    amount: delivery.calculatedPrice?.toString() || price.toString(),
                    pickup: delivery.pickupCity !== 'Unknown' ? delivery.pickupCity : (delivery.pickupPostcode || params.collection as string),
                    dropoff: delivery.dropoffCity !== 'Unknown' ? delivery.dropoffCity : (delivery.dropoffPostcode || params.delivery as string),
                    vehicleType: delivery.vehicleType || params.vehicleType as string,
                    serviceType: delivery.jobType || params.serviceType as string,
                });
                window.location.href = `/checkout?${paramsData.toString()}`;
            } else {
                router.push({
                    pathname: '/checkout' as any,
                    params: {
                        jobId: delivery.id,
                        jobNumber: delivery.jobNumber || delivery.trackingNumber,
                        amount: delivery.calculatedPrice?.toString() || price.toString(),
                        pickup: delivery.pickupCity !== 'Unknown' ? delivery.pickupCity : (delivery.pickupPostcode || params.collection),
                        dropoff: delivery.dropoffCity !== 'Unknown' ? delivery.dropoffCity : (delivery.dropoffPostcode || params.delivery),
                        vehicleType: delivery.vehicleType || params.vehicleType,
                        serviceType: delivery.jobType || params.serviceType,
                    }
                });
            }
        } catch (error: any) {
            console.error('Booking failed:', error);
            const msg = error?.message || 'We could not create your booking. Please try again.';
            setErrorMessage(msg);
            Alert.alert('Booking Failed', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <View style={styles.successContainer}>
                <CheckCircle size={80} color={Colors.success} />
                <Text style={styles.successTitle}>Booking Confirmed!</Text>
                <Text style={styles.successDesc}>
                    Thank you {params.firstName}. Your booking reference is <Text style={{ fontWeight: '700' }}>{bookingRef}</Text>.
                    {'\n\n'}
                    We have sent a tracking link and receipt to {params.email}.
                </Text>
                <Link 
                    href="/" 
                    asChild
                    onClick={(e) => {
                        if (Platform.OS === 'web') {
                            e.preventDefault();
                            window.location.href = '/';
                        }
                    }}
                >
                    <TouchableOpacity style={styles.successBtn} activeOpacity={0.8}>
                        <Text style={styles.successBtnText}>Return to Home</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Stepper currentStep={3} />

            <View style={styles.content}>
                <Text style={styles.pageTitle}>Review & Book</Text>

                <View style={styles.reviewGrid}>
                    <View style={styles.mainCol}>
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Route Summary</Text>

                            <View style={styles.routeBox}>
                                <View style={styles.routeItem}>
                                    <Text style={styles.routeLabel}>Collection</Text>
                                    <Text style={styles.routeValue}>{params.collectionAddress}</Text>
                                </View>
                                <View style={styles.routeItem}>
                                    <Text style={styles.routeLabel}>Delivery</Text>
                                    <Text style={styles.routeValue}>{params.deliveryAddress}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Contact Details</Text>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Guest Name:</Text>
                                <Text style={styles.dataValue}>{params.firstName} {params.lastName}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Email:</Text>
                                <Text style={styles.dataValue}>{params.email}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Sender Phone:</Text>
                                <Text style={styles.dataValue}>{senderPhone}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Receiver Phone:</Text>
                                <Text style={styles.dataValue}>{receiverPhone}</Text>
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Parcel Details</Text>
                            {storedParcels.map((p, idx) => (
                                <View key={idx} style={styles.parcelRow}>
                                    <Text style={styles.parcelInfo}>
                                        {p.quantity}x {p.lengthCm}x{p.widthCm}x{p.heightCm}cm ({p.weightKg}kg)
                                    </Text>
                                    <Text style={styles.parcelDesc}>{p.description || 'No description'}</Text>
                                </View>
                            ))}
                            <View style={[styles.dataRow, { marginTop: 12 }]}>
                                <Text style={styles.dataLabel}>Total Distance:</Text>
                                <Text style={styles.dataValue}>{totalDistanceMiles?.toFixed(1)} miles</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sideCol}>
                        <View style={styles.paymentCard}>
                            <Text style={styles.sectionTitle}>Payment Summary</Text>

                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Service:</Text>
                                <Text style={styles.dataValue}>{params.serviceType}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Vehicle:</Text>
                                <Text style={styles.dataValue}>{params.vehicleType}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>Subtotal:</Text>
                                <Text style={styles.dataValue}>{price > 0 ? `£${price.toFixed(2)}` : 'TBC'}</Text>
                            </View>
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>VAT (20%):</Text>
                                <Text style={styles.dataValue}>{price > 0 ? `£${vatAmount.toFixed(2)}` : 'TBC'}</Text>
                            </View>

                            <View style={[styles.divider, { borderTopWidth: 2, borderTopColor: '#1a237e' }]} />

                            <View style={styles.dataRow}>
                                <Text style={styles.totalLabel}>Total to Pay:</Text>
                                <Text style={styles.totalValue}>{price > 0 ? `£${totalIncVat.toFixed(2)}` : 'TBC'}</Text>
                            </View>

                            {errorMessage && (
                                <View style={styles.errorBanner}>
                                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.payBtn, isSubmitting && { opacity: 0.7 }, price === 0 && { backgroundColor: Colors.primary }]}
                                activeOpacity={0.8}
                                onPress={handleConfirmAndPay}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ActivityIndicator color="#FFFFFF" style={{ marginRight: 10 }} />
                                        <Text style={styles.payBtnText}>Processing...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.payBtnText}>
                                        {errorMessage ? 'Retry Submission' : (price > 0 ? 'Confirm & Pay' : 'Submit for Manual Quote')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.secureText}>{price > 0 ? '🔒 Secure payment via Stripe' : 'Our team will review your requirements'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Back to Details</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    stepBox: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    stepBoxCompleted: {
        backgroundColor: '#1E293B',
    },
    stepBoxActive: {
        backgroundColor: '#3498db',
    },
    stepText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 14,
    },
    stepTextActive: {
        color: '#FFFFFF',
    },
    stepConnector: {
        width: 40,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -5,
        zIndex: -1,
    },
    content: {
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
        padding: 24,
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1a237e',
        marginBottom: 24,
    },
    reviewGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    },
    mainCol: {
        flex: 1.5,
    },
    sideCol: {
        flex: 1,
        marginLeft: Platform.OS === 'web' ? 24 : 0,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    parcelRow: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    parcelInfo: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a237e',
    },
    parcelDesc: {
        fontSize: 12,
        color: '#64748b',
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 24,
        borderWidth: 1,
        borderColor: '#3498db', // Highlight border for action area
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 20,
    },
    routeBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    routeItem: {
        marginBottom: 16,
    },
    routeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    routeValue: {
        fontSize: 16,
        color: '#1a237e',
        lineHeight: 24,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dataLabel: {
        fontSize: 15,
        color: '#64748b',
    },
    dataValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a237e',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a237e',
    },
    payBtn: {
        backgroundColor: '#0066FF', // Success Green
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    payBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    secureText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 60,
    },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    backBtnText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 16,
    },

    // Success View
    successContainer: {
        flex: 1,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#166534',
        marginTop: 24,
        marginBottom: 16,
    },
    successDesc: {
        fontSize: 18,
        color: '#15803D',
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 28,
        marginBottom: 40,
    },
    successBtn: {
        backgroundColor: '#16A34A',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 8,
    },
    successBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    errorBanner: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    errorBannerText: {
        color: '#991B1B',
        fontSize: 14,
        lineHeight: 20,
    }
});
