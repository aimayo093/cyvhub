import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getIndustries = async (req: Request, res: Response) => {
    try {
        const industries = await prisma.industry.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                title: true,
                slug: true,
                tagline: true,
                shortDescription: true,
                icon: true,
                heroImage: true,
                seoTitle: true,
                seoDescription: true,
            }
        });
        res.json(industries);
    } catch (error) {
        console.error('Get Industries Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getIndustryBySlug = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const industry = await prisma.industry.findUnique({
            where: { slug }
        });

        if (!industry || !industry.isActive) {
            return res.status(404).json({ error: 'Industry not found' });
        }

        res.json(industry);
    } catch (error) {
        console.error('Get Industry Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createIndustry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const {
            title,
            slug: customSlug,
            tagline,
            shortDescription,
            fullDescription,
            keyBenefits,
            featureBlocks,
            heroImage,
            icon,
            seoTitle,
            seoDescription,
            displayOrder
        } = req.body;

        if (!title || !shortDescription || !fullDescription) {
            return res.status(400).json({ error: 'Missing required fields: title, shortDescription, fullDescription' });
        }

        // Auto-generate slug from title if not provided
        const slug = customSlug || title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const industry = await prisma.industry.create({
            data: {
                title,
                slug,
                tagline: tagline || null,
                shortDescription,
                fullDescription,
                keyBenefits: keyBenefits || [],
                featureBlocks: featureBlocks || [],
                heroImage: heroImage || null,
                icon: icon || null,
                seoTitle: seoTitle || title,
                seoDescription: seoDescription || shortDescription,
                displayOrder: displayOrder || 0,
                isActive: true
            }
        });

        res.status(201).json({ message: 'Industry created successfully', industry });
    } catch (error) {
        console.error('Create Industry Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateIndustry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const id = req.params.id as string;
        const {
            title,
            slug: customSlug,
            tagline,
            shortDescription,
            fullDescription,
            keyBenefits,
            featureBlocks,
            heroImage,
            icon,
            seoTitle,
            seoDescription,
            displayOrder,
            isActive
        } = req.body;

        const industry = await prisma.industry.update({
            where: { id },
            data: {
                title: title !== undefined ? title : undefined,
                slug: customSlug !== undefined ? customSlug : undefined,
                tagline: tagline !== undefined ? tagline : undefined,
                shortDescription: shortDescription !== undefined ? shortDescription : undefined,
                fullDescription: fullDescription !== undefined ? fullDescription : undefined,
                keyBenefits: keyBenefits !== undefined ? keyBenefits : undefined,
                featureBlocks: featureBlocks !== undefined ? featureBlocks : undefined,
                heroImage: heroImage !== undefined ? heroImage : undefined,
                icon: icon !== undefined ? icon : undefined,
                seoTitle: seoTitle !== undefined ? seoTitle : undefined,
                seoDescription: seoDescription !== undefined ? seoDescription : undefined,
                displayOrder: displayOrder !== undefined ? displayOrder : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        });

        res.json({ message: 'Industry updated successfully', industry });
    } catch (error) {
        console.error('Update Industry Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteIndustry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const id = req.params.id as string;

        // Soft delete: set isActive to false
        await prisma.industry.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: 'Industry deleted successfully' });
    } catch (error) {
        console.error('Delete Industry Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const reorderIndustries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { industries } = req.body; // [{ id, displayOrder }, ...]

        if (!Array.isArray(industries)) {
            return res.status(400).json({ error: 'Invalid format: industries must be an array' });
        }

        const updates = industries.map((i: any) =>
            prisma.industry.update({
                where: { id: i.id },
                data: { displayOrder: i.displayOrder }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Industries reordered successfully' });
    } catch (error) {
        console.error('Reorder Industries Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
