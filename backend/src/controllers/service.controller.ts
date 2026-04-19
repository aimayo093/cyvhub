import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getServices = async (req: Request, res: Response) => {
    try {
        const services = await prisma.service.findMany({
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
        res.json(services);
    } catch (error) {
        console.error('Get Services Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getServiceBySlug = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const service = await prisma.service.findUnique({
            where: { slug }
        });

        if (!service || !service.isActive) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(service);
    } catch (error) {
        console.error('Get Service Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createService = async (req: AuthenticatedRequest, res: Response) => {
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

        const service = await prisma.service.create({
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

        res.status(201).json({ message: 'Service created successfully', service });
    } catch (error) {
        console.error('Create Service Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateService = async (req: AuthenticatedRequest, res: Response) => {
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

        const service = await prisma.service.update({
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

        res.json({ message: 'Service updated successfully', service });
    } catch (error) {
        console.error('Update Service Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteService = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const id = req.params.id as string;

        // Soft delete: set isActive to false
        await prisma.service.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Delete Service Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const reorderServices = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { services } = req.body; // [{ id, displayOrder }, ...]

        if (!Array.isArray(services)) {
            return res.status(400).json({ error: 'Invalid format: services must be an array' });
        }

        const updates = services.map((s: any) =>
            prisma.service.update({
                where: { id: s.id },
                data: { displayOrder: s.displayOrder }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Services reordered successfully' });
    } catch (error) {
        console.error('Reorder Services Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
