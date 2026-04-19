import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getCareers = async (req: Request, res: Response) => {
    try {
        const { department, employmentType } = req.query;
        const where: any = { isActive: true };

        if (department) where.department = department;
        if (employmentType) where.employmentType = employmentType;

        const jobs = await prisma.jobPosting.findMany({
            where,
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }]
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get Careers Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createCareerPosting = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const {
            title,
            department,
            location,
            employmentType,
            salaryRange,
            shortSummary,
            fullDescription,
            applicationUrl,
            closingDate,
            displayOrder
        } = req.body;

        if (!title || !department || !location || !employmentType || !shortSummary || !fullDescription) {
            return res.status(400).json({
                error: 'Missing required fields: title, department, location, employmentType, shortSummary, fullDescription'
            });
        }

        const job = await prisma.jobPosting.create({
            data: {
                title,
                department,
                location,
                employmentType,
                salaryRange: salaryRange || null,
                shortSummary,
                fullDescription,
                applicationUrl: applicationUrl || null,
                closingDate: closingDate ? new Date(closingDate) : null,
                isActive: true,
                displayOrder: displayOrder || 0
            }
        });

        res.status(201).json({ message: 'Career posting created successfully', job });
    } catch (error) {
        console.error('Create Career Posting Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCareerPosting = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { id } = req.params;
        const {
            title,
            department,
            location,
            employmentType,
            salaryRange,
            shortSummary,
            fullDescription,
            applicationUrl,
            closingDate,
            displayOrder,
            isActive
        } = req.body;

        const job = await prisma.jobPosting.update({
            where: { id },
            data: {
                title: title !== undefined ? title : undefined,
                department: department !== undefined ? department : undefined,
                location: location !== undefined ? location : undefined,
                employmentType: employmentType !== undefined ? employmentType : undefined,
                salaryRange: salaryRange !== undefined ? salaryRange : undefined,
                shortSummary: shortSummary !== undefined ? shortSummary : undefined,
                fullDescription: fullDescription !== undefined ? fullDescription : undefined,
                applicationUrl: applicationUrl !== undefined ? applicationUrl : undefined,
                closingDate: closingDate !== undefined ? (closingDate ? new Date(closingDate) : null) : undefined,
                displayOrder: displayOrder !== undefined ? displayOrder : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });

        res.json({ message: 'Career posting updated successfully', job });
    } catch (error) {
        console.error('Update Career Posting Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCareerPosting = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { id } = req.params;

        // Soft delete: set isActive to false
        await prisma.jobPosting.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: 'Career posting deleted successfully' });
    } catch (error) {
        console.error('Delete Career Posting Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const reorderCareers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }

        const { jobs } = req.body; // [{ id, displayOrder }, ...]

        if (!Array.isArray(jobs)) {
            return res.status(400).json({ error: 'Invalid format: jobs must be an array' });
        }

        const updates = jobs.map((j: any) =>
            prisma.jobPosting.update({
                where: { id: j.id },
                data: { displayOrder: j.displayOrder }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Career postings reordered successfully' });
    } catch (error) {
        console.error('Reorder Career Postings Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
