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
    }, [header.enableAnnouncement, slideAnim]);
 
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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
            <View style={[styles.header, { paddingTop: header.enableAnnouncement ? 0 : (insets.top || 16) }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.logoContainer} 
                        onPress={() => router.push('/')}
                        activeOpacity={0.7}
                    >
                        {header.logoUrl ? (
                            <Image 
                                source={{ uri: header.logoUrl }} 
                                style={styles.logoImage} 
                                resizeMode="contain" 
                            />
                        ) : (
                            <View style={styles.logoFallback}>
                                <Text style={styles.logoFallbackText}>CYVHUB</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={[styles.navLinks, (Platform.OS === 'web' && SCREEN_WIDTH < 768) || Platform.OS !== 'web' ? { display: 'none' } : null]}>
                        {header.menuItems?.map((item: any) => (
                            <Link key={item.id} href={item.url as any} asChild>
                                <TouchableOpacity style={styles.navItem}>
                                    <Text style={styles.navText}>{item.label}</Text>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.loginBtn, (Platform.OS === 'web' && SCREEN_WIDTH < 768) || Platform.OS !== 'web' ? { display: 'none' } : null]} 
                        activeOpacity={0.8}
                        onPress={() => router.push(header.loginBtnUrl as any)}
                    >
                        <User size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.loginBtnText}>{header.loginBtnText}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.menuIcon, Platform.OS === 'web' && SCREEN_WIDTH > 768 ? { display: 'none' } : null]} 
                        onPress={toggleMenu}
                    >
                        <Menu size={28} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* MOBILE ACCORDION MENU */}
            {isMenuOpen && (
                <View style={styles.mobileMenu}>
                    {header.menuItems?.map((item: any) => (
                        <Link key={item.id} href={item.url as any} asChild>
                            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => setIsMenuOpen(false)}>
                                <Text style={styles.mobileMenuItemText}>{item.label}</Text>
                            </TouchableOpacity>
                        </Link>
                    ))}
                    <Link href={header.loginBtnUrl as any} asChild>
                        <TouchableOpacity style={styles.mobileMenuLoginBtn} onPress={() => setIsMenuOpen(false)}>
                            <Text style={styles.mobileMenuLoginText}>{header.loginBtnText}</Text>
                        </TouchableOpacity>
                    </Link>
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
                                {footer.facebookUrl && <Link href={footer.facebookUrl as any} asChild><TouchableOpacity style={styles.socialBtn}><Facebook size={20} color={Colors.textInverse} /></TouchableOpacity></Link>}
                                {footer.twitterUrl && <Link href={footer.twitterUrl as any} asChild><TouchableOpacity style={styles.socialBtn}><Twitter size={20} color={Colors.textInverse} /></TouchableOpacity></Link>}
                                {footer.linkedinUrl && <Link href={footer.linkedinUrl as any} asChild><TouchableOpacity style={styles.socialBtn}><Linkedin size={20} color={Colors.textInverse} /></TouchableOpacity></Link>}
                            </View>
                        </View>

                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Company</Text>
                            {footer.companyLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} asChild><TouchableOpacity><Text style={styles.footerLink}>{link.label}</Text></TouchableOpacity></Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Solutions</Text>
                            {footer.solutionsLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} asChild><TouchableOpacity><Text style={styles.footerLink}>{link.label}</Text></TouchableOpacity></Link>
                            ))}
                        </View>
                        <View style={[styles.footerCol, { width: SCREEN_WIDTH >= 768 ? '22%' : SCREEN_WIDTH >= 640 ? '45%' : '100%' }]}>
                            <Text style={styles.footerTitle}>Legal</Text>
                            {footer.legalLinks?.map((link) => (
                                <Link key={link.id} href={link.url as any} asChild><TouchableOpacity><Text style={styles.footerLink}>{link.label}</Text></TouchableOpacity></Link>
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
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
        zIndex: 10,
        ...Platform.select({
            web: {
                position: 'sticky',
                top: 0,
            }
        })
    },
    announcementBar: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        zIndex: 11,
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
        paddingVertical: 12,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    logoContainer: {
        zIndex: 10,
        flexShrink: 0,
        height: 40,
        minWidth: 140,
        cursor: 'pointer',
    },
    logoImage: {
        width: 150,
        height: '100%',
    },
    logoFallback: {
        width: 140,
        height: 60,
        justifyContent: 'center',
    },
    logoFallbackText: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: -1,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    navItem: {
        paddingVertical: 8,
    },
    navText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    menuIcon: {
        padding: 8,
    },
    mobileMenu: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 9,
    },
    mobileMenuItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    mobileMenuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    mobileMenuLoginBtn: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    mobileMenuLoginText: {
        color: '#FFFFFF',
        fontSize: 16,
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
        paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    footerTop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'space-between',
        gap: 32,
        marginBottom: 40,
    },
    footerColMain: {
        width: '100%',
        minWidth: 280,
    },
    footerLogoImage: {
        width: 140,
        height: 40,
        marginBottom: 16,
    },
    footerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    footerDesc: {
        color: '#94A3B8',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 24,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 16,
    },
    socialBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerCol: {
        width: '100%',
        gap: 16,
    },
    footerLink: {
        color: '#94A3B8',
        fontSize: 15,
    },
    footerBottom: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 24,
        alignItems: 'center',
    },
    copyright: {
        color: '#64748B',
        fontSize: 14,
    }
});
