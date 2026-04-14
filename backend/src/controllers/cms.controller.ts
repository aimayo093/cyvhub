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

