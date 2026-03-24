/**
 * CMSContext.tsx
 *
 * A global React Context that holds all CMS configuration in memory.
 * - On app start, it loads data from AsyncStorage into memory.
 * - When the CMS saves data, it updates both AsyncStorage AND this context.
 * - Public pages subscribe to this context so they react instantly to any
 *   changes without needing a page refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    initialHeader,
    initialFooter,
    initialAboutPage,
    initialContactPage,
    initialServicesPage,
    initialIndustryDetails,
    HeaderConfig,
    FooterConfig,
    AboutPageConfig,
    ContactPageConfig,
    ServicesPageConfig,
    IndustryDetail,
} from '@/constants/cmsDefaults';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CMSContextValue {
    // Data
    header: HeaderConfig;
    footer: FooterConfig;
    aboutPage: AboutPageConfig;
    contactPage: ContactPageConfig;
    servicesPage: ServicesPageConfig;
    industryDetails: Record<string, IndustryDetail>;

    // Raw homepage sections (stored individually)
    homepageData: Record<string, any>;

    // Setters (called by CMS editors after saving)
    setHeader: (v: HeaderConfig) => void;
    setFooter: (v: FooterConfig) => void;
    setAboutPage: (v: AboutPageConfig) => void;
    setContactPage: (v: ContactPageConfig) => void;
    setServicesPage: (v: ServicesPageConfig) => void;
    setIndustryDetails: (v: Record<string, IndustryDetail>) => void;
    setHomepageSection: (key: string, value: any) => void;

    isLoaded: boolean;
}

const CMSContext = createContext<CMSContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function CMSProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeaderState] = useState<HeaderConfig>(initialHeader);
    const [footer, setFooterState] = useState<FooterConfig>(initialFooter);
    const [aboutPage, setAboutPageState] = useState<AboutPageConfig>(initialAboutPage);
    const [contactPage, setContactPageState] = useState<ContactPageConfig>(initialContactPage);
    const [servicesPage, setServicesPageState] = useState<ServicesPageConfig>(initialServicesPage);
    const [industryDetails, setIndustryDetailsState] = useState<Record<string, IndustryDetail>>(initialIndustryDetails);
    const [homepageData, setHomepageData] = useState<Record<string, any>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Load all data from AsyncStorage on initial mount
    useEffect(() => {
        const loadAll = async () => {
            try {
                const keys = [
                    'cms_headerConfig',
                    'cms_footerConfig',
                    'cms_aboutPageConfig',
                    'cms_contactPageConfig',
                    'cms_servicesPageConfig',
                    'cms_industryDetails',
                    'cms_heroConfig',
                    'cms_howItWorksConfig',
                    'cms_whyUsConfig',
                    'cms_servicesConfig',
                    'cms_ctaConfig',
                    'cms_statsConfig',
                    'cms_industriesConfig',
                    'cms_testimonialsConfig',
                    'cms_slidesConfig',
                    'cms_customSections',
                ];

                const results = await AsyncStorage.multiGet(keys);
                const data: Record<string, any> = {};
                results.forEach(([key, value]) => {
                    if (value) data[key] = JSON.parse(value);
                });

                if (data['cms_headerConfig']) setHeaderState(data['cms_headerConfig']);
                if (data['cms_footerConfig']) setFooterState(data['cms_footerConfig']);
                if (data['cms_aboutPageConfig']) {
                    const parsed = data['cms_aboutPageConfig'];
                    setAboutPageState({
                        ...initialAboutPage,
                        ...parsed,
                        values: parsed.values || initialAboutPage.values,
                        stats: parsed.stats || initialAboutPage.stats,
                        milestones: parsed.milestones || initialAboutPage.milestones,
                        sustainabilityItems: parsed.sustainabilityItems || initialAboutPage.sustainabilityItems,
                    });
                }
                if (data['cms_contactPageConfig']) {
                    const parsed = data['cms_contactPageConfig'];
                    setContactPageState({
                        ...initialContactPage,
                        ...parsed,
                        contactMethods: parsed.contactMethods || initialContactPage.contactMethods,
                        faqs: parsed.faqs || initialContactPage.faqs,
                        departments: parsed.departments || initialContactPage.departments,
                        hubs: parsed.hubs || initialContactPage.hubs,
                    });
                }
                if (data['cms_servicesPageConfig']) {
                    const parsed = data['cms_servicesPageConfig'];
                    setServicesPageState({
                        ...initialServicesPage,
                        ...parsed,
                        mainServices: parsed.mainServices || initialServicesPage.mainServices,
                        deliveryItems: parsed.deliveryItems || initialServicesPage.deliveryItems,
                    });
                }
                if (data['cms_industryDetails']) {
                    setIndustryDetailsState({ ...initialIndustryDetails, ...data['cms_industryDetails'] });
                }

                // Merge all homepage section keys into homepageData
                const homepageKeys = [
                    'cms_headerConfig', 'cms_footerConfig',
                    'cms_heroConfig', 'cms_howItWorksConfig', 'cms_whyUsConfig',
                    'cms_servicesConfig', 'cms_ctaConfig', 'cms_statsConfig',
                    'cms_industriesConfig', 'cms_testimonialsConfig', 'cms_slidesConfig',
                    'cms_customSections',
                ];
                const hpData: Record<string, any> = {};
                homepageKeys.forEach(k => { if (data[k]) hpData[k] = data[k]; });
                setHomepageData(hpData);

                // Auto-refresh the footer to force the new Cyvrix Limited copyright onto existing devices
                setFooterState(prev => ({
                    ...prev,
                    copyright: initialFooter.copyright
                }));

            } catch (e) {
                console.error('CMSContext: Failed to load data:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadAll();
    }, []);

    // Setters that update in-memory state (AsyncStorage is written by the CMS editors themselves)
    const setHeader = useCallback((v: HeaderConfig) => setHeaderState(v), []);
    const setFooter = useCallback((v: FooterConfig) => setFooterState(v), []);
    const setAboutPage = useCallback((v: AboutPageConfig) => setAboutPageState(v), []);
    const setContactPage = useCallback((v: ContactPageConfig) => setContactPageState(v), []);
    const setServicesPage = useCallback((v: ServicesPageConfig) => setServicesPageState(v), []);
    const setIndustryDetails = useCallback((v: Record<string, IndustryDetail>) => setIndustryDetailsState(v), []);
    const setHomepageSection = useCallback((key: string, value: any) => {
        setHomepageData(prev => ({ ...prev, [key]: value }));
    }, []);

    return (
        <CMSContext.Provider value={{
            header, footer, aboutPage, contactPage, servicesPage,
            industryDetails, homepageData,
            setHeader, setFooter, setAboutPage, setContactPage, setServicesPage,
            setIndustryDetails, setHomepageSection,
            isLoaded,
        }}>
            {children}
        </CMSContext.Provider>
    );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useCMS() {
    const ctx = useContext(CMSContext);
    if (!ctx) throw new Error('useCMS must be used inside CMSProvider');
    return ctx;
}
