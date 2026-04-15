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
import { supabase } from '@/utils/supabase';
import {
    initialHeader,
    initialFooter,
    initialAboutPage,
    initialContactPage,
    initialServicesPage,
    initialIndustryDetails,
    initialServiceDetails,
    HeaderConfig,
    FooterConfig,
    AboutPageConfig,
    ContactPageConfig,
    ServicesPageConfig,
    IndustryDetail,
    ServicePageDetail,
    initialHomepageData,
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
    serviceDetails: Record<string, ServicePageDetail>;
    homepageData: Record<string, any>;

    // Setters (with optional backend sync)
    setHeader: (v: HeaderConfig, sync?: boolean) => Promise<void>;
    setFooter: (v: FooterConfig, sync?: boolean) => Promise<void>;
    setAboutPage: (v: AboutPageConfig, sync?: boolean) => Promise<void>;
    setContactPage: (v: ContactPageConfig, sync?: boolean) => Promise<void>;
    setServicesPage: (v: ServicesPageConfig, sync?: boolean) => Promise<void>;
    setIndustryDetails: (v: Record<string, IndustryDetail>, sync?: boolean) => Promise<void>;
    setServiceDetails: (v: Record<string, ServicePageDetail>, sync?: boolean) => Promise<void>;
    setHomepageSection: (key: string, value: any, sync?: boolean) => Promise<void>;
    setHomepageSections: (updates: Record<string, any>, sync?: boolean) => Promise<void>;
    
    batchUpdateAndSync: (updates: Partial<{
        header: HeaderConfig;
        footer: FooterConfig;
        aboutPage: AboutPageConfig;
        contactPage: ContactPageConfig;
        servicesPage: ServicesPageConfig;
        industryDetails: Record<string, IndustryDetail>;
        serviceDetails: Record<string, ServicePageDetail>;
        homepageData: Record<string, any>;
    }>, sync?: boolean) => Promise<void>;

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
    const [serviceDetails, setServiceDetailsState] = useState<Record<string, ServicePageDetail>>(initialServiceDetails);
    const [homepageData, setHomepageData] = useState<Record<string, any>>(initialHomepageData);
    const [isLoaded, setIsLoaded] = useState(false);

    const applyData = useCallback((data: any) => {
        if (!data) return;
        if (data.header) setHeaderState(data.header);
        if (data.footer) setFooterState(data.footer);
        if (data.aboutPage) setAboutPageState(data.aboutPage);
        if (data.contactPage) setContactPageState(data.contactPage);
        if (data.servicesPage) setServicesPageState(data.servicesPage);
        if (data.industryDetails) setIndustryDetailsState(data.industryDetails);
        if (data.serviceDetails) setServiceDetailsState(data.serviceDetails);
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

    const syncToBackend = useCallback(async (data: any) => {
        try {
            // Use the new granular sync endpoint
            await apiClient('/cms/sync', {
                method: 'POST',
                body: JSON.stringify({
                    data: {
                        homepage: data.homepageData,
                        serviceDetails: data.serviceDetails,
                        industryDetails: data.industryDetails,
                        header: data.header,
                        footer: data.footer
                    }
                })
            });
            
            // Also keep the legacy bulk sync for backward compatibility if needed, 
            // but we're shifting to granular. Let's just update local cache.
            await AsyncStorage.setItem(`cms_${CMS_CONFIG_KEY}`, JSON.stringify(data));
            await AsyncStorage.removeItem(`cms_last_fetch_${CMS_CONFIG_KEY}`);
            console.log('[CMSContext] CMS Data synchronized via /cms/sync');
        } catch (e) {
            console.error('[CMSContext] Failed to sync to backend:', e);
            throw e;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            console.log('[CMSContext] Initialization started...');
            const timeout = setTimeout(() => {
                if (!isLoaded) {
                    console.warn('[CMSContext] Initialization took too long, firing safety fallback...');
                    setIsLoaded(true);
                }
            }, 3000);

            try {
                // 1. Load from Local Cache (Fast)
                const cached = await AsyncStorage.getItem(`cms_${CMS_CONFIG_KEY}`);
                if (cached) {
                    console.log('[CMSContext] Found cached data');
                    applyData(JSON.parse(cached));
                }

                // 2. Refresh from Backend (Global Sync)
                console.log('[CMSContext] Refreshing from backend...');
                await refreshFromBackend();
                console.log('[CMSContext] Backend refresh complete');
            } catch (error) {
                console.error('[CMSContext] Initialization error:', error);
            } finally {
                clearTimeout(timeout);
                setIsLoaded(true);
                console.log('[CMSContext] Initialization finished (isLoaded=true)');
            }
        };

        const setupRealtime = () => {
            if (!supabase) {
                console.warn('[CMSContext] Supabase client is not available. Realtime updates disabled.');
                return () => {};
            }
            const channel = supabase
                .channel('global_config_changes')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'GlobalConfig', filter: `key=eq.${CMS_CONFIG_KEY}` },
                    (payload) => {
                        console.log('[CMSContext] Realtime Update Received, refreshing backend data...', payload);
                        // True = forces fetching without caring about the 5 minute throttle
                        refreshFromBackend(true);
                    }
                )
                .subscribe();

            return () => {
                if (supabase) {
                    supabase.removeChannel(channel);
                }
            };
        };

        init();
        const cleanupSupabase = setupRealtime();

        return () => {
            cleanupSupabase();
        };
    }, [refreshFromBackend, applyData]);

    const getFullState = useCallback(() => ({
        header, footer, aboutPage, contactPage, servicesPage, industryDetails, serviceDetails, homepageData
    }), [header, footer, aboutPage, contactPage, servicesPage, industryDetails, serviceDetails, homepageData]);

    const batchUpdateAndSync = async (updates: Partial<{
        header: HeaderConfig;
        footer: FooterConfig;
        aboutPage: AboutPageConfig;
        contactPage: ContactPageConfig;
        servicesPage: ServicesPageConfig;
        industryDetails: Record<string, IndustryDetail>;
        serviceDetails: Record<string, ServicePageDetail>;
        homepageData: Record<string, any>;
    }>, sync = true) => {
        const payload = { ...getFullState(), ...updates };
        
        // Optimistically update React State
        if (updates.header) setHeaderState(updates.header);
        if (updates.footer) setFooterState(updates.footer);
        if (updates.aboutPage) setAboutPageState(updates.aboutPage);
        if (updates.contactPage) setContactPageState(updates.contactPage);
        if (updates.servicesPage) setServicesPageState(updates.servicesPage);
        if (updates.industryDetails) setIndustryDetailsState(updates.industryDetails);
        if (updates.serviceDetails) setServiceDetailsState(updates.serviceDetails);
        if (updates.homepageData) setHomepageData(updates.homepageData);

        if (sync) {
            await syncToBackend(payload);
        }
    };

    const setHeader = async (v: HeaderConfig, sync = false) => batchUpdateAndSync({ header: v }, sync);
    const setFooter = async (v: FooterConfig, sync = false) => batchUpdateAndSync({ footer: v }, sync);
    const setAboutPage = async (v: AboutPageConfig, sync = false) => batchUpdateAndSync({ aboutPage: v }, sync);
    const setContactPage = async (v: ContactPageConfig, sync = false) => batchUpdateAndSync({ contactPage: v }, sync);
    const setServicesPage = async (v: ServicesPageConfig, sync = false) => batchUpdateAndSync({ servicesPage: v }, sync);
    const setIndustryDetails = async (v: Record<string, IndustryDetail>, sync = false) => batchUpdateAndSync({ industryDetails: v }, sync);
    const setServiceDetails = async (v: Record<string, ServicePageDetail>, sync = false) => batchUpdateAndSync({ serviceDetails: v }, sync);

    const setHomepageSection = async (key: string, value: any, sync = false) => {
        const newHpData = { ...homepageData, [key]: value };
        await batchUpdateAndSync({ homepageData: newHpData }, sync);
    };

    /**
     * Batch-update multiple homepage sections and sync once to the backend.
     */
    const setHomepageSections = async (updates: Record<string, any>, sync = false) => {
        const newHpData = { ...homepageData, ...updates };
        await batchUpdateAndSync({ homepageData: newHpData }, sync);
    };

    return (
        <CMSContext.Provider value={{
            header, footer, aboutPage, contactPage, servicesPage,
            industryDetails, setIndustryDetails,
            serviceDetails, setServiceDetails,
            homepageData,
            setHeader, setFooter, setAboutPage, setContactPage, setServicesPage,
            setHomepageSection, setHomepageSections,
            batchUpdateAndSync,
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

