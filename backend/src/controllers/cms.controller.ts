import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getPages = async (req: Request, res: Response) => {
    try {
        const pages = await (prisma as any).pageContent.findMany({
            select: { slug: true, title: true, updatedAt: true }
        });
        res.json(pages);
    } catch (error) {
        console.error('Get Pages Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPageBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const page = await (prisma as any).pageContent.findUnique({
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
        // SEC-ROLE: Only admins can edit CMS content
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { slug, title, metaDescription, bodyContent } = req.body;

        if (!slug || !title || !bodyContent) {
            return res.status(400).json({ error: 'Missing required fields: slug, title, bodyContent' });
        }

        const page = await (prisma as any).pageContent.upsert({
            where: { slug },
            create: {
                slug,
                title,
                metaDescription,
                bodyContent,
                updatedBy: req.user.userId
            },
            update: {
                title,
                metaDescription,
                bodyContent,
                updatedBy: req.user.userId
            }
        });

        res.json({ message: 'Page saved successfully', page });
    } catch (error) {
        console.error('Upsert Page Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;
        await (prisma as any).pageContent.delete({
            where: { id }
        });

        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Delete Page Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
