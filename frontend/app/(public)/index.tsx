import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Truck, Clock, ShieldCheck, Leaf, ArrowRight, Zap, Target, Search, Package, Calculator, CheckCircle, MapPin, TrendingUp, Headset, Star, Users, ArrowUpRight } from 'lucide-react-native';
import Head from 'expo-router/head';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    initialHero,
    initialHowItWorks,
    initialWhyUs,
    initialServices,
    initialCta,
    initialStats,
    initialIndustries,
    initialTestimonials,
} from '@/constants/cmsDefaults';



export default function PublicHome() {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const router = useRouter();
    const [collection, setCollection] = useState('');
    const [delivery, setDelivery] = useState('');
    const [isReadyNow, setIsReadyNow] = useState(true);
    const [vehicleType, setVehicleType] = useState('Medium Van');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Widget states
    const [activeHeroTab, setActiveHeroTab] = useState<'quote' | 'track'>('quote');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
    const testimonialScrollRef = useRef<ScrollView>(null);
    const industryScrollRef = useRef<ScrollView>(null);
    const servicesScrollRef = useRef<ScrollView>(null);
    const [activeIndustryIndex, setActiveIndustryIndex] = useState(0);
    const industryIndexRef = useRef(0);

    // CMS data from global context
    const { homepageData } = useCMS();
    const hero = homepageData['cms_heroConfig'] || initialHero;
    const howItWorks = homepageData['cms_howItWorksConfig'] || initialHowItWorks;
    const whyUs = homepageData['cms_whyUsConfig'] || initialWhyUs;
    const services = homepageData['cms_servicesConfig'] || initialServices;
    const cta = homepageData['cms_ctaConfig'] || initialCta;
    const stats = homepageData['cms_statsConfig'] || initialStats;
    const industries = homepageData['cms_industriesConfig'] || initialIndustries;
    const testimonials = homepageData['cms_testimonialsConfig'] || initialTestimonials;

    const scrollSlider = (ref: React.RefObject<ScrollView>, offset: number) => {
        ref.current?.scrollTo({ x: offset, animated: true });
    };

    useEffect(() => {
        if (!hero.bgImages || hero.bgImages.length === 0) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % hero.bgImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [hero.bgImages]);

    // Testimonial Auto-scroll
    useEffect(() => {
        if (!testimonials.testimonials || testimonials.testimonials.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (activeTestimonialIndex + 1) % testimonials.testimonials.length;

            const cardWidth = 374; // 350 card + 24 gap
            testimonialScrollRef.current?.scrollTo({
                x: nextIndex * cardWidth,
                animated: true
            });
            // We update state here so the next interval knows where to go
            setActiveTestimonialIndex(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [activeTestimonialIndex, testimonials.testimonials]);

    // Industries Auto-scroll
    useEffect(() => {
        if (!industries.industries || industries.industries.length <= 1) return;

        const interval = setInterval(() => {
            industryIndexRef.current = (industryIndexRef.current + 1) % industries.industries.length;
            const cardWidth = 324; // 300 card + 24 gap

            industryScrollRef.current?.scrollTo({
                x: industryIndexRef.current * cardWidth,
                animated: true
            });
            setActiveIndustryIndex(industryIndexRef.current);
        }, 6000);

        return () => clearInterval(interval);
    }, [industries.industries]);

    const handleIndustryScroll = (event: any) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const cardWidth = 324;
        const index = Math.round(scrollX / cardWidth);
        const validIndex = Math.max(0, Math.min(index, industries.industries.length - 1));
        if (validIndex !== activeIndustryIndex) {
            industryIndexRef.current = validIndex;
            setActiveIndustryIndex(validIndex);
        }
    };

    const handleTestimonialScroll = (event: any) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const cardWidth = 374;
        const index = Math.round(scrollX / cardWidth);
        const validIndex = Math.max(0, Math.min(index, testimonials.testimonials.length - 1));
        if (validIndex !== activeTestimonialIndex) {
            setActiveTestimonialIndex(validIndex);
        }
    };

    const handleContinue = async () => {
        if (!collection.trim() || !delivery.trim()) {
            alert('Please enter both collection and delivery postcodes.');
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
                collection,
                delivery,
                ready: isReadyNow.toString(),
                vehicle: vehicleType
            }
        });
    };

    const scrollToTop = () => {
        if (Platform.OS === 'web') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Head>
                <title>CYVhub — Same Day B2B Courier Network UK</title>
                <meta name="description" content="CYVhub is the UK's smarter B2B same-day courier network. Instant quotes, live tracking, and 60-minute collections nationwide. Powered by Cyvrix Limited." />
                <meta property="og:title" content="CYVhub — Same Day B2B Courier Network UK" />
                <meta property="og:description" content="Instant quotes, live GPS tracking, and 60-minute collection across the UK. Join 1,200+ businesses already using CYVhub for mission-critical deliveries." />
                <meta property="og:image" content="https://www.cyvhub.com/og-image.png" />
                <meta property="og:url" content="https://www.cyvhub.com/" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="CYVhub — Same Day B2B Courier Network UK" />
                <meta name="twitter:description" content="Instant quotes, live GPS tracking, and 60-minute collection across the UK." />
                <meta name="twitter:image" content="https://www.cyvhub.com/og-image.png" />
            </Head>
            {/* HERO SECTION */}
            <View style={[styles.heroSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                {hero.bgImages && hero.bgImages.length > 0 ? hero.bgImages.slice(0, 3).map((imgUrl: string, index: number) => (
                    <Image
                        key={index}
                        source={{ uri: imgUrl }}
                        style={[
                            StyleSheet.absoluteFillObject,
                            { opacity: index === currentImageIndex ? 1 : 0, width: '100%', height: '100%' },
                        ]}
                        resizeMode="cover"
                    />
                )) : null}
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(2, 6, 23, 0.6)' }]} />
                <View style={[styles.heroContent, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column-reverse', justifyContent: 'space-between', gap: 40 }]}>
                    <View style={{ flex: 1, alignItems: SCREEN_WIDTH >= 768 ? 'flex-start' : 'center', width: '100%' }}>
                        <Text style={[styles.heroTitle, { textAlign: SCREEN_WIDTH >= 768 ? 'left' : 'center', fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{hero.headline}</Text>
                        <Text style={[styles.heroSubtitle, { textAlign: SCREEN_WIDTH >= 768 ? 'left' : 'center' }]}>{hero.subheading}</Text>
                    </View>

                    {/* DUAL WIDGET TABS */}
                    {(hero.showGuestWidget || hero.showTrackWidget) && (
                        <View style={styles.widgetContainer}>
                            <View style={styles.widgetTabs}>
                                {hero.showGuestWidget && (
                                    <TouchableOpacity
                                        style={StyleSheet.flatten([styles.widgetTab, activeHeroTab === 'quote' && styles.widgetTabActive])}
                                        onPress={() => setActiveHeroTab('quote')}
                                        activeOpacity={0.8}
                                    >
                                        <Calculator size={18} color={activeHeroTab === 'quote' ? Colors.primary : Colors.textSecondary} />
                                        <Text style={StyleSheet.flatten([styles.widgetTabText, activeHeroTab === 'quote' && styles.widgetTabTextActive])}>Get a Quote</Text>
                                    </TouchableOpacity>
                                )}
                                {hero.showTrackWidget && (
                                    <TouchableOpacity
                                        style={StyleSheet.flatten([styles.widgetTab, activeHeroTab === 'track' && styles.widgetTabActive])}
                                        onPress={() => setActiveHeroTab('track')}
                                        activeOpacity={0.8}
                                    >
                                        <Search size={18} color={activeHeroTab === 'track' ? Colors.primary : Colors.textSecondary} />
                                        <Text style={StyleSheet.flatten([styles.widgetTabText, activeHeroTab === 'track' && styles.widgetTabTextActive])}>Track Parcel</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.bookingWidget}>
                                {activeHeroTab === 'quote' ? (
                                    <>
                                        <Text style={styles.bookingTitle}>{hero.guestWidgetTitle || 'Quick Quote & Book'}</Text>
                                        {hero.guestWidgetSubtitle ? <Text style={{ color: Colors.textSecondary, marginBottom: 20 }}>{hero.guestWidgetSubtitle}</Text> : null}

                                        <View style={styles.formContainer}>
                                            <View style={styles.postcodeRow}>
                                                <View style={styles.gridField}>
                                                    <Text style={StyleSheet.flatten([styles.inputLabel, { marginBottom: 8 }])}>Collection postcode: <Text style={styles.required}>*</Text></Text>
                                                    <View style={styles.inputIconWrapper}>
                                                        <MapPin size={18} color={Colors.textMuted} style={styles.inputIcon as any} />
                                                        <TextInput style={styles.inputWithIcon} value={collection} onChangeText={setCollection} placeholder="e.g. EC1A 1BB" />
                                                    </View>
                                                </View>

                                                <View style={styles.gridField}>
                                                    <Text style={StyleSheet.flatten([styles.inputLabel, { marginBottom: 8 }])}>Delivery postcode: <Text style={styles.required}>*</Text></Text>
                                                    <View style={styles.inputIconWrapper}>
                                                        <MapPin size={18} color={Colors.textMuted} style={styles.inputIcon as any} />
                                                        <TextInput style={styles.inputWithIcon} value={delivery} onChangeText={setDelivery} placeholder="e.g. M1 1AE" />
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={styles.optionsRow}>
                                                {hero.showVehicleSelection && (
                                                    <View style={StyleSheet.flatten([styles.gridField, { flex: 1.2 }])}>
                                                        <Text style={StyleSheet.flatten([styles.inputLabel, { marginBottom: 8 }])}>Vehicle Required:</Text>
                                                        <View style={styles.vehicleOptions}>
                                                            {['Small Van', 'Medium Van', 'Large Van'].map(van => (
                                                                <TouchableOpacity key={van} style={StyleSheet.flatten([styles.vehicleOption, vehicleType === van && styles.vehicleOptionSelected])} onPress={() => setVehicleType(van)} activeOpacity={0.8}>
                                                                    <Truck size={16} color={vehicleType === van ? Colors.primary : Colors.textMuted} />
                                                                    <Text style={StyleSheet.flatten([styles.vehicleText, vehicleType === van && styles.vehicleTextSelected])}>{van}</Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}

                                                {hero.showDateSelection && (
                                                    <View style={StyleSheet.flatten([styles.gridField, { flex: 0.8 }])}>
                                                        <Text style={StyleSheet.flatten([styles.inputLabel, { marginBottom: 8 }])}>Collection Time:</Text>
                                                        <View style={styles.vehicleOptions}>
                                                            <TouchableOpacity style={StyleSheet.flatten([styles.vehicleOption, isReadyNow && styles.vehicleOptionSelected])} onPress={() => setIsReadyNow(true)} activeOpacity={0.8}>
                                                                <Clock size={16} color={isReadyNow ? Colors.primary : Colors.textMuted} />
                                                                <Text style={StyleSheet.flatten([styles.vehicleText, isReadyNow && styles.vehicleTextSelected])}>Ready Now</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity style={StyleSheet.flatten([styles.vehicleOption, !isReadyNow && styles.vehicleOptionSelected])} onPress={() => setIsReadyNow(false)} activeOpacity={0.8}>
                                                                <Calculator size={16} color={!isReadyNow ? Colors.primary : Colors.textMuted} />
                                                                <Text style={StyleSheet.flatten([styles.vehicleText, !isReadyNow && styles.vehicleTextSelected])}>Pre-book Later</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                style={styles.fullWidthContinueBtn}
                                                onPress={handleContinue}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.continueBtnText}>{hero.guestWidgetButtonText || 'Get Instant Quote'}</Text>
                                                <ArrowRight size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.bookingTitle}>{hero.trackWidgetTitle || 'Track a Parcel'}</Text>
                                        {hero.trackWidgetSubtitle ? <Text style={{ color: Colors.textSecondary, marginBottom: 20 }}>{hero.trackWidgetSubtitle}</Text> : null}

                                        <View style={styles.formRow}>
                                            <Text style={styles.inputLabel}>Tracking Number: <Text style={styles.required}>*</Text></Text>
                                            <View style={styles.inputIconWrapper}>
                                                <Package size={18} color={Colors.textMuted} style={styles.inputIcon as any} />
                                                <TextInput
                                                    style={styles.inputWithIcon}
                                                    value={trackingNumber}
                                                    onChangeText={setTrackingNumber}
                                                    placeholder="e.g. CYV12345678"
                                                />
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.continueBtn}
                                            onPress={() => {
                                                if (!trackingNumber) return alert('Please enter tracking number');
                                                alert('Tracking functionality coming soon for guest portal.');
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.continueBtnText}>{hero.trackWidgetButtonText || 'Track Parcel'}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* LIVE STATS BAR */}
            {stats.stats && stats.stats.length > 0 && (
                <View style={[styles.statsSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                    <View style={styles.statsInner}>
                        {stats.stats.map((stat: any) => {
                            const IconComponent = stat.icon === 'Package' ? Package : stat.icon === 'Users' ? Users : stat.icon === 'Clock' ? Clock : MapPin;
                            return (
                                <View key={stat.id} style={styles.statBox}>
                                    <View style={styles.statIconContainer}>
                                        <IconComponent size={28} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            )
                        })}
                    </View>
                </View>
            )}

            {/* HOW IT WORKS */}
            <View style={[styles.howItWorksSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{howItWorks.title}</Text>
                    <Text style={styles.sectionSubtitle}>{howItWorks.subtitle}</Text>
                </View>
                <View style={styles.stepsGrid}>
                    {howItWorks.steps?.map((step: any) => {
                        const IconComponent = step.icon === 'Calculator' ? Calculator : step.icon === 'CheckCircle' ? CheckCircle : MapPin;
                        return (
                            <View key={step.id} style={styles.stepCard}>
                                <View style={styles.stepIconBox}>
                                    <IconComponent size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.stepNumber}>{step.num}</Text>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDesc}>{step.desc}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* TESTIMONIALS SECTION */}
            {testimonials.testimonials && testimonials.testimonials.length > 0 && (
                <View style={styles.testimonialsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30, paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>{testimonials.title}</Text>
                        <Text style={[styles.sectionSubtitle, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>{testimonials.subtitle}</Text>
                    </View>
                    <ScrollView
                        ref={testimonialScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.testimonialsScroll}
                        onScroll={handleTestimonialScroll}
                        scrollEventThrottle={16}
                        snapToInterval={374}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        pagingEnabled={Platform.OS !== 'web'}
                    >
                        {testimonials.testimonials.map((test: any) => (
                            <View key={test.id} style={styles.testimonialCard}>
                                <View style={styles.starsRow}>
                                    {[...Array(test.rating)].map((_, i) => <Star key={i} size={16} color="#FBBF24" fill="#FBBF24" />)}
                                </View>
                                <Text style={styles.testimonialContent}>"{test.content}"</Text>
                                <View style={styles.testimonialAuthorRow}>
                                    {test.avatarUrl ? (
                                        <Image source={{ uri: test.avatarUrl }} style={styles.avatarImg} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarLetter}>{test.author.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <View>
                                        <Text style={styles.testimonialAuthor}>{test.author}</Text>
                                        <Text style={styles.testimonialRole}>{test.role}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.paginationDots}>
                        {testimonials.testimonials.map((_: any, i: number) => (
                            <View
                                key={i}
                                style={StyleSheet.flatten([
                                    styles.dot,
                                    activeTestimonialIndex === i && styles.dotActive
                                ])}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* WHY CHOOSE US */}
            <View style={[styles.whyChooseSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                <View style={styles.whyChooseContent}>
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={styles.sectionTag}>{whyUs.tag}</Text>
                        <Text style={[styles.sectionTitleWhite, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{whyUs.title}</Text>
                    </View>
                    <View style={styles.whyChooseGrid}>
                        {whyUs.cards?.map((card: any) => {
                            const IconComponent = card.icon === 'Zap' ? Zap : card.icon === 'ShieldCheck' ? ShieldCheck : card.icon === 'TrendingUp' ? TrendingUp : Headset;
                            return (
                                <View key={card.id} style={[styles.whyCard, { width: SCREEN_WIDTH >= 768 ? '31%' : '100%', flexBasis: 'auto' }]}>
                                    <IconComponent size={28} color={Colors.primary} style={styles.whyIcon as any} />
                                    <Text style={styles.whyCardTitle}>{card.title}</Text>
                                    <Text style={styles.whyCardDesc}>{card.desc}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* SERVICES OVERVIEW */}
            <View style={[styles.servicesSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{services.title}</Text>
                    <Text style={styles.sectionSubtitle}>{services.subtitle}</Text>
                </View>
                <View style={styles.cardsGrid}>
                    {services.banners?.map((banner: any) => (
                        <Link key={banner.id} href={banner.link as any} asChild>
                            <TouchableOpacity style={[styles.serviceBannerCard, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 640 ? '48%' : '100%' }]} activeOpacity={0.9}>
                                <Image source={{ uri: banner.imageUrl }} style={StyleSheet.absoluteFillObject} />
                                <View style={styles.serviceOverlay} />
                                <View style={styles.serviceBannerContent}>
                                    <Text style={styles.serviceBannerTitle}>{banner.title}</Text>
                                    <Text style={styles.serviceBannerDesc}>{banner.desc}</Text>
                                    <View style={styles.serviceBannerLink}>
                                        <Text style={styles.serviceBannerLinkText}>Learn More</Text>
                                        <ArrowRight size={16} color="#FFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Link>
                    ))}
                </View>
            </View>

            {/* INDUSTRIES SECTION */}
            {industries.industries && industries.industries.length > 0 && (
                <View style={[styles.industriesSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{industries.title}</Text>
                        <Text style={styles.sectionSubtitle}>{industries.subtitle}</Text>
                    </View>
                    <View style={styles.cardsGrid}>
                        {industries.industries.map((ind: any) => (
                            <Link key={ind.id} href={`/services?industry=${ind.id}` as any} asChild>
                                <TouchableOpacity style={[styles.industryCard, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 640 ? '48%' : '100%' }]} activeOpacity={0.9}>
                                    <Image source={{ uri: ind.imageUrl }} style={styles.industryImg} />
                                    <View style={styles.industryOverlay} />
                                    <View style={styles.industryContent}>
                                        <View style={styles.industryHeader}>
                                            <Text style={styles.industryTitle}>{ind.title}</Text>
                                            <ArrowUpRight size={20} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.industryDesc}>{ind.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>
                </View>
            )}

            {/* CTA SECTION */}
            <View style={[styles.ctaSection, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                <View style={styles.ctaContent}>
                    <Text style={[styles.ctaTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 30 }]}>{cta.title}</Text>
                    <Text style={styles.ctaDesc}>{cta.desc}</Text>
                    <View style={styles.ctaActionRow}>
                        <Link href={cta.primaryBtnLink as any} asChild>
                            <TouchableOpacity
                                style={styles.ctaPrimaryBtn}
                                activeOpacity={0.8}
                                onPress={scrollToTop}
                            >
                                <Text style={styles.ctaPrimaryBtnText}>{cta.primaryBtnText}</Text>
                            </TouchableOpacity>
                        </Link>
                        <Link href={cta.secondaryBtnLink as any} asChild>
                            <TouchableOpacity
                                style={styles.ctaSecondaryBtn}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.ctaSecondaryBtnText}>{cta.secondaryBtnText}</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
    },
    heroSection: {
        minHeight: Platform.OS === 'web' ? 500 : 600,
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: Colors.navy,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: {
        maxWidth: 1200,
        alignItems: 'center',
        zIndex: 2,
        width: '100%',
    },
    heroTitle: {
        fontSize: Platform.OS === 'web' ? 56 : 40,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: -1,
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 20 : 18,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 600,
        lineHeight: 28,
    },
    heroActionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 60,
        justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    secondaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    widgetContainer: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    widgetTabs: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
        zIndex: 2,
    },
    widgetTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#F1F5F9',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        opacity: 0.8,
    },
    widgetTabActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        opacity: 1,
    },
    widgetTabText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    widgetTabTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    bookingTitle: {
        fontSize: 20,
        color: '#1a237e',
        marginBottom: 16,
        fontWeight: '600',
    },
    formRow: {
        flexDirection: 'column',
        width: '100%',
        marginBottom: 16,
        gap: 16,
    },
    gridField: {
        flex: 1,
        minWidth: 280,
    },
    inputLabel: {
        fontSize: 14,
        color: '#1a237e',
        fontWeight: '500',
    },
    required: {
        color: '#e53935',
        fontWeight: '700',
    },
    input: {
        flex: 1.5,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        height: 40,
        paddingHorizontal: 10,
        fontSize: 14,
        color: Colors.text,
    },
    inputIconWrapper: {
        flex: 1.5,
        position: 'relative',
        justifyContent: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    inputWithIcon: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        height: 40,
        paddingLeft: 36,
        paddingRight: 10,
        fontSize: 14,
        color: Colors.text,
    },
    vehicleOptions: {
        flex: 1.5,
        gap: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    vehicleOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#E0E7FF', // Light primary tint
    },
    vehicleText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    vehicleTextSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    continueBtn: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-end',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 4,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    formContainer: {
        width: '100%',
        gap: 24,
    },
    postcodeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        width: '100%',
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        marginTop: 8,
        width: '100%',
    },
    fullWidthContinueBtn: {
        backgroundColor: Colors.primary,
        width: '100%',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 8,
    },

    // STATS SECTION
    statsSection: {
        backgroundColor: Colors.primary,
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    statsInner: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 40,
    },
    statBox: {
        alignItems: 'center',
    },
    statIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#E2E8F0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },

    // HOW IT WORKS SECTION
    howItWorksSection: {
        paddingVertical: 100,
        paddingHorizontal: 20,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
    },
    sectionHeader: {
        alignItems: 'center',
        marginBottom: 60,
    },
    sectionTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a237e',
        textAlign: 'center',
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 18,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 600,
    },
    stepsGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 32,
    },
    stepCard: {
        flex: 1,
        alignItems: 'center',
        textAlign: 'center',
        padding: 32,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        position: 'relative',
    },
    stepIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    stepNumber: {
        position: 'absolute',
        top: 24,
        right: 24,
        fontSize: 48,
        fontWeight: '900',
        color: '#E2E8F0',
        opacity: 0.5,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 16,
        textAlign: 'center',
    },
    stepDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
        textAlign: 'center',
    },

    // TESTIMONIALS SECTION
    testimonialsSection: {
        paddingVertical: 100,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    testimonialsScroll: {
        paddingVertical: 20,
        paddingHorizontal: Platform.OS === 'web' ? 0 : 20,
        gap: 24,
    },
    testimonialCard: {
        width: 350,
        backgroundColor: '#F8FAFC',
        padding: 32,
        borderRadius: 16,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 20,
    },
    testimonialContent: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    testimonialAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarImg: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    testimonialAuthor: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a237e',
    },
    testimonialRole: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E2E8F0',
    },
    dotActive: {
        backgroundColor: Colors.primary,
        width: 24,
    },

    // WHY CHOOSE US
    whyChooseSection: {
        backgroundColor: Colors.navy,
        paddingVertical: 100,
        paddingHorizontal: 20,
    },
    whyChooseContent: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 60,
        alignItems: 'center',
    },
    sectionHeaderLeft: {
        flex: 1,
    },
    sectionTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    sectionTitleWhite: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 50,
    },
    whyChooseGrid: {
        flex: 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    whyCard: {
        flexBasis: Platform.OS === 'web' ? '46%' : '100%',
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 16,
    },
    whyIcon: {
        marginBottom: 20,
    },
    whyCardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 12,
    },
    whyCardDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
    },

    // INDUSTRIES SECTION
    industriesSection: {
        paddingVertical: 100,
        paddingHorizontal: 20,
        backgroundColor: '#F8FAFC',
    },
    industriesScroll: {
        paddingVertical: 20,
        gap: 24,
    },
    industryImg: {
        ...StyleSheet.absoluteFillObject,
    },
    industryOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 35, 126, 0.4)',
    },
    industryContent: {
        ...StyleSheet.absoluteFillObject,
        padding: 24,
        justifyContent: 'flex-end',
    },
    industryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    industryTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    industryDesc: {
        fontSize: 16,
        color: '#E2E8F0',
        lineHeight: 24,
    },

    // SERVICES
    servicesSection: {
        paddingVertical: 100,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    servicesScroll: {
        paddingVertical: 20,
        gap: 24,
    },
    serviceOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 35, 126, 0.6)',
    },
    serviceBannerContent: {
        ...StyleSheet.absoluteFillObject,
        padding: 32,
        justifyContent: 'flex-end',
    },
    serviceBannerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    serviceBannerDesc: {
        fontSize: 16,
        color: '#E2E8F0',
        marginBottom: 24,
    },
    serviceBannerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceBannerLinkText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },

    // CTA SECTION
    ctaSection: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 100,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    ctaContent: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    ctaTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a237e',
        marginBottom: 16,
        textAlign: 'center',
    },
    ctaDesc: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginBottom: 40,
        textAlign: 'center',
        maxWidth: 600,
    },
    ctaActionRow: {
        flexDirection: 'row',
        gap: 16,
    },
    ctaPrimaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    ctaPrimaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    ctaSecondaryBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    ctaSecondaryBtnText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    // SLIDER NAV
    sliderContainer: {
        position: 'relative',
        width: '100%',
    },
    sliderNavBtn: {
        position: 'absolute',
        top: '50%',
        marginTop: -25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    sliderNavLeft: {
        left: -25,
    },
    sliderNavRight: {
        right: -25,
    },
    // NEW GRID STYLES
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 24,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        paddingVertical: 40,
    },
    serviceBannerCard: {
        width: Platform.OS === 'web' ? '30%' : '100%',
        minWidth: 320,
        flexGrow: 1,
        height: 350,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F8FAFC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    industryCard: {
        width: Platform.OS === 'web' ? '22%' : '100%',
        minWidth: 260,
        flexGrow: 1,
        height: 380,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 24,
    },
    bookingWidget: {
        backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.85)' : '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        marginHorizontal: 'auto',
        alignSelf: 'center',
        maxWidth: 672,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(20px)',
            }
        })
    },
});
