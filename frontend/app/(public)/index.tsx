import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Clock, ShieldCheck, ArrowRight, Zap, Target, Search, Package, Calculator, CheckCircle, MapPin, TrendingUp, Headset, Star, Users, ArrowUpRight, BarChart3, Plane, Globe } from 'lucide-react-native';
import Head from 'expo-router/head';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostcodeAutocomplete } from '@/components/shared/PostcodeAutocomplete';

const IconMap: any = {
    Truck, Clock, ShieldCheck, Zap, Target, Package, Calculator, CheckCircle, MapPin, TrendingUp, Headset, Star, Users, ArrowUpRight, BarChart3, Plane, Globe
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} />;
};

export default function PublicHome() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const { homepageData, isLoaded } = useCMS();

    // Widget states
    const [collection, setCollection] = useState<any>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [isReadyNow, setIsReadyNow] = useState(true);
    const [vehicleType, setVehicleType] = useState('Medium Van');
    const [activeHeroTab, setActiveHeroTab] = useState<'quote' | 'track'>('quote');
    const [trackingNumber, setTrackingNumber] = useState('');

    const isMobile = SCREEN_WIDTH < 768;
    const isTablet = SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024;

    const handleContinue = async () => {
        if (!collection || !delivery) {
            alert('Please select both collection and delivery addresses.');
            return;
        }

        try {
            await AsyncStorage.setItem('last_quote_params', JSON.stringify({
                collection,
                delivery,
                ready: isReadyNow.toString(),
                vehicle: vehicleType
            }));
        } catch (e) {
            console.error('Failed to save quote params', e);
        }

        router.push({
            pathname: '/quote-details' as any,
            params: {
                pickupPostcode: collection.postcode,
                pickupAddress: JSON.stringify(collection),
                dropoffPostcode: delivery.postcode,
                dropoffAddress: JSON.stringify(delivery),
                pickupCoords: JSON.stringify({ lat: collection.latitude, lng: collection.longitude }),
                dropoffCoords: JSON.stringify({ lat: delivery.latitude, lng: delivery.longitude }),
                ready: isReadyNow.toString(),
                vehicle: vehicleType
            }
        });
    };

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const hero = homepageData['cms_heroConfig'] || {};
    const stats = homepageData['cms_statsConfig'] || { stats: [] };
    const services = homepageData['cms_servicesConfig'] || { banners: [] };
    const industries = homepageData['cms_industriesConfig'] || { industries: [] };
    const whyUs = homepageData['cms_whyUsConfig'] || { cards: [] };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>CYVhub | Smart B2B Same-Day Logistics & Courier Network UK</title>
                <meta name="description" content="The UK's most reliable B2B logistics platform. 60-minute collections, real-time tracking, and specialized sector expertise. Get an instant quote today." />
            </Head>

            {/* HERO & WIDGET SECTION */}
            <View style={[styles.heroBg, { height: isMobile ? 850 : 700 }]}>
                <Image 
                    source={{ uri: hero.bgImages?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop' }} 
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                
                <View style={[styles.contentMax, styles.heroWrapper, { flexDirection: isMobile ? 'column' : 'row' }]}>
                    <View style={styles.heroTextContent}>
                        <View style={styles.heroBadge}>
                            <Zap size={14} color="#FFF" />
                            <Text style={styles.heroBadgeText}>UK'S SMARTEST B2B NETWORK</Text>
                        </View>
                        <Text style={[styles.heroTitle, { fontSize: isMobile ? 40 : 64, lineHeight: isMobile ? 48 : 74 }]}>
                            {hero.headline}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {hero.subheading}
                        </Text>
                        <View style={styles.heroLogos}>
                            <Text style={styles.trustedBy}>TRUSTED BY LEADING ENTERPRISES ACROSS THE UK</Text>
                        </View>
                    </View>

                    <View style={styles.quoteWidget}>
                        <View style={styles.widgetTabs}>
                            <TouchableOpacity 
                                style={[styles.widgetTab, activeHeroTab === 'quote' && styles.widgetTabActive]}
                                onPress={() => setActiveHeroTab('quote')}
                            >
                                <Calculator size={18} color={activeHeroTab === 'quote' ? Colors.primary : '#64748B'} />
                                <Text style={[styles.widgetTabText, activeHeroTab === 'quote' && styles.widgetTabTextActive]}>Quick Quote</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.widgetTab, activeHeroTab === 'track' && styles.widgetTabActive]}
                                onPress={() => setActiveHeroTab('track')}
                            >
                                <Search size={18} color={activeHeroTab === 'track' ? Colors.primary : '#64748B'} />
                                <Text style={[styles.widgetTabText, activeHeroTab === 'track' && styles.widgetTabTextActive]}>Track</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.widgetBody}>
                            {activeHeroTab === 'quote' ? (
                                <>
                                    <PostcodeAutocomplete 
                                        label="Collection" 
                                        placeholder="Postcode or address"
                                        onAddressSelect={setCollection} 
                                        initialValue={collection} 
                                    />
                                    <View style={{ height: 16 }} />
                                    <PostcodeAutocomplete 
                                        label="Delivery" 
                                        placeholder="Postcode or address"
                                        onAddressSelect={setDelivery} 
                                        initialValue={delivery} 
                                    />
                                    
                                    <View style={styles.vehicleSelect}>
                                        <Text style={styles.fieldLabel}>Vehicle Required</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleScroll}>
                                            {['Small Van', 'Medium Van', 'Large Van', 'HGV'].map(v => (
                                                <TouchableOpacity 
                                                    key={v} 
                                                    style={[styles.vOption, vehicleType === v && styles.vOptionActive]}
                                                    onPress={() => setVehicleType(v)}
                                                >
                                                    <Text style={[styles.vOptionText, vehicleType === v && styles.vOptionTextActive]}>{v}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <TouchableOpacity style={styles.quoteBtn} onPress={handleContinue}>
                                        <Text style={styles.quoteBtnText}>Calculate Instant Quote</Text>
                                        <ArrowRight size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.trackContainer}>
                                    <Text style={styles.fieldLabel}>Enter Tracking ID</Text>
                                    <TextInput 
                                        style={styles.trackInput}
                                        placeholder="e.g. CYV-1234-5678"
                                        value={trackingNumber}
                                        onChangeText={setTrackingNumber}
                                    />
                                    <TouchableOpacity style={styles.quoteBtn} onPress={() => alert('Tracking available soon.')}>
                                        <Text style={styles.quoteBtnText}>Locate Shipment</Text>
                                        <Search size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* TRUST BAR / STATS */}
            <View style={styles.statsBar}>
                <View style={[styles.contentMax, styles.statsInner]}>
                    {stats.stats.map((stat: any) => (
                        <View key={stat.id} style={styles.statItem}>
                            <Text style={styles.statVal}>{stat.value}</Text>
                            <Text style={styles.statLab}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* SERVICES SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTag}>WHAT WE DO</Text>
                        <Text style={styles.sectionTitle}>Engineered for Excellence</Text>
                        <Text style={styles.sectionDesc}>B2B logistics solutions tailored to the unique demands of modern commerce.</Text>
                    </View>

                    <View style={styles.servicesGrid}>
                        {services.banners?.slice(0, 4).map((service: any) => (
                            <TouchableOpacity 
                                key={service.id} 
                                style={[styles.serviceCard, { width: SCREEN_WIDTH >= 1024 ? '23.5%' : isMobile ? '100%' : '48%' }]}
                                onPress={() => router.push(service.link as any)}
                            >
                                <Image source={{ uri: service.imageUrl }} style={styles.serviceImg} />
                                <View style={styles.serviceOverlay} />
                                <View style={styles.serviceContent}>
                                    <Text style={styles.serviceName}>{service.title}</Text>
                                    <Text style={styles.serviceLiteDesc}>{service.desc}</Text>
                                    <View style={styles.serviceLink}>
                                        <Text style={styles.serviceLinkText}>View Details</Text>
                                        <ArrowRight size={14} color="#FFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/services')}>
                        <Text style={styles.viewAllBtnText}>Explore All Services</Text>
                        <ArrowRight size={18} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* INDUSTRIES SECTION */}
            <View style={[styles.section, { backgroundColor: Colors.navy }]}>
                <View style={styles.contentMax}>
                    <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
                        <Text style={styles.sectionTagPrimary}>SECTOR EXPERTISE</Text>
                        <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Specialized for Your Industry</Text>
                        <Text style={[styles.sectionDesc, { textAlign: 'left', color: '#94A3B8' }]}>
                            From mission-critical aviation components to time-sensitive medical supplies, we understand your unique pressure points.
                        </Text>
                    </View>

                    <View style={styles.industryGrid}>
                        {industries.industries?.map((ind: any) => (
                            <TouchableOpacity 
                                key={ind.id} 
                                style={[styles.industryCard, { width: SCREEN_WIDTH >= 1024 ? '23.5%' : isMobile ? '100%' : '48%' }]}
                                onPress={() => router.push(`/industries/${ind.id}` as any)}
                            >
                                <Image source={{ uri: ind.imageUrl }} style={styles.industryImg} />
                                <View style={styles.industryOverlayDark} />
                                <View style={styles.industryInfo}>
                                    <Text style={styles.industryTitle}>{ind.title}</Text>
                                    <ArrowUpRight size={20} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* WHY CHOOSE US */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTag}>THE CYVHUB ADVANTAGE</Text>
                        <Text style={styles.sectionTitle}>Why Leading Businesses Choose Us</Text>
                    </View>

                    <View style={styles.whyGrid}>
                        {whyUs.cards?.map((card: any) => (
                            <View key={card.id} style={[styles.whyCard, { width: SCREEN_WIDTH >= 1024 ? '23.5%' : isMobile ? '100%' : '48%' }]}>
                                <View style={styles.whyIconBox}>
                                    <DynamicIcon name={card.icon} size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.whyTitle}>{card.title}</Text>
                                <Text style={styles.whyText}>{card.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* FINAL CTA */}
            <View style={styles.finalCta}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop' }} 
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(13, 148, 136, 0.9)' }]} />
                <View style={[styles.contentMax, styles.ctaContent]}>
                    <Text style={styles.ctaHeadline}>Ready to upgrade your logistics?</Text>
                    <Text style={styles.ctaBody}>Join over 1,200 businesses relying on CYVhub for their most critical shipments.</Text>
                    <View style={styles.ctaBtns}>
                        <TouchableOpacity style={styles.ctaPrimary} onPress={() => router.push('/contact')}>
                            <Text style={styles.ctaPrimaryText}>Open a Business Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.push('/services')}>
                            <Text style={styles.ctaSecondaryText}>View Our Fleet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: SCREEN_HEIGHT,
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    heroBg: {
        position: 'relative',
        justifyContent: 'center',
    },
    heroWrapper: {
        zIndex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 60,
    },
    heroTextContent: {
        flex: 1,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        alignSelf: 'flex-start',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    heroBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    heroTitle: {
        color: '#FFF',
        fontWeight: '900',
        marginBottom: 24,
    },
    heroSubtitle: {
        color: '#CBD5E1',
        fontSize: 20,
        lineHeight: 32,
        marginBottom: 40,
    },
    heroLogos: {
        marginTop: 20,
    },
    trustedBy: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    quoteWidget: {
        backgroundColor: '#FFF',
        width: '100%',
        maxWidth: 480,
        borderRadius: 32,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    widgetTabs: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 6,
    },
    widgetTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 26,
    },
    widgetTabActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    widgetTabText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
    },
    widgetTabTextActive: {
        color: Colors.primary,
    },
    widgetBody: {
        padding: 32,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.navy,
        marginBottom: 8,
    },
    vehicleSelect: {
        marginTop: 24,
        marginBottom: 32,
    },
    vehicleScroll: {
        gap: 10,
    },
    vOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    vOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    vOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    vOptionTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    quoteBtn: {
        backgroundColor: Colors.primary,
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    quoteBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    trackContainer: {
        gap: 20,
    },
    trackInput: {
        height: 60,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 18,
        fontWeight: '600',
        color: Colors.navy,
    },
    statsBar: {
        backgroundColor: '#FFF',
        paddingVertical: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    statsInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 30,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        minWidth: 120,
    },
    statVal: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 4,
    },
    statLab: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    section: {
        paddingVertical: 100,
    },
    sectionHeader: {
        alignItems: 'center',
        marginBottom: 60,
    },
    sectionTag: {
        fontSize: 13,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
        marginBottom: 16,
    },
    sectionTagPrimary: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FFF',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 4,
        letterSpacing: 2,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 20,
    },
    sectionDesc: {
        fontSize: 18,
        color: 'gray',
        textAlign: 'center',
        maxWidth: 700,
        lineHeight: 28,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    serviceCard: {
        height: 380,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    serviceImg: {
        width: '100%',
        height: '100%',
    },
    serviceOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    serviceContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 30,
        zIndex: 2,
    },
    serviceName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
    },
    serviceLiteDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    serviceLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceLinkText: {
        color: '#FFF',
        fontWeight: '700',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 60,
    },
    viewAllBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    industryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    industryCard: {
        height: 250,
        borderRadius: 20,
        overflow: 'hidden',
    },
    industryImg: {
        width: '100%',
        height: '100%',
    },
    industryOverlayDark: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    industryInfo: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    industryTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
    },
    whyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    whyCard: {
        backgroundColor: '#F8FAFC',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    whyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    whyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
    },
    whyText: {
        fontSize: 16,
        color: 'gray',
        lineHeight: 24,
    },
    finalCta: {
        height: 500,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ctaContent: {
        zIndex: 1,
        alignItems: 'center',
        textAlign: 'center',
    },
    ctaHeadline: {
        fontSize: SCREEN_WIDTH >= 768 ? 48 : 36,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaBody: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        maxWidth: 700,
        lineHeight: 32,
        marginBottom: 48,
    },
    ctaBtns: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
    },
    ctaPrimary: {
        backgroundColor: '#FFF',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 12,
    },
    ctaPrimaryText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '900',
    },
    ctaSecondary: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    ctaSecondaryText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    }
});
