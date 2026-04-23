import { Slot, Link, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Easing, useWindowDimensions, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { 
    Truck, Navigation, Facebook, Twitter, Linkedin, Instagram, Menu, X, User, 
    BriefcaseMedical, Monitor, Factory, Plane, Recycle, Settings, Utensils, ChevronRight, ChevronDown,
    Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, BarChart3, Calendar, Map, Briefcase, ArrowLeftRight, ShieldCheck
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import CookieBanner from '@/components/CookieBanner';

export default function PublicLayout() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const { header, footer, industryDetails, serviceDetails, menuConfig, isLoaded } = useCMS();
    const insets = useSafeAreaInsets();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (id: string) => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setHoveredMenuId(id);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setHoveredMenuId(null);
        }, 300); // 300ms grace period
    };

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);
 
    const IconMap: any = {
        BriefcaseMedical, Monitor, Factory, Plane, Recycle, Settings, Utensils, Truck,
        Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, BarChart3, Calendar, Map, Briefcase, ArrowLeftRight, ShieldCheck
    };

    const getIconComponent = (label: string, iconName?: string) => {
        if (iconName && IconMap[iconName]) return IconMap[iconName];
        
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('medical')) return BriefcaseMedical;
        if (lowerLabel.includes('construction')) return Truck;
        if (lowerLabel.includes('it') || lowerLabel.includes('tech')) return Monitor;
        if (lowerLabel.includes('manufacturing')) return Factory;
        if (lowerLabel.includes('aviation') || lowerLabel.includes('aog')) return Plane;
        if (lowerLabel.includes('reverse')) return Recycle;
        if (lowerLabel.includes('automotive')) return Settings;
        if (lowerLabel.includes('hospitality')) return Utensils;
        return Truck;
    };
 
    const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

    useEffect(() => {
        if (header.enableAnnouncement) {
            Animated.loop(
                Animated.timing(slideAnim, {
                    toValue: -SCREEN_WIDTH * 1.5,
                    duration: 15000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [header.enableAnnouncement, slideAnim, SCREEN_WIDTH]);
 
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const isWeb = Platform.OS === 'web';

    // Dynamically inject published industries and services into the menu
    const baseMenuItems = [
        ...(menuConfig?.items || [])
    ];

    const menuItems = baseMenuItems.map((item: any) => {
        if ((item.id === 'industries' || item.label.toLowerCase() === 'industries') && industryDetails) {
            const dynamicItems = Object.entries(industryDetails)
                .filter(([, ind]) => ind.publishStatus)
                .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                .map(([slug, ind]) => ({
                    id: slug,
                    label: ind.title,
                    url: `/industries/${slug}`,
                    description: ind.description || ind.subtitle,
                    icon: ind.icon
                }));
            return { ...item, url: '/industries', items: dynamicItems };
        }
        if ((item.id === 'services' || item.label.toLowerCase() === 'services') && serviceDetails) {
            const dynamicItems = Object.values(serviceDetails)
                .filter((s) => s.publishStatus)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((s) => ({
                    id: s.id,
                    label: s.title,
                    url: `/services/${s.slug}`,
                    description: s.summary,
                    icon: s.icon
                }));
            return { ...item, url: '/services', items: dynamicItems };
        }
        // If it already has static children (from CMS), map them to 'items' for the UI logic
        if (item.children && item.children.length > 0) {
            return { ...item, items: item.children };
        }
        return item;
    });

    const headerItems = menuItems.filter(i => i.showHeader !== false);
    const footerItems = menuItems.filter(i => i.showFooter !== false);

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ANNOUNCEMENT BAR */}
            {header.enableAnnouncement && (
                <View style={[styles.announcementBar, { paddingTop: insets.top || 8, overflow: 'hidden', backgroundColor: header.announcementBgColor || Colors.primary }]}>
                    <Link 
                        href={(header.announcementLink || '/') as any} 
                        asChild
                        onClick={(e) => {
                            if (isWeb) {
                                e.preventDefault();
                                window.location.href = header.announcementLink || '/';
                            }
                        }}
                    >
                        <TouchableOpacity style={styles.announcementInner}>
                            <Animated.Text numberOfLines={1} style={[styles.announcementText, { transform: [{ translateX: slideAnim }] }]}>
                                {header.announcementText}
                            </Animated.Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            )}

            {/* HEADER */}
            <View style={[styles.header, { 
                paddingTop: header.enableAnnouncement ? 0 : (insets.top || 16),
                paddingHorizontal: SCREEN_WIDTH >= 1024 ? 40 : 20,
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
                zIndex: 100
            }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.logoContainer} 
                        onPress={() => {
                            if (isWeb) {
                                window.location.href = '/';
                            } else {
                                router.push('/');
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={require('@/assets/images/logo-color-no-bg.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <View style={[styles.navLinks, SCREEN_WIDTH < 1024 ? { display: 'none' } : null]}>
                        {headerItems.map((item: any) => (
                            <View 
                                key={item.id} 
                                style={[styles.navItemContainer]}
                                {...(isWeb ? {
                                    onMouseEnter: () => item.items ? handleMouseEnter(item.id) : null,
                                    onMouseLeave: handleMouseLeave
                                } : {})}
                            >
                                <Link 
                                    href={item.url as any} 
                                    style={styles.navItemLink as any}
                                    onClick={(e) => {
                                        if (isWeb) {
                                            e.preventDefault();
                                            window.location.href = item.url;
                                        }
                                    }}
                                >
                                    <View style={styles.navLinkInner}>
                                        <Text style={[styles.navText, hoveredMenuId === item.id && { color: Colors.primary }]}>{item.label}</Text>
                                        {item.items && (
                                            <ChevronDown 
                                                size={14} 
                                                color={hoveredMenuId === item.id ? Colors.primary : Colors.textSecondary} 
                                                style={[styles.chevronIcon, hoveredMenuId === item.id && styles.chevronIconRotated]} 
                                            />
                                        )}
                                    </View>
                                </Link>

                                {item.items && hoveredMenuId === item.id && (
                                    <View
                                        style={[
                                            styles.megaMenu,
                                            (item.id === 'industries' || item.id === 'services') && styles.megaMenuWide
                                        ]}
                                        {...(isWeb ? {
                                            onMouseEnter: () => handleMouseEnter(item.id),
                                            onMouseLeave: handleMouseLeave
                                        } : {})}
                                    >
                                        <View style={styles.megaMenuInner}>
                                            <View style={styles.megaMenuGrid}>
                                                {item.items.map((subItem: any) => {
                                                    const IconComponent = getIconComponent(subItem.label, subItem.icon);
                                                    return (
                                                        <Link 
                                                            key={subItem.id} 
                                                            href={subItem.url as any} 
                                                            asChild
                                                            onPress={() => setHoveredMenuId(null)}
                                                            onClick={(e) => {
                                                                if (isWeb) {
                                                                    e.preventDefault();
                                                                    window.location.href = subItem.url;
                                                                }
                                                            }}
                                                        >
                                                            <TouchableOpacity 
                                                                style={styles.megaMenuItem}
                                                            >
                                                                {(item.id === 'industries' || item.id === 'services') && (
                                                                    <View style={styles.industryIconContainer}>
                                                                        {IconComponent && <IconComponent size={20} color={Colors.primary} />}
                                                                    </View>
                                                                )}
                                                                <View style={styles.megaMenuTextContainer}>
                                                                    <View style={styles.megaMenuTitleRow}>
                                                                        <Text style={styles.megaMenuTitle} numberOfLines={1}>
                                                                            {subItem.label}
                                                                        </Text>
                                                                        {(item.id === 'industries' || item.id === 'services') && <ChevronRight size={14} color={Colors.textSecondary} />}
                                                                    </View>
                                                                    {subItem.description && (
                                                                        <Text style={styles.megaMenuDesc} numberOfLines={2}>
                                                                            {subItem.description}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </TouchableOpacity>
                                                        </Link>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={[styles.loginBtn, SCREEN_WIDTH < 768 ? { display: 'none' } : null]} 
                            activeOpacity={0.8}
                            onPress={() => {
                                if (isWeb) {
                                    window.location.href = header.loginBtnUrl || '/login';
                                } else {
                                    router.push(header.loginBtnUrl as any);
                                }
                            }}
                        >
                            <User size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.loginBtnText}>{header.loginBtnText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.menuIcon, SCREEN_WIDTH >= 1024 ? { display: 'none' } : null]} 
                            onPress={toggleMenu}
                        >
                            {isMenuOpen ? <X size={28} color={Colors.primary} /> : <Menu size={28} color={Colors.primary} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {isMenuOpen && (
                <View style={[styles.mobileMenu, { height: '100%' }]}>
                    <ScrollView contentContainerStyle={styles.mobileMenuScroll}>
                        {headerItems.map((item: any) => (
                            <View key={item.id} style={styles.mobileNavItem}>
                                <Link 
                                    href={item.url as any} 
                                    style={styles.mobileMenuItemLink as any} 
                                    onPress={() => !item.items && setIsMenuOpen(false)}
                                    onClick={(e) => {
                                        if (isWeb) {
                                            e.preventDefault();
                                            window.location.href = item.url;
                                        }
                                    }}
                                >
                                    <Text style={styles.mobileMenuItemText}>{item.label}</Text>
                                </Link>
                                {item.items && (
                                    <View style={styles.mobileSubMenu}>
                                        {item.items.map((sub: any) => (
                                            <Link 
                                                key={sub.id} 
                                                href={sub.url as any} 
                                                style={styles.mobileSubLink as any} 
                                                onPress={() => setIsMenuOpen(false)}
                                                onClick={(e) => {
                                                    if (isWeb) {
                                                        e.preventDefault();
                                                        window.location.href = sub.url;
                                                    }
                                                }}
                                            >
                                                <Text style={styles.mobileSubText}>{sub.label}</Text>
                                            </Link>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity 
                            style={styles.mobileLoginBtn}
                            onPress={() => { 
                                setIsMenuOpen(false); 
                                if (isWeb) {
                                    window.location.href = header.loginBtnUrl || '/login';
                                } else {
                                    router.push(header.loginBtnUrl as any);
                                }
                            }}
                        >
                            <Text style={styles.mobileLoginText}>{header.loginBtnText}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

            {/* PAGE CONTENT */}
            <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
                <Slot />

                {/* FOOTER */}
                <View style={[styles.footer, { paddingHorizontal: SCREEN_WIDTH >= 1024 ? 48 : SCREEN_WIDTH >= 768 ? 32 : 16 }]}>
                    <View style={styles.footerTop}>
                        <View style={[styles.footerColMain, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Image
                                source={require('@/assets/images/logo-white-no-bg.png')}
                                style={styles.footerLogoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.footerDesc}>
                                {footer.companyBio}
                            </Text>
                            <View style={styles.socialRow}>
                                {footer.facebookUrl && <Link href={footer.facebookUrl as any} style={styles.socialBtn as any} target="_blank"><Facebook size={20} color={Colors.textInverse} /></Link>}
                                {footer.twitterUrl && <Link href={footer.twitterUrl as any} style={styles.socialBtn as any} target="_blank"><Twitter size={20} color={Colors.textInverse} /></Link>}
                                {footer.linkedinUrl && <Link href={footer.linkedinUrl as any} style={styles.socialBtn as any} target="_blank"><Linkedin size={20} color={Colors.textInverse} /></Link>}
                            </View>
                        </View>

                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Quick Links</Text>
                            {footerItems.map((item: any) => (
                                <Link 
                                    key={item.id} 
                                    href={item.url as any} 
                                    style={styles.footerLink as any}
                                    onClick={(e) => {
                                        if (isWeb) {
                                            e.preventDefault();
                                            window.location.href = item.url;
                                        }
                                    }}
                                >{item.label}</Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Company</Text>
                            {footer.companyLinks?.map((link) => (
                                <Link 
                                    key={link.id} 
                                    href={link.url as any} 
                                    style={styles.footerLink as any}
                                    onClick={(e) => {
                                        if (isWeb) {
                                            e.preventDefault();
                                            window.location.href = link.url;
                                        }
                                    }}
                                >{link.label}</Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Legal</Text>
                            {footer.legalLinks?.map((link) => (
                                <Link 
                                    key={link.id} 
                                    href={link.url as any} 
                                    style={styles.footerLink as any}
                                    onClick={(e) => {
                                        if (isWeb) {
                                            e.preventDefault();
                                            window.location.href = link.url;
                                        }
                                    }}
                                >{link.label}</Link>
                            ))}
                        </View>
                    </View>

                    <View style={styles.footerBottom}>
                        <Text style={styles.copyright}>{footer.copyright}</Text>
                    </View>
                </View>
            </ScrollView>
            <CookieBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#FFFFFF',
        zIndex: 100,
        ...Platform.select({
            web: {
                position: 'sticky',
                top: 0,
            }
        })
    },
    announcementBar: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        zIndex: 101,
    },
    announcementInner: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden',
    },
    announcementText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
    },
    logoContainer: {
        zIndex: 110,
        flexShrink: 0,
        height: 44,
        minWidth: 160,
    },
    logoImage: {
        width: 160,
        height: '100%',
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    navItemContainer: {
        position: 'relative',
        height: '100%',
        justifyContent: 'center',
    },
    navItemLink: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        textDecorationLine: 'none',
    },
    navLinkInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.navy,
        marginRight: 6,
    },
    chevron: {
        width: 8,
        height: 8,
        borderLeftWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: Colors.navyMedium,
        transform: [{ rotate: '-45deg' }, { translateY: -2 }],
    },
    megaMenu: {
        position: 'absolute',
        top: '100%',
        left: -100,
        width: 600,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        zIndex: 9999,
        marginTop: -4, // Eliminate gap between trigger and dropdown
        pointerEvents: 'auto' as any, // Ensure dropdown is clickable
        ...Platform.select({
            web: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.1,
                shadowRadius: 25,
            },
            default: {
                elevation: 10
            }
        })
    },
    megaMenuInner: {
        flex: 1,
    },
    megaMenuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
        justifyContent: 'flex-start',
    },
    megaMenuItem: {
        width: Platform.OS === 'web' ? '46%' : '47%',
        margin: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    industryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    megaMenuTextContainer: {
        flex: 1,
    },
    megaMenuTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    megaMenuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.navy,
    },
    megaMenuDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                display: '-webkit-box' as any,
                WebkitLineClamp: 2 as any,
                WebkitBoxOrient: 'vertical' as any,
            }
        })
    },
    chevronIcon: {
        marginLeft: 6,
    },
    chevronIconRotated: {
        transform: [{ rotate: '180deg' }],
    },
    megaMenuWide: {
        width: 800,
        left: -200,
    },
    megaMenuGridIndustries: {
        // Keeps the same grid config from megaMenuGrid
    },
    megaMenuItemIndustry: {
        // Keeps the same item config from megaMenuItem
    },
    megaMenuLinkContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    industryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    megaMenuTextContainer: {
        flex: 1,
    },
    megaMenuTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    megaMenuDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
    arrowIcon: {
        opacity: 0,
        transform: [{ translateX: -4 }],
    },
    arrowIconVisible: {
        opacity: 1,
        transform: [{ translateX: 0 }],
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 16,
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#11a7fa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    menuIcon: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    mobileMenu: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#FFFFFF',
        zIndex: 90,
        paddingTop: 100, // Below header
    },
    mobileMenuScroll: {
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    mobileNavItem: {
        marginBottom: 24,
    },
    mobileMenuItemLink: {
        paddingVertical: 12,
        textDecorationLine: 'none',
    },
    mobileMenuItemText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.navy,
    },
    mobileSubMenu: {
        marginTop: 12,
        paddingLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: Colors.border,
    },
    mobileSubLink: {
        textDecorationLine: 'none',
    },
    mobileSubText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    mobileLoginBtn: {
        marginTop: 32,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    mobileLoginText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    main: {
        flex: 1,
    },
    mainContent: {
        flexGrow: 1,
    },
    footer: {
        backgroundColor: Colors.navy,
        paddingTop: 80,
        paddingBottom: 40,
    },
    footerTop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'space-between',
        marginBottom: 60,
    },
    footerColMain: {
        width: '100%',
        minWidth: 300,
    },
    footerLogoImage: {
        width: 160,
        height: 44,
        marginBottom: 24,
    },
    footerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24,
    },
    footerDesc: {
        color: '#94A3B8',
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 32,
    },
    socialRow: {
        flexDirection: 'row',
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerCol: {
        width: '100%',
    },
    footerLink: {
        color: '#94A3B8',
        fontSize: 15,
        textDecorationLine: 'none',
    },
    footerBottom: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 32,
        alignItems: 'center',
    },
    copyright: {
        color: '#64748B',
        fontSize: 14,
    }
});
