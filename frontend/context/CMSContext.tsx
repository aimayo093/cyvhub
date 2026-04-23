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
    initialIndustriesPage,
    initialHomepageData,
    initialMenuConfig,
    initialCareersPage,
    initialJobOpenings,
    HeaderConfig,
    FooterConfig,
    AboutPageConfig,
    ContactPageConfig,
    ServicesPageConfig,
    IndustriesPageConfig,
    IndustryDetail,
    ServicePageDetail,
    MenuConfig,
    CareersPageConfig,
    JobOpening
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
    industriesPage: IndustriesPageConfig;
    industryDetails: Record<string, IndustryDetail>;
    serviceDetails: Record<string, ServicePageDetail>;
    homepageData: Record<string, any>;
    menuConfig: MenuConfig;
    careersPage: CareersPageConfig;
    jobOpenings: JobOpening[];

    // Setters (with optional backend sync)
    setHeader: (v: HeaderConfig, sync?: boolean) => Promise<void>;
    setFooter: (v: FooterConfig, sync?: boolean) => Promise<void>;
    setAboutPage: (v: AboutPageConfig, sync?: boolean) => Promise<void>;
    setContactPage: (v: ContactPageConfig, sync?: boolean) => Promise<void>;
    setServicesPage: (v: ServicesPageConfig, sync?: boolean) => Promise<void>;
    setIndustriesPage: (v: IndustriesPageConfig, sync?: boolean) => Promise<void>;
    setIndustryDetails: (v: Record<string, IndustryDetail>, sync?: boolean) => Promise<void>;
    setServiceDetails: (v: Record<string, ServicePageDetail>, sync?: boolean) => Promise<void>;
    setHomepageSection: (key: string, value: any, sync?: boolean) => Promise<void>;
    setHomepageSections: (updates: Record<string, any>, sync?: boolean) => Promise<void>;
    
    setMenuConfig: (v: MenuConfig, sync?: boolean) => Promise<void>;
    setCareersPage: (v: CareersPageConfig, sync?: boolean) => Promise<void>;
    setJobOpenings: (v: JobOpening[], sync?: boolean) => Promise<void>;

    batchUpdateAndSync: (updates: Partial<{
        header: HeaderConfig;
        footer: FooterConfig;
        aboutPage: AboutPageConfig;
        contactPage: ContactPageConfig;
        servicesPage: ServicesPageConfig;
        industryDetails: Record<string, IndustryDetail>;
        serviceDetails: Record<string, ServicePageDetail>;
        homepageData: Record<string, any>;
        menuConfig: MenuConfig;
        careersPage: CareersPageConfig;
        jobOpenings: JobOpening[];
    }>, sync?: boolean) => Promise<void>;

    isLoaded: boolean;
    refreshFromBackend: (force?: boolean) => Promise<void>;
    hardPublish: () => Promise<{ success: boolean; commitSha: string }>;
}

const CMSContext = createContext<CMSContextValue | null>(null);

const CMS_CONFIG_KEY = 'global_cms_bundle';

