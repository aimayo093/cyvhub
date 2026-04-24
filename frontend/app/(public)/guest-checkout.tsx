import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuoteStore } from '@/hooks/useQuoteStore';

const Stepper = ({ currentStep }: { currentStep: number }) => {
    return (
        <View style={styles.stepperContainer}>
            <View style={[styles.stepBox, currentStep === 1 && styles.stepBoxActive, currentStep > 1 && styles.stepBoxCompleted]}>
                <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive, currentStep > 1 && styles.stepTextActive]}>QUOTE REQUEST</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 2 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>BOOKING DETAILS</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 3 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 3 && styles.stepTextActive]}>REVIEW & BOOK</Text>
            </View>
        </View>
    );
};

export default function GuestCheckoutPage() {
    const { 
        fromAddress,
        toAddress,
        estimatedPrice, selectedServiceType, selectedVehicleType
    } = useQuoteStore();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [collectionAddress, setCollectionAddress] = useState(fromAddress);
    const [deliveryAddress, setDeliveryAddress] = useState(toAddress);

    const handleContinue = () => {
        if (!email.trim() || !firstName.trim() || !lastName.trim() || !collectionAddress.trim() || !deliveryAddress.trim()) {
            alert('Please fill in all required fields to proceed.');
            return;
        }

        if (Platform.OS === 'web') {
            const params = new URLSearchParams({
                email,
                firstName,
                lastName,
                collectionAddress,
                deliveryAddress,
                vehicleType: selectedVehicleType || 'Medium Van',
                serviceType: selectedServiceType || 'SAME DAY'
            });
            window.location.href = `/guest-review?${params.toString()}`;
        } else {
            router.push({
                pathname: '/guest-review',
                params: {
                    email,
                    firstName,
                    lastName,
                    collectionAddress,
                    deliveryAddress,
                    vehicleType: selectedVehicleType || 'Medium Van',
                    serviceType: selectedServiceType || 'SAME DAY'
                }
            });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stepper currentStep={2} />

            <View style={styles.content}>
                <Text style={styles.pageTitle}>Booking Details</Text>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Guest Information</Text>
                    <Text style={styles.sectionSubtitle}>We need an email address to send your booking confirmation and tracking link.</Text>

                    <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address <Text style={styles.req}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="e.g. name@company.com"
                            />
                        </View>
                    </View>

                    <View style={styles.formRowMulti}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>First Name <Text style={styles.req}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Last Name <Text style={styles.req}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Collection Address</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Address <Text style={styles.req}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={collectionAddress}
                            onChangeText={setCollectionAddress}
                            multiline
                            numberOfLines={3}
                            placeholder="Street address, City, Postcode"
                        />
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Address <Text style={styles.req}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            multiline
                            numberOfLines={3}
                            placeholder="Street address, City, Postcode"
                        />
                    </View>
                </View>

                {/* SUMMARY RIBBON */}
                <View style={styles.summaryRibbon}>
                    <View>
                        <Text style={styles.ribbonLight}>Selected Service</Text>
                        <Text style={styles.ribbonDark}>{selectedServiceType === 'MANUAL' ? 'Manual Quote Request' : `${selectedServiceType || 'SAME DAY'} - ${selectedVehicleType || 'Medium Van'}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.ribbonDark}>
                            {estimatedPrice && estimatedPrice > 0 ? `£${Number(estimatedPrice).toFixed(2)}` : 'Price TBC'}
                        </Text>
                        <Text style={styles.ribbonLight}>{estimatedPrice && estimatedPrice > 0 ? 'excl. VAT' : 'Subject to review'}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Back to Quotes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.continueBtn} activeOpacity={0.8} onPress={handleContinue}>
                        <Text style={styles.continueBtnText}>Continue to Review</Text>
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
        maxWidth: 800,
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
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 24,
    },
    formRow: {
        marginBottom: 20,
    },
    formRowMulti: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    },
    inputGroup: {
        flexDirection: 'column',
        marginRight: Platform.OS === 'web' ? 20 : 0,
        marginBottom: Platform.OS === 'web' ? 0 : 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a237e',
        marginBottom: 8,
    },
    req: {
        color: '#e53935',
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        height: 48,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        height: 80,
        paddingVertical: 12,
        textAlignVertical: 'top',
    },
    summaryRibbon: {
        backgroundColor: '#E0F2FE', // Light blue
        padding: 20,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    ribbonLight: {
        fontSize: 14,
        color: '#0284C7',
    },
    ribbonDark: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0369A1',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    continueBtn: {
        backgroundColor: '#3498db',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 4,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    }
});
