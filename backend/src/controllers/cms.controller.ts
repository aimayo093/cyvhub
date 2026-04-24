import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * PAGE CONTENT (Individual Pages)
 */

export const getPages = async (req: Request, res: Response) => {
    try {
        const pages = await prisma.pageContent.findMany({
            select: { slug: true, title: true, updatedAt: true, published: true }
        });
        res.json(pages);
    } catch (error) {
        console.error('Get Pages Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPageBySlug = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const page = await prisma.pageContent.findUnique({
            where: { slug }
        });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        console.error('Get Page Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const upsertPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { slug, title, metaDescription, bodyContent, published } = req.body;

        if (!slug || !title || !bodyContent) {
            return res.status(400).json({ error: 'Missing required fields: slug, title, bodyContent' });
        }

        // 1. Fetch current to save as a revision
        const existing = await prisma.pageContent.findUnique({ where: { slug } });
        if (existing) {
            await prisma.cMSRevision.create({
                data: {
                    entityType: 'PAGE_CONTENT',
                    entityKey: slug,
                    snapshot: {
                        title: existing.title,
                        metaDescription: existing.metaDescription,
                        bodyContent: existing.bodyContent,
                        published: existing.published
                    },
                    updatedBy: req.user.userId
                }
            });
        }

        const page = await prisma.pageContent.upsert({
            where: { slug },
            create: {
                slug,
                title,
                metaDescription,
                bodyContent,
                published: published !== undefined ? published : true,
                updatedBy: req.user.userId
            },
            update: {
                title,
                metaDescription,
                bodyContent,
                published: published !== undefined ? published : true,
                updatedBy: req.user.userId,
                updatedAt: new Date()
            }
        });

        res.json({ message: 'Page saved successfully', page });
    } catch (error) {
        console.error('Upsert Page Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GLOBAL CONFIG (Homepage, Header, etc.)
 */

export const getConfig = async (req: Request, res: Response) => {
    try {
        const key = req.params.key as string;
        console.log(`[CMSController] Fetching config for key: ${key}`);
        const config = await prisma.globalConfig.findUnique({
            where: { key }
        });

        // SPECIAL CASE: If requesting the master bundle, we can fallback or augment with granular data
        if (key === 'global_cms_bundle') {
            const homepagePage = await prisma.cMSPage.findUnique({
                where: { slug: 'homepage' },
                include: { sections: true }
            });

            if (homepagePage && config) {
                const currentConfig = (config.config as any) || {};
                const aggregatedHomepage: any = {};
                
                // Map sections back to the cms_XXXConfig keys
                const typeToKeyMap: Record<string, string> = {
                    'hero': 'cms_heroConfig',
                    'slider': 'cms_slidesConfig',
                    'howItWorks': 'cms_howItWorksConfig',
                    'whyUs': 'cms_whyUsConfig',
                    'services': 'cms_servicesConfig',
                    'stats': 'cms_statsConfig',
                    'industries': 'cms_industriesConfig',
                    'testimonials': 'cms_testimonialsConfig',
                    'cta': 'cms_ctaConfig',
                    'custom': 'cms_customSections'
                };

                homepagePage.sections.forEach(sec => {
                    const bundleKey = typeToKeyMap[sec.type];
                    if (bundleKey) {
                        aggregatedHomepage[bundleKey] = sec.content;
                    }
                });

                // Merge into the config blob
                currentConfig.homepageData = aggregatedHomepage;
                return res.json({ ...config, config: currentConfig });
            }
        }

        if (!config) {
            console.log(`[CMSController] No config found for key: ${key}, returning empty.`);
            return res.json({ key, config: {} });
        }

        res.json(config);
    } catch (error) {
        console.error('[CMSController] Get Config Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const upsertConfig = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { key, config } = req.body;

        if (!key || !config) {
            return res.status(400).json({ error: 'Missing key or config in request body' });
        }

        console.log(`[CMSController] Upserting config for key: ${key}`);

        // 1. Fetch current config to save as a revision (before overwriting)
        const existing = await prisma.globalConfig.findUnique({ where: { key } });
        if (existing) {
            await prisma.cMSRevision.create({
                data: {
                    entityType: 'GLOBAL_CONFIG',
                    entityKey: key,
                    snapshot: existing.config as any,
                    updatedBy: req.user.userId
                }
            });
        }

        // 2. Perform the update
        const savedConfig = await prisma.globalConfig.upsert({
            where: { key },
            create: {
                key,
                config,
                updatedBy: req.user.userId
            },
            update: {
                config,
                updatedBy: req.user.userId,
                updatedAt: new Date() // Force timestamp update
            }
        });

        res.json({ 
            message: 'Configuration saved globally', 
            key: savedConfig.key,
            updatedAt: savedConfig.updatedAt 
        });
    } catch (error) {
        console.error('[CMSController] Upsert Config Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const id = req.params.id as string;
        await prisma.pageContent.delete({
            where: { id }
        });

        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Delete Page Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REVISION HISTORY
 */

export const getRevisions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { entityType, entityKey } = req.query;
        
        const whereClause: any = {};
        if (entityType) whereClause.entityType = entityType as string;
        if (entityKey) whereClause.entityKey = entityKey as string;

        const revisions = await prisma.cMSRevision.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        res.json(revisions);
    } catch (error) {
        console.error('Get Revisions Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const restoreRevision = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const revisionId = req.params.revisionId as string;
        
        const revision = await prisma.cMSRevision.findUnique({
             where: { id: revisionId }
        });

        if (!revision) {
            return res.status(404).json({ error: 'Revision not found' });
        }

        // Restore depending on entity type
        if (revision.entityType === 'GLOBAL_CONFIG') {
            await prisma.globalConfig.update({
                where: { key: revision.entityKey },
                data: {
                    config: revision.snapshot as any,
                    updatedBy: req.user.userId,
                    updatedAt: new Date()
                }
            });
        } else if (revision.entityType === 'PAGE_CONTENT') {
            const snap = revision.snapshot as any;
            await prisma.pageContent.update({
                where: { slug: revision.entityKey },
                data: {
                    title: snap.title,
                    metaDescription: snap.metaDescription,
                    bodyContent: snap.bodyContent,
                    published: snap.published,
                    updatedBy: req.user.userId,
                    updatedAt: new Date()
                }
            });
        }

        res.json({ message: 'Revision restored successfully' });
    } catch (error) {
        console.error('Restore Revision Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const syncCMSData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { data } = req.body; // Expects { "homepage": {...}, "serviceDetails": {...}, "industryDetails": {...} }
        
        if (!data) {
            return res.status(400).json({ error: 'No data provided for sync' });
        }

        console.log('[CMSController] Batch syncing CMS data...');

        const CMS_CONFIG_KEY = 'global_cms_bundle';
        const updates = [];

        // 1. Prepare individual row updates (for backward compatibility or specific partial fetches)
        if (data.homepage) {
            for (const [key, config] of Object.entries(data.homepage)) {
                updates.push(
                    prisma.globalConfig.upsert({
                        where: { key },
                        create: { key, config: config as any, updatedBy: req.user.userId },
                        update: { config: config as any, updatedBy: req.user.userId, updatedAt: new Date() }
                    })
                );
            }
        }

        if (data.serviceDetails) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'cms_serviceDetails' },
                    create: { key: 'cms_serviceDetails', config: data.serviceDetails as any, updatedBy: req.user.userId },
                    update: { config: data.serviceDetails as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        if (data.industryDetails) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'cms_industryDetails' },
                    create: { key: 'cms_industryDetails', config: data.industryDetails as any, updatedBy: req.user.userId },
                    update: { config: data.industryDetails as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        // 2. Handle Header & Footer (Newly added to sync flow)
        if (data.header) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'header' },
                    create: { key: 'header', config: data.header as any, updatedBy: req.user.userId },
                    update: { config: data.header as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        if (data.footer) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'footer' },
                    create: { key: 'footer', config: data.footer as any, updatedBy: req.user.userId },
                    update: { config: data.footer as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        // --- Handle Job Openings (Specialized Table Sync) ---
        if (data.jobOpenings && Array.isArray(data.jobOpenings)) {
            console.log('[CMSController] Syncing JobOpenings table...');
            // First, clear existing jobs to ensure a clean sync (or we could do upsert by ID)
            // For simplicity in CMS sync, we'll replace the set if provided
            updates.push(prisma.jobOpening.deleteMany({})); 
            
            for (const job of data.jobOpenings) {
                updates.push(
                    prisma.jobOpening.create({
                        data: {
                            id: job.id || undefined,
                            title: job.title,
                            department: job.department,
                            location: job.location,
                            employmentType: job.employmentType,
                            summary: job.summary,
                            description: job.description,
                            responsibilities: job.responsibilities,
                            requirements: job.requirements,
                            salaryInfo: job.salaryInfo,
                            applicationUrl: job.applicationUrl,
                            status: job.status || 'OPEN',
                            isPublished: job.isPublished !== undefined ? job.isPublished : true,
                            displayOrder: job.displayOrder || 0
                        }
                    })
                );
            }
        }

        // --- Handle Menu Config (GlobalConfig) ---
        if (data.menuConfig) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'cms_menuConfig' },
                    create: { key: 'cms_menuConfig', config: data.menuConfig as any, updatedBy: req.user.userId },
                    update: { config: data.menuConfig as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        // --- Handle Careers Page (GlobalConfig) ---
        if (data.careersPage) {
            updates.push(
                prisma.globalConfig.upsert({
                    where: { key: 'cms_careersPage' },
                    create: { key: 'cms_careersPage', config: data.careersPage as any, updatedBy: req.user.userId },
                    update: { config: data.careersPage as any, updatedBy: req.user.userId, updatedAt: new Date() }
                })
            );
        }

        // 3. CRITICAL: Update the MASTER BUNDLE that the frontend fetches on load.
        // This resolves the "lost data on refresh" issue.
        const masterPayload = {
            header: data.header,
            footer: data.footer,
            serviceDetails: data.serviceDetails,
            industryDetails: data.industryDetails,
            homepageData: data.homepage,
            // Preserve pages if they are ever bundled, but for now focus on the core context fields
            aboutPage: data.aboutPage,
            contactPage: data.contactPage,
            servicesPage: data.servicesPage,
            industriesPage: data.industriesPage,
            menuConfig: data.menuConfig,
            careersPage: data.careersPage,
            jobOpenings: data.jobOpenings
        };

        // 4. NEW: Granular Sync to CMSPage/CMSSection
        if (data.homepage) {
            console.log('[CMSController] Granularly syncing homepage sections...');
            const hpPage = await prisma.cMSPage.upsert({
                where: { slug: 'homepage' },
                create: { slug: 'homepage', title: 'Homepage', status: 'PUBLISHED' },
                update: { title: 'Homepage', status: 'PUBLISHED' }
            });

            const typeToKeyMap: Record<string, string> = {
                'hero': 'cms_heroConfig',
                'slider': 'cms_slidesConfig',
                'howItWorks': 'cms_howItWorksConfig',
                'whyUs': 'cms_whyUsConfig',
                'services': 'cms_servicesConfig',
                'stats': 'cms_statsConfig',
                'industries': 'cms_industriesConfig',
                'testimonials': 'cms_testimonialsConfig',
                'cta': 'cms_ctaConfig',
                'custom': 'cms_customSections'
            };

            for (const [type, bundleKey] of Object.entries(typeToKeyMap)) {
                const content = data.homepage[bundleKey];
                if (content) {
                    updates.push(
                        prisma.cMSSection.upsert({
                            where: { pageId_type: { pageId: hpPage.id, type } },
                            create: { pageId: hpPage.id, type, content: content as any },
                            update: { content: content as any, updatedAt: new Date() }
                        })
                    );
                }
            }
        }

        updates.push(
            prisma.globalConfig.upsert({
                where: { key: CMS_CONFIG_KEY },
                create: { key: CMS_CONFIG_KEY, config: masterPayload as any, updatedBy: req.user.userId },
                update: { config: masterPayload as any, updatedBy: req.user.userId, updatedAt: new Date() }
            })
        );

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        res.json({ message: 'CMS data synchronized', count: updates.length });
    } catch (error) {
        console.error('[CMSController] Sync CMS Data Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
