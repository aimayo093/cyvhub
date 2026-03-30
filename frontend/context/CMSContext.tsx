/**
 * CMSContext.tsx
 *
 * A global React Context that holds all CMS configuration in memory.
 * - On app start, it loads data from AsyncStorage into memory.
 * - NEW: It also fetches the latest configuration from the backend to ensure global synchronization.
 * - When the CMS saves data, it updates AsyncStorage, the local state, AND the backend.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api';
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
    header: HeaderConfig;
    footer: FooterConfig;
    aboutPage: AboutPageConfig;
    contactPage: ContactPageConfig;
    servicesPage: ServicesPageConfig;
    industryDetails: Record<string, IndustryDetail>;
    homepageData: Record<string, any>;

    // Setters (with optional backend sync)
    setHeader: (v: HeaderConfig, sync?: boolean) => Promise<void>;
    setFooter: (v: FooterConfig, sync?: boolean) => Promise<void>;
    setAboutPage: (v: AboutPageConfig, sync?: boolean) => Promise<void>;
    setContactPage: (v: ContactPageConfig, sync?: boolean) => Promise<void>;
    setServicesPage: (v: ServicesPageConfig, sync?: boolean) => Promise<void>;
    setIndustryDetails: (v: Record<string, IndustryDetail>, sync?: boolean) => Promise<void>;
    setHomepageSection: (key: string, value: any, sync?: boolean) => Promise<void>;
    setHomepageSections: (updates: Record<string, any>, sync?: boolean) => Promise<void>;

    isLoaded: boolean;
    refreshFromBackend: (force?: boolean) => Promise<void>;
}

const CMSContext = createContext<CMSContextValue | null>(null);

const CMS_CONFIG_KEY = 'global_cms_bundle';

export function CMSProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeaderState] = useState<HeaderConfig>(initialHeader);
    const [footer, setFooterState] = useState<FooterConfig>(initialFooter);
    const [aboutPage, setAboutPageState] = useState<AboutPageConfig>(initialAboutPage);
    const [contactPage, setContactPageState] = useState<ContactPageConfig>(initialContactPage);
    const [servicesPage, setServicesPageState] = useState<ServicesPageConfig>(initialServicesPage);
    const [industryDetails, setIndustryDetailsState] = useState<Record<string, IndustryDetail>>(initialIndustryDetails);
    const [homepageData, setHomepageData] = useState<Record<string, any>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    const applyData = useCallback((data: any) => {
        if (!data) return;
        if (data.header) setHeaderState(data.header);
        if (data.footer) setFooterState(data.footer);
        if (data.aboutPage) setAboutPageState(data.aboutPage);
        if (data.contactPage) setContactPageState(data.contactPage);
        if (data.servicesPage) setServicesPageState(data.servicesPage);
        if (data.industryDetails) setIndustryDetailsState(data.industryDetails);
        if (data.homepageData) setHomepageData(data.homepageData);
    }, []);

    const refreshFromBackend = useCallback(async (force = false) => {
        try {
            const now = Date.now();
            const lastFetchedStr = await AsyncStorage.getItem(`cms_last_fetch_${CMS_CONFIG_KEY}`);
            const lastFetched = lastFetchedStr ? parseInt(lastFetchedStr, 10) : 0;

            if (!force && (now - lastFetched < 5 * 60 * 1000)) {
                return;
            }

            const response = await apiClient(`/cms/config/${CMS_CONFIG_KEY}`);
            if (response && response.config) {
                applyData(response.config);
                await AsyncStorage.setItem(`cms_${CMS_CONFIG_KEY}`, JSON.stringify(response.config));
                await AsyncStorage.setItem(`cms_last_fetch_${CMS_CONFIG_KEY}`, now.toString());
            }
        } catch (e) {
            console.warn('[CMSContext] Backend refresh failed:', e);
        }
    }, [applyData]);

    const syncToBackend = useCallback(async (fullData: any) => {
        try {
            await apiClient('/cms/config', {
                method: 'POST',
                body: JSON.stringify({
                    key: CMS_CONFIG_KEY,
                    config: fullData
                })
            });
            // Update local cache
            await AsyncStorage.setItem(`cms_${CMS_CONFIG_KEY}`, JSON.stringify(fullData));
            // Invalidate the 5-minute throttle so next load re-fetches fresh data
            await AsyncStorage.removeItem(`cms_last_fetch_${CMS_CONFIG_KEY}`);
            console.log('[CMSContext] Config synced to backend and cache invalidated.');
        } catch (e) {
            console.error('[CMSContext] Failed to sync to backend:', e);
            throw e; // Re-throw so callers can catch and show user-facing errors
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Load from Local Cache (Fast)
                const cached = await AsyncStorage.getItem(`cms_${CMS_CONFIG_KEY}`);
                if (cached) {
                    applyData(JSON.parse(cached));
                }

                // 2. Refresh from Backend (Global Sync)
                await refreshFromBackend();
            } catch (e) {
                console.error('CMSContext: Init failed:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        init();
    }, [refreshFromBackend, applyData]);

    const getFullState = useCallback(() => ({
        header, footer, aboutPage, contactPage, servicesPage, industryDetails, homepageData
    }), [header, footer, aboutPage, contactPage, servicesPage, industryDetails, homepageData]);

    const setHeader = async (v: HeaderConfig, sync = false) => {
        setHeaderState(v);
        if (sync) await syncToBackend({ ...getFullState(), header: v });
    };

    const setFooter = async (v: FooterConfig, sync = false) => {
        setFooterState(v);
        if (sync) await syncToBackend({ ...getFullState(), footer: v });
    };

    const setAboutPage = async (v: AboutPageConfig, sync = false) => {
        setAboutPageState(v);
        if (sync) await syncToBackend({ ...getFullState(), aboutPage: v });
    };

    const setContactPage = async (v: ContactPageConfig, sync = false) => {
        setContactPageState(v);
        if (sync) await syncToBackend({ ...getFullState(), contactPage: v });
    };

    const setServicesPage = async (v: ServicesPageConfig, sync = false) => {
        setServicesPageState(v);
        if (sync) await syncToBackend({ ...getFullState(), servicesPage: v });
    };

    const setIndustryDetails = async (v: Record<string, IndustryDetail>, sync = false) => {
        setIndustryDetailsState(v);
        if (sync) await syncToBackend({ ...getFullState(), industryDetails: v });
    };

    const setHomepageSection = async (key: string, value: any, sync = false) => {
        const newHpData = { ...homepageData, [key]: value };
        setHomepageData(newHpData);
        if (sync) await syncToBackend({ ...getFullState(), homepageData: newHpData });
    };

    /**
     * Batch-update multiple homepage sections and sync once to the backend.
     * Use this instead of calling setHomepageSection N times to avoid
     * each call overwriting the previous in a write race.
     */
    const setHomepageSections = async (updates: Record<string, any>, sync = false) => {
        const newHpData = { ...homepageData, ...updates };
        setHomepageData(newHpData);
        if (sync) await syncToBackend({ ...getFullState(), homepageData: newHpData });
    };

    return (
        <CMSContext.Provider value={{
            header, footer, aboutPage, contactPage, servicesPage,
            industryDetails, homepageData,
            setHeader, setFooter, setAboutPage, setContactPage, setServicesPage,
            setIndustryDetails, setHomepageSection, setHomepageSections,
            isLoaded,
            refreshFromBackend
        }}>
            {children}
        </CMSContext.Provider>
    );
}

export function useCMS() {
    const ctx = useContext(CMSContext);
    if (!ctx) throw new Error('useCMS must be used inside CMSProvider');
    return ctx;
}