export function CMSProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeaderState] = useState<HeaderConfig>(initialHeader);
    const [footer, setFooterState] = useState<FooterConfig>(initialFooter);
    const [aboutPage, setAboutPageState] = useState<AboutPageConfig>(initialAboutPage);
    const [contactPage, setContactPageState] = useState<ContactPageConfig>(initialContactPage);
    const [servicesPage, setServicesPageState] = useState<ServicesPageConfig>(initialServicesPage);
    const [industriesPage, setIndustriesPageState] = useState<IndustriesPageConfig>(initialIndustriesPage);
    const [industryDetails, setIndustryDetailsState] = useState<Record<string, IndustryDetail>>(initialIndustryDetails);
    const [serviceDetails, setServiceDetailsState] = useState<Record<string, ServicePageDetail>>(initialServiceDetails);
    const [homepageData, setHomepageData] = useState<Record<string, any>>(initialHomepageData);
    const [menuConfig, setMenuConfigState] = useState<MenuConfig>(initialMenuConfig);
    const [careersPage, setCareersPageState] = useState<CareersPageConfig>(initialCareersPage);
    const [jobOpenings, setJobOpeningsState] = useState<JobOpening[]>(initialJobOpenings);
    const [isLoaded, setIsLoaded] = useState(false);

    const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item);

    const mergeMenuItems = (local: any[], remote: any[]) => {
        if (!Array.isArray(remote)) return local;
        const merged = [...local];
        remote.forEach(remoteItem => {
            const index = merged.findIndex(m => m.id === remoteItem.id);
            if (index !== -1) {
                merged[index] = { ...merged[index], ...remoteItem };
            } else {
                merged.push(remoteItem);
            }
        });
        return merged;
    };

    const applyData = useCallback((incomingData: any) => {
        if (!incomingData) return;
        
        // Handle bundle structure: if incomingData.config exists, it's a global bundle.
        let data = { ...incomingData };
        if (incomingData.config && typeof incomingData.config === 'object') {
            Object.entries(incomingData.config).forEach(([key, value]) => {
                data[key] = value;
                // Also provide a clean key for top-level states
                const cleanKey = key.replace(/^cms_/, '');
                data[cleanKey] = value;
            });
        }

        // Defensive guards: only update if the new data contains valid content
        if (isObject(data.header)) {
            setHeaderState(prev => {
                const updated = { ...prev, ...data.header };
                if (data.header.menuItems) {
                    updated.menuItems = mergeMenuItems(prev.menuItems, data.header.menuItems);
                }
                return updated;
            });
        }
        if (isObject(data.footer)) setFooterState(prev => ({ ...prev, ...data.footer }));
        if (isObject(data.aboutPage)) setAboutPageState(prev => ({ ...prev, ...data.aboutPage }));
        if (isObject(data.contactPage)) setContactPageState(prev => ({ ...prev, ...data.contactPage }));
        if (isObject(data.servicesPage)) setServicesPageState(prev => ({ ...prev, ...data.servicesPage }));
        if (isObject(data.industriesPage)) setIndustriesPageState(prev => ({ ...prev, ...data.industriesPage }));
        if (isObject(data.menuConfig)) setMenuConfigState(prev => ({ ...prev, ...data.menuConfig }));
        if (isObject(data.careersPage)) setCareersPageState(prev => ({ ...prev, ...data.careersPage }));
        if (Array.isArray(data.jobOpenings)) setJobOpeningsState(data.jobOpenings);
        
        if (isObject(data.industryDetails)) setIndustryDetailsState(prev => {
            const merged = { ...prev };
            Object.entries(data.industryDetails).forEach(([k, v]) => {
                if (isObject(v)) merged[k] = { ...merged[k], ...(v as any) };
            });
            return merged;
        });
        
        if (isObject(data.serviceDetails)) setServiceDetailsState(prev => {
            const merged = { ...prev };
            Object.entries(data.serviceDetails).forEach(([k, v]) => {
                if (isObject(v)) merged[k] = { ...merged[k], ...(v as any) };
            });
            return merged;
        });
        
        // Update homepageData from any cms_*Config keys found in the bundle
        setHomepageData(prev => {
            const next = { ...prev };
            Object.keys(prev).forEach(key => {
                if (isObject(data[key])) {
                    next[key] = { ...next[key], ...data[key] };
                }
            });
            return next;
        });
    }, []);

    const refreshFromBackend = useCallback(async (force = false) => {
        try {
            const now = Date.now();
            const lastFetchedStr = await AsyncStorage.getItem(`cms_last_fetch_${CMS_CONFIG_KEY}`);
            const lastFetched = lastFetchedStr ? parseInt(lastFetchedStr, 10) : 0;

            if (!force && (now - lastFetched < 5 * 60 * 1000)) {
                // return; // Temporarily disabled to prevent stale cache overwriting the DB
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
                        footer: data.footer,
                        aboutPage: data.aboutPage,
                        contactPage: data.contactPage,
                        servicesPage: data.servicesPage,
                        industriesPage: data.industriesPage,
                        menuConfig: data.menuConfig,
                        careersPage: data.careersPage,
                        jobOpenings: data.jobOpenings
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
        header, footer, aboutPage, contactPage, servicesPage, industriesPage, industryDetails, serviceDetails, homepageData,
        menuConfig, careersPage, jobOpenings
    }), [header, footer, aboutPage, contactPage, servicesPage, industriesPage, industryDetails, serviceDetails, homepageData, menuConfig, careersPage, jobOpenings]);

    const batchUpdateAndSync = async (updates: Partial<{
        header: HeaderConfig;
        footer: FooterConfig;
        aboutPage: AboutPageConfig;
        contactPage: ContactPageConfig;
        servicesPage: ServicesPageConfig;
        industryDetails: Record<string, IndustryDetail>;
        serviceDetails: Record<string, ServicePageDetail>;
        homepageData: Record<string, any>;
        industriesPage: IndustriesPageConfig;
        menuConfig: MenuConfig;
        careersPage: CareersPageConfig;
        jobOpenings: JobOpening[];
    }>, sync = true) => {
        const payload = { ...getFullState(), ...updates };
        
        // Optimistically update React State
        if (updates.header) setHeaderState(updates.header);
        if (updates.footer) setFooterState(updates.footer);
        if (updates.aboutPage) setAboutPageState(updates.aboutPage);
        if (updates.contactPage) setContactPageState(updates.contactPage);
        if (updates.servicesPage) setServicesPageState(updates.servicesPage);
        if (updates.industriesPage) setIndustriesPageState(updates.industriesPage);
        if (updates.industryDetails) setIndustryDetailsState(updates.industryDetails);
        if (updates.serviceDetails) setServiceDetailsState(updates.serviceDetails);
        if (updates.homepageData) setHomepageData(updates.homepageData);
        if (updates.menuConfig) setMenuConfigState(updates.menuConfig);
        if (updates.careersPage) setCareersPageState(updates.careersPage);
        if (updates.jobOpenings) setJobOpeningsState(updates.jobOpenings);

        if (sync) {
            await syncToBackend(payload);
        }
    };

    const setHeader = async (v: HeaderConfig, sync = false) => batchUpdateAndSync({ header: v }, sync);
    const setFooter = async (v: FooterConfig, sync = false) => batchUpdateAndSync({ footer: v }, sync);
    const setAboutPage = async (v: AboutPageConfig, sync = false) => batchUpdateAndSync({ aboutPage: v }, sync);
    const setContactPage = async (v: ContactPageConfig, sync = false) => batchUpdateAndSync({ contactPage: v }, sync);
    const setServicesPage = async (v: ServicesPageConfig, sync = false) => batchUpdateAndSync({ servicesPage: v }, sync);
    const setIndustriesPage = async (v: IndustriesPageConfig, sync = false) => batchUpdateAndSync({ industriesPage: v }, sync);
    const setIndustryDetails = async (v: Record<string, IndustryDetail>, sync = false) => batchUpdateAndSync({ industryDetails: v }, sync);
    const setServiceDetails = async (v: Record<string, ServicePageDetail>, sync = false) => batchUpdateAndSync({ serviceDetails: v }, sync);
    
    const setMenuConfig = async (v: MenuConfig, sync = false) => batchUpdateAndSync({ menuConfig: v }, sync);
    const setCareersPage = async (v: CareersPageConfig, sync = false) => batchUpdateAndSync({ careersPage: v }, sync);
    const setJobOpenings = async (v: JobOpening[], sync = false) => batchUpdateAndSync({ jobOpenings: v }, sync);

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
            industriesPage, setIndustriesPage,
            serviceDetails, setServiceDetails,
            homepageData,
            menuConfig, setMenuConfig,
            careersPage, setCareersPage,
            jobOpenings, setJobOpenings,
            setHeader, setFooter, setAboutPage, setContactPage, setServicesPage,
            setHomepageSection, setHomepageSections,
            batchUpdateAndSync,
            isLoaded,
            refreshFromBackend,
            hardPublish: async () => {
                try {
                    const response = await apiClient('/cms/publish', { method: 'POST' });
                    if (response?.success) return response;
                    throw new Error(response?.error || 'Hard publish failed.');
                } catch (e) {
                    console.error('[CMSContext] hardPublish failed:', e);
                    throw e;
                }
            }
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

