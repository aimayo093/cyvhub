import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getMenuByLocation = async (req: Request, res: Response) => {
    try {
        const { location } = req.query;
        const where = location ? { location: location as string } : {};

        const menuItems = await prisma.menuItem.findMany({
            where: {
                ...where,
                isVisible: true
            },
            orderBy: { displayOrder: 'asc' }
        });

        res.json(menuItems);
    } catch (error) {
        console.error('Get Menu Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { label, url, type, displayOrder, isVisible, location } = req.body;

        if (!label) {
            return res.status(400).json({ error: 'Missing required field: label' });
        }

        const menuItem = await prisma.menuItem.create({
            data: {
                label,
                url: url || null,
                type: type || 'link',
                displayOrder: displayOrder || 0,
                isVisible: isVisible !== undefined ? isVisible : true,
                location: location || 'header'
            }
        });

        res.status(201).json({ message: 'Menu item created successfully', menuItem });
    } catch (error) {
        console.error('Create MenuItem Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMenuItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { id } = req.params;
        const { label, url, type, displayOrder, isVisible, location } = req.body;

        const menuItem = await prisma.menuItem.update({
            where: { id },
            data: {
                label: label !== undefined ? label : undefined,
                url: url !== undefined ? url : undefined,
                type: type !== undefined ? type : undefined,
                displayOrder: displayOrder !== undefined ? displayOrder : undefined,
                isVisible: isVisible !== undefined ? isVisible : undefined,
                location: location !== undefined ? location : undefined
            }
        });

        res.json({ message: 'Menu item updated successfully', menuItem });
    } catch (error) {
        console.error('Update MenuItem Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { id } = req.params;

        await prisma.menuItem.delete({
            where: { id }
        });

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Delete MenuItem Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const reorderMenuItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { menuItems } = req.body; // [{ id, displayOrder }, ...]

        if (!Array.isArray(menuItems)) {
            return res.status(400).json({ error: 'Invalid format: menuItems must be an array' });
        }

        const updates = menuItems.map((item: any) =>
            prisma.menuItem.update({
                where: { id: item.id },
                data: { displayOrder: item.displayOrder }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Menu items reordered successfully' });
    } catch (error) {
        console.error('Reorder Menu Items Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
