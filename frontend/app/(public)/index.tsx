import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform, useWindowDimensions, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Clock, ShieldCheck, ArrowRight, Zap, Target, Search, Package, Calculator, CheckCircle, MapPin, TrendingUp, Headset, Star, Users, ArrowUpRight, BarChart3, Plane, Globe } from 'lucide-react-native';
import Head from 'expo-router/head';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import { initialHomepageData } from '@/constants/cmsDefaults';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostcodeAutocomplete } from '@/components/shared/PostcodeAutocomplete';
import { useQuoteStore } from '@/hooks/useQuoteStore';
import { apiClient } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    const { fromAddress, fromPostcode, senderPhone, toAddress, toPostcode, receiverPhone, setStep1, setDistance } = useQuoteStore();
    const [collection, setCollection] = useState<any>(null);
    const [delivery, setDelivery] = useState<any>(null);
    const [sPhone, setSPhone] = useState(senderPhone);
    const [rPhone, setRPhone] = useState(receiverPhone);
    const [phoneErrors, setPhoneErrors] = useState({ sender: '', receiver: '' });
    const [isCalculating, setIsCalculating] = useState(false);

    const [isReadyNow, setIsReadyNow] = useState(true);
    const [vehicleType, setVehicleType] = useState('Medium Van');
    const [activeHeroTab, setActiveHeroTab] = useState<'quote' | 'track'>('quote');
    const [trackingNumber, setTrackingNumber] = useState('');

    useEffect(() => {
        if (fromPostcode) setCollection({ postcode: fromPostcode, formatted: fromAddress });
        if (toPostcode) setDelivery({ postcode: toPostcode, formatted: toAddress });
    }, []);

    const UK_PHONE_REGEX = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$|^(\+44\s?[12]\d{2,4}|\(?0[12]\d{2,4}\)?)\s?\d{3,4}\s?\d{3,4}$/;

    const validatePhone = (phone: string) => UK_PHONE_REGEX.test(phone.trim());

    const servicesScrollRef = useRef<ScrollView>(null);
    const industriesScrollRef = useRef<ScrollView>(null);

    const [servicesOffset, setServicesOffset] = useState(0);
    const [industriesOffset, setIndustriesOffset] = useState(0);

    // Auto-scroll states
    const [servicesAutoScroll, setServicesAutoScroll] = useState(true);
    const [industriesAutoScroll, setIndustriesAutoScroll] = useState(true);
    const servicesAutoScrollRef = useRef<NodeJS.Timeout | null>(null);
    const industriesAutoScrollRef = useRef<NodeJS.Timeout | null>(null);

    const scrollSlider = (ref: React.RefObject<ScrollView> | null, direction: 'left' | 'right', type: 'services' | 'industries') => {
        if (!ref || !ref.current) return;

        const stride = cardStride; // computed from responsive layout
        const currentOffset = type === 'services' ? servicesOffset : industriesOffset;
        const setOffset = type === 'services' ? setServicesOffset : setIndustriesOffset;

        let newOffset = direction === 'left' ? currentOffset - stride : currentOffset + stride;

        if (newOffset < 0) newOffset = 0;

        ref.current.scrollTo({
            x: newOffset,
            animated: true
        });
        setOffset(newOffset);
    };

    const handleScroll = (event: any, type: 'services' | 'industries') => {
        const x = event.nativeEvent.contentOffset.x;
        if (type === 'services') setServicesOffset(x);
        else setIndustriesOffset(x);
    };

    // Auto-scroll effect for services
    useEffect(() => {
        if (!servicesAutoScroll) return;

        if (servicesAutoScrollRef.current) {
            clearInterval(servicesAutoScrollRef.current as NodeJS.Timeout);
        }

        servicesAutoScrollRef.current = setInterval(() => {
            scrollSlider(servicesScrollRef as React.RefObject<ScrollView>, 'right', 'services');
        }, 4000) as any;

        return () => {
            if (servicesAutoScrollRef.current) {
                clearInterval(servicesAutoScrollRef.current as NodeJS.Timeout);
            }
        };
    }, [servicesAutoScroll]);

    // Auto-scroll effect for industries
    useEffect(() => {
        if (!industriesAutoScroll) return;

        if (industriesAutoScrollRef.current) {
            clearInterval(industriesAutoScrollRef.current as NodeJS.Timeout);
        }

        industriesAutoScrollRef.current = setInterval(() => {
            scrollSlider(industriesScrollRef as React.RefObject<ScrollView>, 'right', 'industries');
        }, 4000) as any;

        return () => {
            if (industriesAutoScrollRef.current) {
                clearInterval(industriesAutoScrollRef.current as NodeJS.Timeout);
            }
        };
    }, [industriesAutoScroll]);

    const isMobile = SCREEN_WIDTH < 768;
    const isTablet = SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024;

    // Responsive slider config
    const spaceBetween = SCREEN_WIDTH < 480 ? 16 : SCREEN_WIDTH < 768 ? 16 : SCREEN_WIDTH < 1280 ? 20 : 24;
    const visibleCards = SCREEN_WIDTH < 480 ? 1 : SCREEN_WIDTH < 768 ? 2 : SCREEN_WIDTH < 1280 ? 3 : 4;
    // Available width for slider: contentMax has maxWidth 1200, padded 24px each side
    const contentWidth = Math.min(SCREEN_WIDTH - 48, 1200 - 48);
    const cardWidth = Math.floor((contentWidth - spaceBetween * (visibleCards - 1)) / visibleCards);
    const cardStride = cardWidth + spaceBetween;

    // Calculate current index for dot indicators
    const servicesCurrentIndex = Math.round(servicesOffset / cardStride);
    const industriesCurrentIndex = Math.round(industriesOffset / cardStride);

    const handleContinue = async () => {
        if (!collection || !delivery) {
            alert('Please select both collection and delivery addresses.');
            return;
        }

        const senderValid = validatePhone(sPhone);
        const receiverValid = validatePhone(rPhone);

        if (!senderValid || !receiverValid) {
            setPhoneErrors({
                sender: senderValid ? '' : 'Please enter a valid UK phone number',
                receiver: receiverValid ? '' : 'Please enter a valid UK phone number'
            });
            return;
        }

        setIsCalculating(true);
        try {
            // Calculate distance immediately before advancing
            const response = await apiClient('/quotes/calculate', {
                method: 'POST',
                body: JSON.stringify({
                    pickupPostcode: collection.postcode,
                    dropoffPostcode: delivery.postcode,
                    items: [{ lengthCm: 10, widthCm: 10, heightCm: 10, weightKg: 1, quantity: 1 }] // Dummy item for distance calc
                })
            });

            const distMiles = response?.distanceMiles || null;
            
            setStep1({
                fromAddress: collection.formatted || collection.line1 || collection.postcode,
                fromPostcode: collection.postcode,
                senderPhone: sPhone,
                toAddress: delivery.formatted || delivery.line1 || delivery.postcode,
                toPostcode: delivery.postcode,
                receiverPhone: rPhone
            });
            setDistance(distMiles);

            if (Platform.OS === 'web') {
                window.location.href = '/quote-details';
            } else {
                router.push('/quote-details' as any);
            }
        } catch (e) {
            console.error('Failed to calculate distance or save quote params', e);
            alert('Unable to calculate distance. Please try again.');
        } finally {
            setIsCalculating(false);
        }
    };

    const hero = homepageData['cms_heroConfig'] || {};
    const stats = homepageData['cms_statsConfig'] || { stats: [] };
    const { serviceDetails, industryDetails } = useCMS();
    
    // Dynamically pull published services
    const dynamicServices = useMemo(() => {
        return Object.values(serviceDetails || {})
            .filter(s => s.publishStatus)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [serviceDetails]);

    // Dynamically pull published industries
    const dynamicIndustries = useMemo(() => {
        return Object.values(industryDetails || {})
            .filter(i => i.publishStatus)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [industryDetails]);

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

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
                                    <View style={styles.phoneInputRow}>
                                        <Text style={styles.fieldLabelSmall}>Sender Contact Number</Text>
                                        <TextInput
                                            style={[styles.smallInput, phoneErrors.sender && styles.inputError]}
                                            placeholder="e.g. 07700 900123"
                                            value={sPhone}
                                            onChangeText={(v) => { setSPhone(v); setPhoneErrors(prev => ({ ...prev, sender: '' })); }}
                                            keyboardType="phone-pad"
                                            onBlur={() => !validatePhone(sPhone) && setPhoneErrors(prev => ({ ...prev, sender: 'Please enter a valid UK phone number' }))}
                                        />
                                        {phoneErrors.sender ? <Text style={styles.errorTextSmall}>{phoneErrors.sender}</Text> : null}
                                    </View>

                                    <View style={{ height: 16 }} />
                                    <PostcodeAutocomplete 
                                        label="Delivery" 
                                        placeholder="Postcode or address"
                                        onAddressSelect={setDelivery} 
                                        initialValue={delivery} 
                                    />
                                    <View style={styles.phoneInputRow}>
                                        <Text style={styles.fieldLabelSmall}>Receiver Contact Number</Text>
                                        <TextInput
                                            style={[styles.smallInput, phoneErrors.receiver && styles.inputError]}
                                            placeholder="e.g. 07700 900456"
                                            value={rPhone}
                                            onChangeText={(v) => { setRPhone(v); setPhoneErrors(prev => ({ ...prev, receiver: '' })); }}
                                            keyboardType="tel"
                                            onBlur={() => !validatePhone(rPhone) && setPhoneErrors(prev => ({ ...prev, receiver: 'Please enter a valid UK phone number' }))}
                                        />
                                        {phoneErrors.receiver ? <Text style={styles.errorTextSmall}>{phoneErrors.receiver}</Text> : null}
                                    </View>
                                    
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

                                    <TouchableOpacity 
                                        style={[styles.quoteBtn, (isCalculating || !sPhone || !rPhone) && { opacity: 0.7 }]} 
                                        onPress={handleContinue}
                                        disabled={isCalculating || !sPhone || !rPhone}
                                    >
                                        {isCalculating ? <ActivityIndicator color="#FFF" /> : (
                                            <>
                                                <Text style={styles.quoteBtnText}>Calculate Instant Quote</Text>
                                                <ArrowRight size={20} color="#FFF" />
                                            </>
                                        )}
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

                    <View style={styles.sliderWrapper}>
                        <ScrollView
                            ref={servicesScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sliderContent}
                            snapToInterval={cardStride}
                            decelerationRate="fast"
                            scrollEventThrottle={16}
                            onScroll={(e) => handleScroll(e, 'services')}
                        >
                            {dynamicServices.map((service: any) => (
                                <TouchableOpacity
                                    key={service.id}
                                    style={[styles.serviceCard, { width: cardWidth, marginRight: spaceBetween }]}
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            window.location.href = `/services/${service.slug}`;
                                        } else {
                                            router.push(`/services/${service.slug}` as any);
                                        }
                                    }}
                                >
                                    <Image source={{ uri: service.heroImageUrl || service.imageUrl }} style={styles.serviceImg} />
                                    <View style={styles.serviceOverlay} />
                                    <View style={styles.serviceContent}>
                                        <Text style={styles.serviceName}>{service.title}</Text>
                                        <Text style={styles.serviceLiteDesc} numberOfLines={2}>{service.summary || service.desc}</Text>
                                        <View style={styles.serviceLink}>
                                            <Text style={styles.serviceLinkText}>View Details</Text>
                                            <ArrowRight size={14} color="#FFF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.sliderControls}>
                            <TouchableOpacity style={styles.sliderArrow} onPress={() => scrollSlider(servicesScrollRef as React.RefObject<ScrollView>, 'left', 'services')}>
                                <ArrowRight size={20} color={Colors.navy} style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sliderArrow} onPress={() => scrollSlider(servicesScrollRef as React.RefObject<ScrollView>, 'right', 'services')}>
                                <ArrowRight size={20} color={Colors.navy} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dot indicators for services */}
                    {!isMobile && (
                        <View style={styles.dotIndicators}>
                            {dynamicServices.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        servicesCurrentIndex === index && styles.dotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.viewAllBtn} 
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.location.href = '/services';
                            } else {
                                router.push('/services');
                            }
                        }}
                    >
                        <Text style={styles.viewAllBtnText}>Explore All Services</Text>
                        <ArrowRight size={18} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* INDUSTRIES SECTION */}
            <View style={[styles.section, { backgroundColor: '#11a7fa' }]}>
                <View style={styles.contentMax}>
                    <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
                        <Text style={styles.sectionTagPrimary}>SECTOR EXPERTISE</Text>
                        <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Specialized for Your Industry</Text>
                        <Text style={[styles.sectionDesc, { textAlign: 'left', color: '#94A3B8' }]}>
                            From mission-critical aviation components to time-sensitive medical supplies, we understand your unique pressure points.
                        </Text>
                    </View>

                    <View style={styles.sliderWrapper}>
                        <ScrollView
                            ref={industriesScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sliderContent}
                            snapToInterval={cardStride}
                            decelerationRate="fast"
                            scrollEventThrottle={16}
                            onScroll={(e) => handleScroll(e, 'industries')}
                        >
                            {dynamicIndustries.map((ind: any) => (
                                <TouchableOpacity
                                    key={ind.id}
                                    style={[styles.industryCard, { width: cardWidth, marginRight: spaceBetween }, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            window.location.href = `/industries/${ind.slug || ind.id}`;
                                        } else {
                                            router.push(`/industries/${ind.slug || ind.id}` as any);
                                        }
                                    }}
                                >
                                    <Image source={{ uri: ind.heroImageUrl || ind.imageUrl }} style={styles.industryImg} />
                                    <View style={styles.industryOverlayDark} />
                                    <View style={styles.industryInfo}>
                                        <Text style={styles.industryTitle}>{ind.title}</Text>
                                        <ArrowUpRight size={20} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.sliderControls}>
                            <TouchableOpacity style={[styles.sliderArrow, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => scrollSlider(industriesScrollRef as React.RefObject<ScrollView>, 'left', 'industries')}>
                                <ArrowRight size={20} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.sliderArrow, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => scrollSlider(industriesScrollRef as React.RefObject<ScrollView>, 'right', 'industries')}>
                                <ArrowRight size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dot indicators for industries */}
                    {!isMobile && (
                        <View style={styles.dotIndicatorsPrimary}>
                            {dynamicIndustries.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dotPrimary,
                                        industriesCurrentIndex === index && styles.dotPrimaryActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
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
                                    <DynamicIcon name={card.icon} size={32} color="#11a7fa" />
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
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 102, 255, 0.9)' }]} />
                <View style={[styles.contentMax, styles.ctaContent]}>
                    <Text style={styles.ctaHeadline}>Ready to upgrade your logistics?</Text>
                    <Text style={styles.ctaBody}>Join over 1,200 businesses relying on CYVhub for their most critical shipments.</Text>
                    <View style={styles.ctaBtns}>
                        <TouchableOpacity 
                            style={styles.ctaPrimary} 
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = '/contact';
                                } else {
                                    router.push('/contact');
                                }
                            }}
                        >
                            <Text style={styles.ctaPrimaryText}>Open a Business Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.ctaSecondary} 
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = '/services';
                                } else {
                                    router.push('/services');
                                }
                            }}
                        >
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
    },
    heroTextContent: {
        flex: 1,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        alignSelf: 'flex-start',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    heroBadgeIcon: {
        marginRight: 8,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
        elevation: 10,
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
        paddingVertical: 14,
        borderRadius: 26,
    },
    widgetTabIcon: {
        marginRight: 8,
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
        color: '#11a7fa',
    },
    widgetBody: {
        padding: 32,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    vehicleSelect: {
        marginTop: 24,
        marginBottom: 32,
    },
    vehicleScroll: {
        paddingRight: 20,
    },
    vOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        marginRight: 10,
    },
    vOptionActive: {
        borderColor: '#11a7fa',
        backgroundColor: '#11a7fa' + '10',
    },
    vOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    vOptionTextActive: {
        color: '#11a7fa',
        fontWeight: '800',
    },
    quoteBtn: {
        backgroundColor: '#11a7fa',
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quoteBtnIcon: {
        marginLeft: 12,
    },
    quoteBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    phoneInputRow: {
        marginTop: 10,
        marginBottom: 5,
    },
    smallInput: {
        height: 45,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 15,
        fontSize: 14,
        color: '#1e293b',
        marginTop: 5,
    },
    fieldLabelSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginLeft: 4,
    },
    errorTextSmall: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    trackContainer: {
    },
    trackInput: {
        height: 60,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 18,
        fontWeight: '600',
        color: Colors.navy,
        marginBottom: 20,
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
    },
    sliderWrapper: {
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    sliderContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
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
    },
    serviceLinkIcon: {
        marginLeft: 8,
    },
    serviceLinkText: {
        color: '#FFF',
        fontWeight: '700',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    viewAllBtnIcon: {
        marginLeft: 12,
    },
    viewAllBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    industryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
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
    },
    sliderControls: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: -25,
        pointerEvents: 'box-none',
        zIndex: 5,
    },
    sliderArrow: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    dotIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.2)',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: Colors.primary,
        width: 24,
    },
    dotIndicatorsPrimary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    dotPrimary: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 4,
    },
    dotPrimaryActive: {
        backgroundColor: '#FFF',
        width: 24,
    },
});
