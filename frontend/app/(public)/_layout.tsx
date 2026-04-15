import { Slot, Link, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Easing, useWindowDimensions, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { Truck, Navigation, Facebook, Twitter, Linkedin, Instagram, Menu, X, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import CookieBanner from '@/components/CookieBanner';



export default function PublicLayout() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const { header, footer } = useCMS();
    const insets = useSafeAreaInsets();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
 
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

    return (
        <View style={styles.container}>
            {/* ANNOUNCEMENT BAR */}
            {header.enableAnnouncement && (
                <View style={[styles.announcementBar, { paddingTop: insets.top || 8, overflow: 'hidden', backgroundColor: header.announcementBgColor || Colors.primary }]}>
                    <Link href={(header.announcementLink || '/') as any} asChild>
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
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                zIndex: 100
            }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.logoContainer} 
                        onPress={() => router.push('/')}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={require('@/assets/images/logo-color-no-bg.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <View style={[styles.navLinks, SCREEN_WIDTH < 1024 ? { display: 'none' } : null]}>
                        {header.menuItems?.map((item: any) => (
                            <View 
                                key={item.id} 
                                style={[styles.navItemContainer]}
                                {...(isWeb ? {
                                    onMouseEnter: () => item.items ? setHoveredMenuId(item.id) : null,
                                    onMouseLeave: () => setHoveredMenuId(null)
                                } : {})}
                            >
                                <Link href={item.url as any} style={styles.navItemLink as any}>
                                    <View style={styles.navLinkInner}>
                                        <Text style={[styles.navText, hoveredMenuId === item.id && { color: Colors.primary }]}>{item.label}</Text>
                                        {item.items && <View style={[styles.chevron, hoveredMenuId === item.id && { transform: [{ rotate: '180deg' }] }]} />}
                                    </View>
                                </Link>

                                {item.items && hoveredMenuId === item.id && (
                                    <View style={styles.megaMenu}>
                                        <View style={styles.megaMenuInner}>
                                            <View style={styles.megaMenuGrid}>
                                                {item.items.map((subItem: any) => (
                                                    <Link key={subItem.id} href={subItem.url as any} style={styles.megaMenuItem as any} onPress={() => setHoveredMenuId(null)}>
                                                        <Text style={styles.megaMenuTitle}>{subItem.label}</Text>
                                                    </Link>
                                                ))}
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
                            onPress={() => router.push(header.loginBtnUrl as any)}
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

            {/* MOBILE NAVIGATION */}
            {isMenuOpen && (
                <View style={[styles.mobileMenu, { height: '100%' }]}>
                    <ScrollView contentContainerStyle={styles.mobileMenuScroll}>
                        {header.menuItems?.map((item: any) => (
                            <View key={item.id} style={styles.mobileNavItem}>
                                <Link href={item.url as any} style={styles.mobileMenuItemLink as any} onPress={() => !item.items && setIsMenuOpen(false)}>
                                    <Text style={styles.mobileMenuItemText}>{item.label}</Text>
                                </Link>
                                {item.items && (
                                    <View style={styles.mobileSubMenu}>
                                        {item.items.map((sub: any) => (
                                            <Link key={sub.id} href={sub.url as any} style={styles.mobileSubLink as any} onPress={() => setIsMenuOpen(false)}>
                                                <Text style={styles.mobileSubText}>{sub.label}</Text>
                                            </Link>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity 
                            style={styles.mobileLoginBtn}
                            onPress={() => { setIsMenuOpen(false); router.push(header.loginBtnUrl as any); }}
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
                                {footer.facebookUrl && <Link href={footer.facebookUrl as any} style={styles.socialBtn as any}><Facebook size={20} color={Colors.textInverse} /></Link>}
                                {footer.twitterUrl && <Link href={footer.twitterUrl as any} style={styles.socialBtn as any}><Twitter size={20} color={Colors.textInverse} /></Link>}
                                {footer.linkedinUrl && <Link href={footer.linkedinUrl as any} style={styles.socialBtn as any}><Linkedin size={20} color={Colors.textInverse} /></Link>}
                            </View>
                        </View>

                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Company</Text>
                            {footer.companyLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} style={styles.footerLink as any}>{link.label}</Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Solutions</Text>
                            {footer.solutionsLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} style={styles.footerLink as any}>{link.label}</Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Legal</Text>
                            {footer.legalLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} style={styles.footerLink as any}>{link.label}</Link>
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
        ...Platform.select({
            web: {
                whiteSpace: 'nowrap',
            }
        })
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
        gap: 0,
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
        gap: 6,
    },
    navText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.navy,
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
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        borderWidth: 1,
        borderColor: Colors.border,
        zIndex: 120,
        ...Platform.select({
            web: {
                marginTop: 10,
            }
        })
    },
    megaMenuInner: {
        flex: 1,
    },
    megaMenuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    megaMenuItem: {
        width: '47%',
        padding: 12,
        borderRadius: 8,
        ...Platform.select({
            web: {
                transition: 'background-color 0.2s',
                ':hover': {
                    backgroundColor: '#F8FAFC',
                }
            }
        })
    },
    megaMenuTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.navy,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgb(13 148 136 / 0.3)',
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
        gap: 16,
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
        gap: 48,
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
        gap: 16,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                transition: 'background-color 0.2s',
                ':hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                }
            }
        })
    },
    footerCol: {
        width: '100%',
        gap: 16,
    },
    footerLink: {
        color: '#94A3B8',
        fontSize: 15,
        textDecorationLine: 'none',
        ...Platform.select({
            web: {
                transition: 'color 0.2s',
                ':hover': {
                    color: '#FFFFFF',
                }
            }
        })
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
