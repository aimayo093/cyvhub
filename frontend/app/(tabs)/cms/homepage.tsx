import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Layout,
    Type,
    ImageIcon,
    Link as LinkIcon,
    Plus,
    Trash2,
    Save,
    Eye,
    ArrowLeft,
    GripVertical,
    AlignLeft,
    Settings,
    MessageSquareQuote,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import {
    HeaderConfig,
    HeroConfig,
    SlideConfig,
    HowItWorksConfig,
    WhyUsConfig,
    ServicesConfig,
    CustomSectionConfig,
    CtaConfig,
    FooterConfig,
    StatsConfig,
    IndustriesConfig,
    TestimonialsConfig,
    initialHeader,
    initialHero,
    initialSlides,
    initialHowItWorks,
    initialWhyUs,
    initialServices,
    initialCta,
    initialFooter,
    initialStats,
    initialIndustries,
    initialTestimonials
} from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

const initialCustomSections: CustomSectionConfig[] = [];

const TABS = ['header', 'hero', 'slider', 'howItWorks', 'whyUs', 'services', 'stats', 'industries', 'testimonials', 'custom', 'cta', 'footer'] as const;
type TabType = typeof TABS[number];

export default function HomepageCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { homepageData, header, footer, setHeader, setFooter, setHomepageSection, isLoaded } = useCMS();
    const [activeTab, setActiveTab] = useState<TabType>((params.tab as TabType) || 'hero');

    const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(initialHeader);
    const [hero, setHero] = useState<HeroConfig>(initialHero);
    const [slides, setSlides] = useState<SlideConfig[]>(initialSlides);

    // New tab states
    const [howItWorks, setHowItWorks] = useState<HowItWorksConfig>(initialHowItWorks);
    const [whyUs, setWhyUs] = useState<WhyUsConfig>(initialWhyUs);
    const [servicesData, setServicesData] = useState<ServicesConfig>(initialServices);
    const [statsData, setStatsData] = useState<StatsConfig>(initialStats);
    const [industriesData, setIndustriesData] = useState<IndustriesConfig>(initialIndustries);
    const [testimonialsData, setTestimonialsData] = useState<TestimonialsConfig>(initialTestimonials);
    const [customSections, setCustomSections] = useState<CustomSectionConfig[]>(initialCustomSections);
    const [cta, setCta] = useState<CtaConfig>(initialCta);
    const [footerConfig, setFooterConfig] = useState<FooterConfig>(initialFooter);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Sync local state with Global CMS Context on load
    React.useEffect(() => {
        if (isLoaded) {
            if (header) setHeaderConfig(header);
            if (footer) setFooterConfig(footer);
            
            if (homepageData['cms_heroConfig']) setHero(homepageData['cms_heroConfig']);
            if (homepageData['cms_slidesConfig']) setSlides(homepageData['cms_slidesConfig']);
            if (homepageData['cms_howItWorksConfig']) setHowItWorks(homepageData['cms_howItWorksConfig']);
            if (homepageData['cms_whyUsConfig']) setWhyUs(homepageData['cms_whyUsConfig']);
            if (homepageData['cms_servicesConfig']) setServicesData(homepageData['cms_servicesConfig']);
            if (homepageData['cms_statsConfig']) setStatsData(homepageData['cms_statsConfig']);
            if (homepageData['cms_industriesConfig']) setIndustriesData(homepageData['cms_industriesConfig']);
            if (homepageData['cms_testimonialsConfig']) setTestimonialsData(homepageData['cms_testimonialsConfig']);
            if (homepageData['cms_customSections']) setCustomSections(homepageData['cms_customSections']);
            if (homepageData['cms_ctaConfig']) setCta(homepageData['cms_ctaConfig']);
        }
    }, [isLoaded, homepageData, header, footer]);

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            // Broadcast to global CMS context with sync: true to update backend & local cache
            await setHeader(headerConfig, true);
            await setFooter(footerConfig, true);
            
            // Sync all homepage sections
            await setHomepageSection('cms_heroConfig', hero, true);
            await setHomepageSection('cms_slidesConfig', slides, true);
            await setHomepageSection('cms_howItWorksConfig', howItWorks, true);
            await setHomepageSection('cms_whyUsConfig', whyUs, true);
            await setHomepageSection('cms_servicesConfig', servicesData, true);
            await setHomepageSection('cms_statsConfig', statsData, true);
            await setHomepageSection('cms_industriesConfig', industriesData, true);
            await setHomepageSection('cms_testimonialsConfig', testimonialsData, true);
            await setHomepageSection('cms_customSections', customSections, true);
            await setHomepageSection('cms_ctaConfig', cta, true);

            setHasUnsavedChanges(false);
            alert('Homepage Content Published Globally!');
        } catch (error) {
            console.error('Failed to save CMS data', error);
            alert('Error saving data to backend');
        }
    };

    const updateHero = (key: keyof HeroConfig, value: any) => {
        setHero(prev => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const addSlide = () => {
        const newSlide: SlideConfig = {
            id: Date.now().toString(),
            title: 'New Slide',
            description: 'Slide description...',
            imageUrl: 'https://images.unsplash.com/photo-1505761671935-60b317426b38?w=800&q=80',
            ctaText: 'Learn More',
            ctaLink: '/services',
        };
        setSlides([...slides, newSlide]);
        setHasUnsavedChanges(true);
    };

    const updateSlide = (id: string, key: keyof SlideConfig, value: string) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [key]: value } : s));
        setHasUnsavedChanges(true);
    };

    const removeSlide = (id: string) => {
        setSlides(slides.filter(s => s.id !== id));
        setHasUnsavedChanges(true);
    };

    const moveTestimonial = (index: number, direction: 'up' | 'down') => {
        const newTests = [...testimonialsData.testimonials];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newTests.length) return;

        const temp = newTests[index];
        newTests[index] = newTests[newIndex];
        newTests[newIndex] = temp;

        setTestimonialsData({ ...testimonialsData, testimonials: newTests });
        setHasUnsavedChanges(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderTabLabel = (tab: TabType) => {
        switch (tab) {
            case 'howItWorks': return 'How it Works';
            case 'whyUs': return 'Why Choose Us';
            case 'custom': return 'Custom Blocks';
            case 'stats': return 'Trust Stats';
            case 'industries': return 'Industries';
            case 'testimonials': return 'Testimonials';
            default: return tab.charAt(0).toUpperCase() + tab.slice(1);
        }
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Homepage Editor</Text>
                        <Text style={styles.headerSubtitle}>Marketing CMS Module</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.previewButton}>
                            <Eye size={16} color={Colors.textInverse} />
                            <Text style={styles.previewButtonText}>Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasUnsavedChanges}
                        >
                            <Save size={16} color={hasUnsavedChanges ? '#FFF' : 'rgba(255,255,255,0.5)'} />
                            <Text style={[styles.saveButtonText, !hasUnsavedChanges && { color: 'rgba(255,255,255,0.5)' }]}>Publish</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {renderTabLabel(tab)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {activeTab === 'hero' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hero Banner Configuration</Text>
                        <Text style={styles.sectionDesc}>This is the first section visitors see when landing on the site.</Text>

                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Headline</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={hero.headline}
                                    onChangeText={t => updateHero('headline', t)}
                                    placeholder="Main heading text"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Subheading</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={hero.subheading}
                                    onChangeText={t => updateHero('subheading', t)}
                                    placeholder="Supporting text below headline"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <View style={styles.inputLabelRow}>
                                        <Type size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>CTA Button Text</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={hero.ctaText}
                                        onChangeText={t => updateHero('ctaText', t)}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <View style={styles.inputLabelRow}>
                                        <LinkIcon size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>CTA Link</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={hero.ctaLink}
                                        onChangeText={t => updateHero('ctaLink', t)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <ImageIcon size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Background Images URLs</Text>
                                    <TouchableOpacity
                                        style={[styles.addButton, { paddingVertical: 4, paddingHorizontal: 8, marginLeft: 'auto' }]}
                                        onPress={() => updateHero('bgImages', [...hero.bgImages, ''])}
                                    >
                                        <Plus size={14} color="#FFF" />
                                        <Text style={[styles.addButtonText, { fontSize: 12 }]}>Add Image</Text>
                                    </TouchableOpacity>
                                </View>
                                {hero.bgImages.map((img, idx) => (
                                    <View key={idx} style={[styles.imageInputRow, { marginBottom: 8 }]}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                            value={img}
                                            onChangeText={t => {
                                                const newImgs = [...hero.bgImages];
                                                newImgs[idx] = t;
                                                updateHero('bgImages', newImgs);
                                            }}
                                            placeholder="Image URL"
                                        />
                                        {img ? <Image source={{ uri: img }} style={styles.imagePreviewSmall} /> : null}
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newImgs = hero.bgImages.filter((_, i) => i !== idx);
                                                updateHero('bgImages', newImgs);
                                            }}
                                            style={{ padding: 8, backgroundColor: Colors.dangerLight, borderRadius: 8, marginLeft: 8 }}
                                        >
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={styles.switchLabel}>Show Guest Booking Widget</Text>
                                        <Text style={styles.switchDesc}>Display the postcode quote widget below the hero.</Text>
                                    </View>
                                    <Switch
                                        value={hero.showGuestWidget}
                                        onValueChange={v => updateHero('showGuestWidget', v)}
                                        trackColor={{ true: Colors.adminPrimary }}
                                    />
                                </View>
                                {hero.showGuestWidget && (
                                    <View style={{ marginTop: 16, backgroundColor: Colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
                                        <Text style={[styles.inputLabel, { marginBottom: 16 }]}>Guest Widget Configuration</Text>

                                        <Text style={styles.inputLabel}>Widget Title</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6, marginBottom: 12 }]}
                                            value={hero.guestWidgetTitle}
                                            onChangeText={t => updateHero('guestWidgetTitle', t)}
                                            placeholder="e.g. Get a quick estimate"
                                        />

                                        <Text style={styles.inputLabel}>Widget Subtitle</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6, marginBottom: 16 }]}
                                            value={hero.guestWidgetSubtitle}
                                            onChangeText={t => updateHero('guestWidgetSubtitle', t)}
                                            placeholder="e.g. Enter pickup and dropoff postcodes"
                                        />

                                        <View style={[styles.switchRow, { marginBottom: 12 }]}>
                                            <View>
                                                <Text style={styles.switchLabel}>Show Vehicle Selection</Text>
                                                <Text style={styles.switchDesc}>Allow users to pick van sizes.</Text>
                                            </View>
                                            <Switch
                                                value={hero.showVehicleSelection}
                                                onValueChange={v => updateHero('showVehicleSelection', v)}
                                                trackColor={{ true: Colors.adminPrimary }}
                                            />
                                        </View>

                                        <View style={[styles.switchRow, { marginBottom: 16 }]}>
                                            <View>
                                                <Text style={styles.switchLabel}>Show Date Selection</Text>
                                                <Text style={styles.switchDesc}>Allow users to pick "Ready Now" or "Later".</Text>
                                            </View>
                                            <Switch
                                                value={hero.showDateSelection}
                                                onValueChange={v => updateHero('showDateSelection', v)}
                                                trackColor={{ true: Colors.adminPrimary }}
                                            />
                                        </View>

                                        <Text style={styles.inputLabel}>Button Text</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6 }]}
                                            value={hero.guestWidgetButtonText}
                                            onChangeText={t => updateHero('guestWidgetButtonText', t)}
                                            placeholder="e.g. Get Instant Quote"
                                        />
                                    </View>
                                )}

                                <View style={[styles.switchRow, { marginTop: 24 }]}>
                                    <View>
                                        <Text style={styles.switchLabel}>Show Track Parcel Widget</Text>
                                        <Text style={styles.switchDesc}>Display the tracking tab next to quoting.</Text>
                                    </View>
                                    <Switch
                                        value={hero.showTrackWidget}
                                        onValueChange={v => updateHero('showTrackWidget', v)}
                                        trackColor={{ true: Colors.adminPrimary }}
                                    />
                                </View>
                                {hero.showTrackWidget && (
                                    <View style={{ marginTop: 16, backgroundColor: Colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
                                        <Text style={[styles.inputLabel, { marginBottom: 16 }]}>Tracking Widget Configuration</Text>

                                        <Text style={styles.inputLabel}>Widget Title</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6, marginBottom: 12 }]}
                                            value={hero.trackWidgetTitle}
                                            onChangeText={t => updateHero('trackWidgetTitle', t)}
                                            placeholder="e.g. Track a Parcel"
                                        />

                                        <Text style={styles.inputLabel}>Widget Subtitle</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6, marginBottom: 16 }]}
                                            value={hero.trackWidgetSubtitle}
                                            onChangeText={t => updateHero('trackWidgetSubtitle', t)}
                                            placeholder="e.g. Enter your tracking number"
                                        />

                                        <Text style={styles.inputLabel}>Button Text</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6 }]}
                                            value={hero.trackWidgetButtonText}
                                            onChangeText={t => updateHero('trackWidgetButtonText', t)}
                                            placeholder="e.g. Track Delivery"
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'slider' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Marketing Slider</Text>
                                <Text style={styles.sectionDesc}>Manage the rotating carousel below the hero.</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} onPress={addSlide}>
                                <Plus size={16} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Slide</Text>
                            </TouchableOpacity>
                        </View>

                        {slides.map((slide, index) => (
                            <View key={slide.id} style={styles.slideCard}>
                                <View style={styles.slideHeader}>
                                    <View style={styles.slideDragHandle}>
                                        <GripVertical size={16} color={Colors.textMuted} />
                                        <Text style={styles.slideNum}>Slide {index + 1}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeSlide(slide.id)} style={styles.trashBtn}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.slideContentSplit}>
                                    <Image source={{ uri: slide.imageUrl }} style={styles.slideGraphic} />
                                    <View style={styles.slideForm}>
                                        <TextInput
                                            style={[styles.input, styles.inputSmall]}
                                            value={slide.title}
                                            onChangeText={t => updateSlide(slide.id, 'title', t)}
                                            placeholder="Slide Title"
                                        />
                                        <TextInput
                                            style={[styles.input, styles.inputSmall]}
                                            value={slide.description}
                                            onChangeText={t => updateSlide(slide.id, 'description', t)}
                                            placeholder="Slide Description"
                                        />
                                        <View style={styles.row}>
                                            <TextInput
                                                style={[styles.input, styles.inputSmall, { flex: 1 }]}
                                                value={slide.ctaText}
                                                onChangeText={t => updateSlide(slide.id, 'ctaText', t)}
                                                placeholder="Button Text"
                                            />
                                            <TextInput
                                                style={[styles.input, styles.inputSmall, { flex: 1 }]}
                                                value={slide.ctaLink}
                                                onChangeText={t => updateSlide(slide.id, 'ctaLink', t)}
                                                placeholder="Link URL"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* MOCK PLACEHOLDERS FOR NEW TABS */}
                {activeTab === 'header' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Header & Navigation</Text>
                        <Text style={styles.sectionDesc}>Manage the global top bar.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <ImageIcon size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Logo URL</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={headerConfig.logoUrl}
                                    onChangeText={t => { setHeaderConfig({ ...headerConfig, logoUrl: t }); setHasUnsavedChanges(true); }}
                                    placeholder="URL to logo PNG/SVG"
                                />
                            </View>
                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Enable Sticky Navigation</Text>
                                    <Text style={styles.switchDesc}>Header stays visible when scrolling down.</Text>
                                </View>
                                <Switch
                                    value={headerConfig.enableSticky}
                                    onValueChange={v => { setHeaderConfig({ ...headerConfig, enableSticky: v }); setHasUnsavedChanges(true); }}
                                    trackColor={{ true: Colors.adminPrimary }}
                                />
                            </View>

                            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24 }]}>Announcement Bar</Text>
                            <View style={[styles.switchRow, { marginTop: 12 }]}>
                                <View>
                                    <Text style={styles.switchLabel}>Show Announcement</Text>
                                    <Text style={styles.switchDesc}>Display a solid text banner above the main header.</Text>
                                </View>
                                <Switch
                                    value={headerConfig.enableAnnouncement}
                                    onValueChange={v => { setHeaderConfig({ ...headerConfig, enableAnnouncement: v }); setHasUnsavedChanges(true); }}
                                    trackColor={{ true: Colors.adminPrimary }}
                                />
                            </View>

                            {headerConfig.enableAnnouncement && (
                                <View style={{ marginTop: 16, gap: 16 }}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Announcement Text</Text>
                                        <TextInput
                                            style={[styles.input, { marginTop: 6 }]}
                                            value={headerConfig.announcementText}
                                            onChangeText={t => { setHeaderConfig({ ...headerConfig, announcementText: t }); setHasUnsavedChanges(true); }}
                                            placeholder="e.g. Black Friday Sale! 20% Off"
                                        />
                                    </View>
                                    <View style={styles.row}>
                                        <View style={[styles.inputGroup, { flex: 2 }]}>
                                            <Text style={styles.inputLabel}>Click Link (Optional)</Text>
                                            <TextInput
                                                style={[styles.input, { marginTop: 6 }]}
                                                value={headerConfig.announcementLink}
                                                onChangeText={t => { setHeaderConfig({ ...headerConfig, announcementLink: t }); setHasUnsavedChanges(true); }}
                                                placeholder="/path"
                                            />
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>Background Color</Text>
                                            <TextInput
                                                style={[styles.input, { marginTop: 6 }]}
                                                value={headerConfig.announcementBgColor}
                                                onChangeText={t => { setHeaderConfig({ ...headerConfig, announcementBgColor: t }); setHasUnsavedChanges(true); }}
                                                placeholder="#HEX"
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24 }]}>Client Login Button</Text>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Button Text</Text>
                                    <TextInput
                                        style={[styles.input, { marginTop: 6 }]}
                                        value={headerConfig.loginBtnText}
                                        onChangeText={t => { setHeaderConfig({ ...headerConfig, loginBtnText: t }); setHasUnsavedChanges(true); }}
                                        placeholder="e.g. Client Login"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Button Link</Text>
                                    <TextInput
                                        style={[styles.input, { marginTop: 6 }]}
                                        value={headerConfig.loginBtnUrl}
                                        onChangeText={t => { setHeaderConfig({ ...headerConfig, loginBtnUrl: t }); setHasUnsavedChanges(true); }}
                                        placeholder="e.g. /login"
                                    />
                                </View>
                            </View>

                            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Main Menu Items</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => {
                                        setHeaderConfig({
                                            ...headerConfig,
                                            menuItems: [...headerConfig.menuItems, { id: Date.now().toString(), label: 'New Item', url: '/' }]
                                        });
                                        setHasUnsavedChanges(true);
                                    }}
                                >
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Menu Item</Text>
                                </TouchableOpacity>
                            </View>

                            {headerConfig.menuItems.map((item, idx) => (
                                <View key={item.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Item {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setHeaderConfig({
                                                    ...headerConfig,
                                                    menuItems: headerConfig.menuItems.filter(m => m.id !== item.id)
                                                });
                                                setHasUnsavedChanges(true);
                                            }}
                                            style={styles.trashBtn}
                                        >
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <View style={styles.row}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, height: 44 }]}
                                                value={item.label}
                                                placeholder="Label (e.g. Services)"
                                                onChangeText={t => {
                                                    const newItems = [...headerConfig.menuItems];
                                                    newItems[idx].label = t;
                                                    setHeaderConfig({ ...headerConfig, menuItems: newItems });
                                                    setHasUnsavedChanges(true);
                                                }}
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1, height: 44 }]}
                                                value={item.url}
                                                placeholder="URL (e.g. /services)"
                                                onChangeText={t => {
                                                    const newItems = [...headerConfig.menuItems];
                                                    newItems[idx].url = t;
                                                    setHeaderConfig({ ...headerConfig, menuItems: newItems });
                                                    setHasUnsavedChanges(true);
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'howItWorks' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>How It Works Config</Text>
                        <Text style={styles.sectionDesc}>Configure the 3 steps shown to users.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Title</Text>
                                </View>
                                <TextInput style={styles.input} value={howItWorks.title} onChangeText={t => { setHowItWorks({ ...howItWorks, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Subtitle</Text>
                                </View>
                                <TextInput style={styles.input} value={howItWorks.subtitle} onChangeText={t => { setHowItWorks({ ...howItWorks, subtitle: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Steps</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setHowItWorks({
                                        ...howItWorks,
                                        steps: [...howItWorks.steps, { id: Date.now().toString(), num: `0${howItWorks.steps.length + 1}`, title: 'New Step', desc: '', icon: 'CheckCircle' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Step</Text>
                                </TouchableOpacity>
                            </View>

                            {howItWorks.steps.map((step, idx) => (
                                <View key={step.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Step {idx + 1} ({step.num})</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setHowItWorks({ ...howItWorks, steps: howItWorks.steps.filter(s => s.id !== step.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <View style={styles.row}>
                                            <TextInput style={[styles.input, { flex: 1, height: 44 }]} value={step.num} placeholder="Number (e.g. 01)" onChangeText={t => {
                                                const newSteps = [...howItWorks.steps];
                                                newSteps[idx].num = t;
                                                setHowItWorks({ ...howItWorks, steps: newSteps });
                                                setHasUnsavedChanges(true);
                                            }} />
                                            <TextInput style={[styles.input, { flex: 3 }]} value={step.title} placeholder="Step Title" onChangeText={t => {
                                                const newSteps = [...howItWorks.steps];
                                                newSteps[idx].title = t;
                                                setHowItWorks({ ...howItWorks, steps: newSteps });
                                                setHasUnsavedChanges(true);
                                            }} />
                                        </View>
                                        <TextInput style={[styles.input, { height: 60 }]} multiline value={step.desc} placeholder="Description" onChangeText={t => {
                                            const newSteps = [...howItWorks.steps];
                                            newSteps[idx].desc = t;
                                            setHowItWorks({ ...howItWorks, steps: newSteps });
                                            setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'whyUs' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Why Choose Us Config</Text>
                        <Text style={styles.sectionDesc}>Configure the 4 feature cards.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Tag</Text>
                                </View>
                                <TextInput style={styles.input} value={whyUs.tag} onChangeText={t => { setWhyUs({ ...whyUs, tag: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Main Headline</Text>
                                </View>
                                <TextInput style={styles.input} value={whyUs.title} onChangeText={t => { setWhyUs({ ...whyUs, title: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Feature Cards</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setWhyUs({
                                        ...whyUs,
                                        cards: [...whyUs.cards, { id: Date.now().toString(), title: 'New Feature', desc: '', icon: 'Star' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Card</Text>
                                </TouchableOpacity>
                            </View>

                            {whyUs.cards.map((card, idx) => (
                                <View key={card.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Card {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setWhyUs({ ...whyUs, cards: whyUs.cards.filter(c => c.id !== card.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <TextInput style={styles.input} value={card.title} placeholder="Title" onChangeText={t => {
                                            const newCards = [...whyUs.cards];
                                            newCards[idx].title = t;
                                            setWhyUs({ ...whyUs, cards: newCards });
                                            setHasUnsavedChanges(true);
                                        }} />
                                        <TextInput style={[styles.input, { height: 60 }]} multiline value={card.desc} placeholder="Description" onChangeText={t => {
                                            const newCards = [...whyUs.cards];
                                            newCards[idx].desc = t;
                                            setWhyUs({ ...whyUs, cards: newCards });
                                            setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'services' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Services Overview Config</Text>
                        <Text style={styles.sectionDesc}>Manage the 3 highlighted service banners.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Title</Text>
                                </View>
                                <TextInput style={styles.input} value={servicesData.title} onChangeText={t => { setServicesData({ ...servicesData, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Subtitle</Text>
                                </View>
                                <TextInput style={styles.input} value={servicesData.subtitle} onChangeText={t => { setServicesData({ ...servicesData, subtitle: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Service Banners</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setServicesData({
                                        ...servicesData,
                                        banners: [...servicesData.banners, { id: Date.now().toString(), title: 'New Banner', desc: '', imageUrl: '', link: '/' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Banner</Text>
                                </TouchableOpacity>
                            </View>

                            {servicesData.banners.map((banner, idx) => (
                                <View key={banner.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Banner {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setServicesData({ ...servicesData, banners: servicesData.banners.filter(b => b.id !== banner.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.slideContentSplit}>
                                        <Image source={{ uri: banner.imageUrl || 'https://via.placeholder.com/800x400' }} style={styles.slideGraphic} />
                                        <View style={styles.slideForm}>
                                            <TextInput style={styles.inputSmall} value={banner.title} placeholder="Title" onChangeText={t => {
                                                const newBanners = [...servicesData.banners];
                                                newBanners[idx].title = t;
                                                setServicesData({ ...servicesData, banners: newBanners });
                                                setHasUnsavedChanges(true);
                                            }} />
                                            <TextInput style={styles.inputSmall} value={banner.desc} placeholder="Description" onChangeText={t => {
                                                const newBanners = [...servicesData.banners];
                                                newBanners[idx].desc = t;
                                                setServicesData({ ...servicesData, banners: newBanners });
                                                setHasUnsavedChanges(true);
                                            }} />
                                            <TextInput style={styles.inputSmall} value={banner.link} placeholder="Link URL" onChangeText={t => {
                                                const newBanners = [...servicesData.banners];
                                                newBanners[idx].link = t;
                                                setServicesData({ ...servicesData, banners: newBanners });
                                                setHasUnsavedChanges(true);
                                            }} />
                                        </View>
                                    </View>
                                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                        <TextInput style={styles.inputSmall} value={banner.imageUrl} placeholder="Image URL" onChangeText={t => {
                                            const newBanners = [...servicesData.banners];
                                            newBanners[idx].imageUrl = t;
                                            setServicesData({ ...servicesData, banners: newBanners });
                                            setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'cta' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Call to Action Banner</Text>
                        <Text style={styles.sectionDesc}>The final conversion banner above the footer.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Headline</Text>
                                </View>
                                <TextInput style={styles.input} value={cta.title} onChangeText={t => { setCta({ ...cta, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Description</Text>
                                </View>
                                <TextInput style={[styles.input, styles.textArea]} multiline value={cta.desc} onChangeText={t => { setCta({ ...cta, desc: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Primary Button Text</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={cta.primaryBtnText} onChangeText={t => { setCta({ ...cta, primaryBtnText: t }); setHasUnsavedChanges(true); }} />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Primary Link</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={cta.primaryBtnLink} onChangeText={t => { setCta({ ...cta, primaryBtnLink: t }); setHasUnsavedChanges(true); }} />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Secondary Button Text</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={cta.secondaryBtnText} onChangeText={t => { setCta({ ...cta, secondaryBtnText: t }); setHasUnsavedChanges(true); }} />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Secondary Link</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={cta.secondaryBtnLink} onChangeText={t => { setCta({ ...cta, secondaryBtnLink: t }); setHasUnsavedChanges(true); }} />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'footer' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Global Footer Config</Text>
                        <Text style={styles.sectionDesc}>Manage the site-wide footer content and links.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Company Bio</Text>
                                <TextInput style={[styles.input, styles.textArea, { marginTop: 6 }]} multiline value={footerConfig.companyBio} onChangeText={t => { setFooterConfig({ ...footerConfig, companyBio: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Registered Address</Text>
                                <TextInput style={[styles.input, { marginTop: 6 }]} value={footerConfig.address} onChangeText={t => { setFooterConfig({ ...footerConfig, address: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Support Email</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={footerConfig.email} onChangeText={t => { setFooterConfig({ ...footerConfig, email: t }); setHasUnsavedChanges(true); }} />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput style={[styles.input, { marginTop: 6 }]} value={footerConfig.phone} onChangeText={t => { setFooterConfig({ ...footerConfig, phone: t }); setHasUnsavedChanges(true); }} />
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Social Media Links</Text>
                            <View style={styles.inputGroup}>
                                <TextInput style={styles.input} placeholder="Twitter / X URL" value={footerConfig.twitterUrl} onChangeText={t => { setFooterConfig({ ...footerConfig, twitterUrl: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <TextInput style={styles.input} placeholder="LinkedIn URL" value={footerConfig.linkedinUrl} onChangeText={t => { setFooterConfig({ ...footerConfig, linkedinUrl: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <TextInput style={styles.input} placeholder="Facebook URL" value={footerConfig.facebookUrl} onChangeText={t => { setFooterConfig({ ...footerConfig, facebookUrl: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 16 }]}>
                                <Text style={styles.inputLabel}>Copyright Text</Text>
                                <TextInput style={[styles.input, { marginTop: 6 }]} value={footerConfig.copyright} onChangeText={t => { setFooterConfig({ ...footerConfig, copyright: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            {/* --- Solutions Links --- */}
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24 }]}>Solutions Links</Text>
                                <TouchableOpacity style={[styles.addButton, { marginTop: 24 }]} onPress={() => {
                                    setFooterConfig({
                                        ...footerConfig,
                                        solutionsLinks: [...footerConfig.solutionsLinks, { id: Date.now().toString(), label: 'New Link', url: '/' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Link</Text>
                                </TouchableOpacity>
                            </View>
                            {footerConfig.solutionsLinks.map((link, idx) => (
                                <View key={link.id} style={styles.row}>
                                    <TextInput style={[styles.input, { flex: 1, marginTop: 6 }]} value={link.label} placeholder="Link Label" onChangeText={t => {
                                        const newLinks = [...footerConfig.solutionsLinks]; newLinks[idx].label = t;
                                        setFooterConfig({ ...footerConfig, solutionsLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TextInput style={[styles.input, { flex: 2, marginTop: 6 }]} value={link.url} placeholder="URL" onChangeText={t => {
                                        const newLinks = [...footerConfig.solutionsLinks]; newLinks[idx].url = t;
                                        setFooterConfig({ ...footerConfig, solutionsLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TouchableOpacity onPress={() => {
                                        setFooterConfig({ ...footerConfig, solutionsLinks: footerConfig.solutionsLinks.filter(l => l.id !== link.id) });
                                        setHasUnsavedChanges(true);
                                    }} style={[styles.trashBtn, { marginTop: 18, marginLeft: 8 }]}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* --- Company Links --- */}
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24 }]}>Company Links</Text>
                                <TouchableOpacity style={[styles.addButton, { marginTop: 24 }]} onPress={() => {
                                    setFooterConfig({
                                        ...footerConfig,
                                        companyLinks: [...footerConfig.companyLinks, { id: Date.now().toString(), label: 'New Link', url: '/' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Link</Text>
                                </TouchableOpacity>
                            </View>
                            {footerConfig.companyLinks.map((link, idx) => (
                                <View key={link.id} style={styles.row}>
                                    <TextInput style={[styles.input, { flex: 1, marginTop: 6 }]} value={link.label} placeholder="Link Label" onChangeText={t => {
                                        const newLinks = [...footerConfig.companyLinks]; newLinks[idx].label = t;
                                        setFooterConfig({ ...footerConfig, companyLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TextInput style={[styles.input, { flex: 2, marginTop: 6 }]} value={link.url} placeholder="URL" onChangeText={t => {
                                        const newLinks = [...footerConfig.companyLinks]; newLinks[idx].url = t;
                                        setFooterConfig({ ...footerConfig, companyLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TouchableOpacity onPress={() => {
                                        setFooterConfig({ ...footerConfig, companyLinks: footerConfig.companyLinks.filter(l => l.id !== link.id) });
                                        setHasUnsavedChanges(true);
                                    }} style={[styles.trashBtn, { marginTop: 18, marginLeft: 8 }]}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* --- Legal Links --- */}
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24 }]}>Legal Links</Text>
                                <TouchableOpacity style={[styles.addButton, { marginTop: 24 }]} onPress={() => {
                                    setFooterConfig({
                                        ...footerConfig,
                                        legalLinks: [...footerConfig.legalLinks, { id: Date.now().toString(), label: 'New Link', url: '/' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Link</Text>
                                </TouchableOpacity>
                            </View>
                            {footerConfig.legalLinks.map((link, idx) => (
                                <View key={link.id} style={styles.row}>
                                    <TextInput style={[styles.input, { flex: 1, marginTop: 6 }]} value={link.label} placeholder="Link Label" onChangeText={t => {
                                        const newLinks = [...footerConfig.legalLinks]; newLinks[idx].label = t;
                                        setFooterConfig({ ...footerConfig, legalLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TextInput style={[styles.input, { flex: 2, marginTop: 6 }]} value={link.url} placeholder="URL" onChangeText={t => {
                                        const newLinks = [...footerConfig.legalLinks]; newLinks[idx].url = t;
                                        setFooterConfig({ ...footerConfig, legalLinks: newLinks }); setHasUnsavedChanges(true);
                                    }} />
                                    <TouchableOpacity onPress={() => {
                                        setFooterConfig({ ...footerConfig, legalLinks: footerConfig.legalLinks.filter(l => l.id !== link.id) });
                                        setHasUnsavedChanges(true);
                                    }} style={[styles.trashBtn, { marginTop: 18, marginLeft: 8 }]}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'stats' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Trust Statistics Config</Text>
                        <Text style={styles.sectionDesc}>Manage the live animated stats bar to build trust.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Title</Text>
                                </View>
                                <TextInput style={styles.input} value={statsData.title} onChangeText={t => { setStatsData({ ...statsData, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Subtitle</Text>
                                </View>
                                <TextInput style={styles.input} value={statsData.subtitle} onChangeText={t => { setStatsData({ ...statsData, subtitle: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Statistics Modules</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setStatsData({
                                        ...statsData,
                                        stats: [...statsData.stats, { id: Date.now().toString(), label: 'New Stat', value: '100+', icon: 'TrendingUp' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Stat</Text>
                                </TouchableOpacity>
                            </View>

                            {statsData.stats.map((stat, idx) => (
                                <View key={stat.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Stat {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setStatsData({ ...statsData, stats: statsData.stats.filter(s => s.id !== stat.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <View style={styles.row}>
                                            <TextInput style={[styles.input, { flex: 1 }]} value={stat.value} placeholder="Value (e.g. 2M+)" onChangeText={t => {
                                                const newStats = [...statsData.stats]; newStats[idx].value = t;
                                                setStatsData({ ...statsData, stats: newStats }); setHasUnsavedChanges(true);
                                            }} />
                                            <TextInput style={[styles.input, { flex: 2 }]} value={stat.label} placeholder="Label (e.g. Deliveries Made)" onChangeText={t => {
                                                const newStats = [...statsData.stats]; newStats[idx].label = t;
                                                setStatsData({ ...statsData, stats: newStats }); setHasUnsavedChanges(true);
                                            }} />
                                        </View>
                                        <TextInput style={styles.input} value={stat.icon} placeholder="Lucide Icon Name (e.g. Package, Users)" onChangeText={t => {
                                            const newStats = [...statsData.stats]; newStats[idx].icon = t;
                                            setStatsData({ ...statsData, stats: newStats }); setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'industries' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Industry Specialist Config</Text>
                        <Text style={styles.sectionDesc}>Manage the specific B2B verticals.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Title</Text>
                                </View>
                                <TextInput style={styles.input} value={industriesData.title} onChangeText={t => { setIndustriesData({ ...industriesData, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Subtitle</Text>
                                </View>
                                <TextInput style={styles.input} value={industriesData.subtitle} onChangeText={t => { setIndustriesData({ ...industriesData, subtitle: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Industry Cards</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setIndustriesData({
                                        ...industriesData,
                                        industries: [...industriesData.industries, { id: Date.now().toString(), title: 'New Industry', desc: '', imageUrl: '' }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Industry</Text>
                                </TouchableOpacity>
                            </View>

                            {industriesData.industries.map((industry, idx) => (
                                <View key={industry.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <GripVertical size={16} color={Colors.textMuted} />
                                            <Text style={styles.slideNum}>Industry {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setIndustriesData({ ...industriesData, industries: industriesData.industries.filter(i => i.id !== industry.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <TextInput style={styles.input} value={industry.title} placeholder="Industry Title (e.g. Healthcare)" onChangeText={t => {
                                            const newInds = [...industriesData.industries]; newInds[idx].title = t;
                                            setIndustriesData({ ...industriesData, industries: newInds }); setHasUnsavedChanges(true);
                                        }} />
                                        <TextInput style={[styles.input, { height: 60 }]} multiline value={industry.desc} placeholder="Description" onChangeText={t => {
                                            const newInds = [...industriesData.industries]; newInds[idx].desc = t;
                                            setIndustriesData({ ...industriesData, industries: newInds }); setHasUnsavedChanges(true);
                                        }} />
                                        <TextInput style={styles.input} value={industry.imageUrl} placeholder="Image URL for industry" onChangeText={t => {
                                            const newInds = [...industriesData.industries]; newInds[idx].imageUrl = t;
                                            setIndustriesData({ ...industriesData, industries: newInds }); setHasUnsavedChanges(true);
                                        }} />
                                        {industry.imageUrl ? <Image source={{ uri: industry.imageUrl }} style={{ width: '100%', height: 100, borderRadius: 8, marginTop: 8 }} resizeMode="cover" /> : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'testimonials' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Testimonials Config</Text>
                        <Text style={styles.sectionDesc}>Manage client reviews and feedback.</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Type size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Title</Text>
                                </View>
                                <TextInput style={styles.input} value={testimonialsData.title} onChangeText={t => { setTestimonialsData({ ...testimonialsData, title: t }); setHasUnsavedChanges(true); }} />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <AlignLeft size={14} color={Colors.textSecondary} />
                                    <Text style={styles.inputLabel}>Section Subtitle</Text>
                                </View>
                                <TextInput style={styles.input} value={testimonialsData.subtitle} onChangeText={t => { setTestimonialsData({ ...testimonialsData, subtitle: t }); setHasUnsavedChanges(true); }} />
                            </View>

                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Reviews</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => {
                                    setTestimonialsData({
                                        ...testimonialsData,
                                        testimonials: [...testimonialsData.testimonials, { id: Date.now().toString(), author: 'New Person', role: 'Role', content: '', avatarUrl: '', rating: 5 }]
                                    });
                                    setHasUnsavedChanges(true);
                                }}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Review</Text>
                                </TouchableOpacity>
                            </View>

                            {testimonialsData.testimonials.map((test, idx) => (
                                <View key={test.id} style={[styles.slideCard, { marginTop: 12 }]}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideDragHandle}>
                                            <TouchableOpacity
                                                onPress={() => moveTestimonial(idx, 'up')}
                                                disabled={idx === 0}
                                                style={{ opacity: idx === 0 ? 0.3 : 1 }}
                                            >
                                                <Plus size={16} color={Colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => moveTestimonial(idx, 'down')}
                                                disabled={idx === testimonialsData.testimonials.length - 1}
                                                style={{ opacity: idx === testimonialsData.testimonials.length - 1 ? 0.3 : 1 }}
                                            >
                                                <Plus size={16} color={Colors.textMuted} />
                                            </TouchableOpacity>
                                            <Text style={styles.slideNum}>Review {idx + 1}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            setTestimonialsData({ ...testimonialsData, testimonials: testimonialsData.testimonials.filter(t => t.id !== test.id) });
                                            setHasUnsavedChanges(true);
                                        }} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 16, gap: 12 }}>
                                        <View style={styles.row}>
                                            <TextInput style={[styles.input, { flex: 1 }]} value={test.author} placeholder="Author Name" onChangeText={t => {
                                                const newTests = [...testimonialsData.testimonials]; newTests[idx].author = t;
                                                setTestimonialsData({ ...testimonialsData, testimonials: newTests }); setHasUnsavedChanges(true);
                                            }} />
                                            <TextInput style={[styles.input, { flex: 1 }]} value={test.role} placeholder="Role / Company" onChangeText={t => {
                                                const newTests = [...testimonialsData.testimonials]; newTests[idx].role = t;
                                                setTestimonialsData({ ...testimonialsData, testimonials: newTests }); setHasUnsavedChanges(true);
                                            }} />
                                        </View>
                                        <TextInput style={[styles.input, styles.textArea]} multiline value={test.content} placeholder="Review Text" onChangeText={t => {
                                            const newTests = [...testimonialsData.testimonials]; newTests[idx].content = t;
                                            setTestimonialsData({ ...testimonialsData, testimonials: newTests }); setHasUnsavedChanges(true);
                                        }} />
                                        <View style={styles.row}>
                                            <View style={{ flex: 2 }}>
                                                <TextInput style={[styles.input]} value={test.avatarUrl} placeholder="Avatar Image URL (Optional)" onChangeText={t => {
                                                    const newTests = [...testimonialsData.testimonials]; newTests[idx].avatarUrl = t;
                                                    setTestimonialsData({ ...testimonialsData, testimonials: newTests }); setHasUnsavedChanges(true);
                                                }} />
                                                {test.avatarUrl ? <Image source={{ uri: test.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginTop: 4 }} /> : null}
                                            </View>
                                            <TextInput style={[styles.input, { flex: 1 }]} value={test.rating.toString()} keyboardType="numeric" placeholder="Rating (1-5)" onChangeText={t => {
                                                const newTests = [...testimonialsData.testimonials]; newTests[idx].rating = parseInt(t) || 5;
                                                setTestimonialsData({ ...testimonialsData, testimonials: newTests }); setHasUnsavedChanges(true);
                                            }} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'custom' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Custom Content Blocks</Text>
                                <Text style={styles.sectionDesc}>Create flexible, completely new sections and actions for the homepage.</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} onPress={() => {
                                setCustomSections([...customSections, {
                                    id: Date.now().toString(),
                                    title: 'New Custom Block',
                                    subtitle: '',
                                    content: '',
                                    buttonText: 'Learn More',
                                    buttonLink: '/',
                                    imageUrl: '',
                                    alignment: 'left',
                                    backgroundColor: '#FFFFFF'
                                }]);
                                setHasUnsavedChanges(true);
                            }}>
                                <Plus size={16} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Block</Text>
                            </TouchableOpacity>
                        </View>

                        {customSections.length === 0 && (
                            <View style={[styles.emptyState, { marginTop: 20 }]}>
                                <Layout size={48} color={Colors.textMuted} />
                                <Text style={styles.emptyStateTitle}>No custom blocks yet</Text>
                                <Text style={styles.emptyStateDesc}>Click 'Add Block' to inject new content into the homepage.</Text>
                            </View>
                        )}

                        {customSections.map((section, idx) => (
                            <View key={section.id} style={styles.slideCard}>
                                <View style={styles.slideHeader}>
                                    <View style={styles.slideDragHandle}>
                                        <GripVertical size={16} color={Colors.textMuted} />
                                        <Text style={styles.slideNum}>Custom Block {idx + 1}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        setCustomSections(customSections.filter(s => s.id !== section.id));
                                        setHasUnsavedChanges(true);
                                    }} style={styles.trashBtn}>
                                        <Trash2 size={16} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ padding: 16, gap: 16 }}>
                                    <View style={styles.row}>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={section.title} placeholder="Big Header text" onChangeText={t => {
                                            const newSec = [...customSections]; newSec[idx].title = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                    <TextInput style={styles.input} value={section.subtitle} placeholder="Subheading text" onChangeText={t => {
                                        const newSec = [...customSections]; newSec[idx].subtitle = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                    }} />
                                    <TextInput style={[styles.input, styles.textArea]} multiline value={section.content} placeholder="Paragraph HTML or Text Content" onChangeText={t => {
                                        const newSec = [...customSections]; newSec[idx].content = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                    }} />
                                    <View style={styles.row}>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={section.buttonText} placeholder="Action Button Text" onChangeText={t => {
                                            const newSec = [...customSections]; newSec[idx].buttonText = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                        }} />
                                        <TextInput style={[styles.input, { flex: 1 }]} value={section.buttonLink} placeholder="Action Button URL" onChangeText={t => {
                                            const newSec = [...customSections]; newSec[idx].buttonLink = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                    <TextInput style={styles.input} value={section.imageUrl} placeholder="Optional Hero Image URL for this section" onChangeText={t => {
                                        const newSec = [...customSections]; newSec[idx].imageUrl = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                    }} />
                                    <View style={styles.row}>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={section.alignment} placeholder="Alignment: left, center, right" onChangeText={t => {
                                            const newSec = [...customSections]; newSec[idx].alignment = t as any; setCustomSections(newSec); setHasUnsavedChanges(true);
                                        }} />
                                        <TextInput style={[styles.input, { flex: 1 }]} value={section.backgroundColor} placeholder="Background Hex Color (e.g. #F8FAFC)" onChangeText={t => {
                                            const newSec = [...customSections]; newSec[idx].backgroundColor = t; setCustomSections(newSec); setHasUnsavedChanges(true);
                                        }} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.navy,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textInverse,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.adminPrimary,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
        marginLeft: 'auto',
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    previewButtonText: {
        color: Colors.textInverse,
        fontSize: 13,
        fontWeight: '600',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.adminPrimary,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    tabsContainer: {
        paddingBottom: 0,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 24,
    },
    tab: {
        paddingBottom: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.adminPrimary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabText: {
        color: Colors.adminPrimary,
    },
    content: {
        flex: 1,
    },
    contentPadding: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 13,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    imageInputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    imagePreviewSmall: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: Colors.borderLight,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        marginTop: 8,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    switchDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    slideCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
        overflow: 'hidden',
    },
    slideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    slideDragHandle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    slideNum: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    trashBtn: {
        padding: 4,
    },
    slideContentSplit: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    slideGraphic: {
        width: 120,
        height: 120,
        borderRadius: 8,
        backgroundColor: Colors.borderLight,
    },
    slideForm: {
        flex: 1,
        gap: 10,
    },
    inputSmall: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 4,
    },
    emptyStateDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    mockTag: {
        backgroundColor: Colors.primary + '15',
        color: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        fontSize: 12,
        fontWeight: '600',
        overflow: 'hidden'
    }
});
