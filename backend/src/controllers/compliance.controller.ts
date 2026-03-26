import { Request, Response } from 'express';
import { prisma } from '../index';

// ─── Document type definitions ───────────────────────────────────────────────
export const REQUIRED_DOC_TYPES = [
    { slug: 'driving_licence',   label: 'Driving Licence' },
    { slug: 'motor_insurance',   label: 'Motor Insurance' },
    { slug: 'mot_certificate',   label: 'MOT Certificate' },
    { slug: 'goods_in_transit',  label: 'Goods in Transit Insurance' },
    { slug: 'public_liability',  label: 'Public Liability Insurance' },
    { slug: 'right_to_work',     label: 'Right to Work' },
    { slug: 'vehicle_registration', label: 'Vehicle Registration (V5)' },
];

// ─── Compute overall driver compliance status ────────────────────────────────
async function getDriverComplianceSummary(driverId: string) {
    const docs = await prisma.driverComplianceDocument.findMany({
        where: { driverId },
    });

    const now = new Date();
    const slugsUploaded = new Set(docs.map((d) => d.documentType));
    const allRequired = REQUIRED_DOC_TYPES.map((t) => t.slug);
    const missing = allRequired.filter((s) => !slugsUploaded.has(s));

    // Check for expired docs
    const anyExpired = docs.some(
        (d) => d.expiryDate && d.expiryDate < now && d.status === 'verified'
    );
    const anyRejected = docs.some((d) => d.status === 'rejected');
    const anyPending = docs.some((d) => d.status === 'pending_review');
    const allVerified =
        missing.length === 0 &&
        docs.every((d) => d.status === 'verified') &&
        !anyExpired;

    let overallStatus: string;
    if (missing.length === allRequired.length && docs.length === 0) {
        overallStatus = 'not_submitted';
    } else if (anyExpired || (missing.length > 0 && docs.length > 0)) {
        overallStatus = 'action_required';
    } else if (anyRejected) {
        overallStatus = 'rejected';
    } else if (anyPending) {
        overallStatus = 'pending_verification';
    } else if (allVerified) {
        overallStatus = 'verified';
    } else {
        overallStatus = 'pending_verification';
    }

    return { docs, overallStatus, missing };
}

// ─── DRIVER: Get my compliance documents ────────────────────────────────────
export const getMyCompliance = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).user?.userId;
        if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { docs, overallStatus, missing } = await getDriverComplianceSummary(driverId);

        res.json({
            overallStatus,
            requiredDocTypes: REQUIRED_DOC_TYPES,
            missing,
            documents: docs,
        });
    } catch (err) {
        console.error('getMyCompliance error:', err);
        res.status(500).json({ error: 'Failed to fetch compliance documents' });
    }
};

// ─── DRIVER: Upload / re-upload a compliance document ───────────────────────
// Expects: { documentType, fileName, fileUrl, mimeType, fileSize, expiryDate?, issueDate? }
export const uploadComplianceDoc = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).user?.userId;
        if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

        const {
            documentType, fileName, fileUrl, mimeType, fileSize,
            expiryDate, issueDate,
        } = req.body;

        if (!documentType || !fileName || !fileUrl) {
            return res.status(400).json({ error: 'documentType, fileName, and fileUrl are required' });
        }

        // Validate document type is one we recognise
        const validType = REQUIRED_DOC_TYPES.find((t) => t.slug === documentType);
        if (!validType) {
            return res.status(400).json({ error: `Unknown document type: ${documentType}` });
        }

        // Check if a doc of this type already exists for this driver
        const existing = await prisma.driverComplianceDocument.findFirst({
            where: { driverId, documentType },
        });

        let doc;
        if (existing) {
            // Update (re-upload — resets status to pending_review, clears rejection)
            doc = await prisma.driverComplianceDocument.update({
                where: { id: existing.id },
                data: {
                    fileName,
                    fileUrl,
                    mimeType: mimeType || null,
                    fileSize: fileSize ? parseInt(fileSize) : null,
                    issueDate: issueDate ? new Date(issueDate) : null,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    status: 'pending_review',
                    adminNote: null,
                    rejectionReason: null,
                    verifiedByAdminId: null,
                    verifiedAt: null,
                },
            });
        } else {
            doc = await prisma.driverComplianceDocument.create({
                data: {
                    driverId,
                    documentType,
                    fileName,
                    fileUrl,
                    mimeType: mimeType || null,
                    fileSize: fileSize ? parseInt(fileSize) : null,
                    issueDate: issueDate ? new Date(issueDate) : null,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    status: 'pending_review',
                },
            });
        }

        res.status(201).json({ message: 'Document uploaded successfully', document: doc });
    } catch (err) {
        console.error('uploadComplianceDoc error:', err);
        res.status(500).json({ error: 'Failed to upload compliance document' });
    }
};

// ─── ADMIN: List all pending compliance documents ────────────────────────────
export const adminListCompliance = async (req: Request, res: Response) => {
    try {
        const statusFilter = (req.query.status as string) || undefined;
        const where: any = {};
        if (statusFilter && statusFilter !== 'all') {
            where.status = statusFilter;
        }

        const docs = await prisma.driverComplianceDocument.findMany({
            where,
            include: {
                driver: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                verifiedByAdmin: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group by driver 
        const byDriver: Record<string, any> = {};
        for (const doc of docs) {
            const did = doc.driverId;
            if (!byDriver[did]) {
                byDriver[did] = {
                    driver: doc.driver,
                    documents: [],
                };
            }
            byDriver[did].documents.push(doc);
        }

        // Compute overallStatus per driver
        const grouped = await Promise.all(
            Object.values(byDriver).map(async (entry: any) => {
                const { overallStatus } = await getDriverComplianceSummary(entry.driver.id);
                return { ...entry, overallStatus };
            })
        );

        // Summary counts
        const counts = {
            pending_review: docs.filter((d) => d.status === 'pending_review').length,
            verified: docs.filter((d) => d.status === 'verified').length,
            rejected: docs.filter((d) => d.status === 'rejected').length,
            total: docs.length,
        };

        res.json({ counts, drivers: grouped });
    } catch (err) {
        console.error('adminListCompliance error:', err);
        res.status(500).json({ error: 'Failed to fetch compliance list' });
    }
};

// ─── ADMIN: Get a specific driver's compliance ───────────────────────────────
export const adminGetDriverCompliance = async (req: Request, res: Response) => {
    try {
        const { driverId } = req.params;
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
        });
        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ error: 'Driver not found' });
        }
        const { docs, overallStatus, missing } = await getDriverComplianceSummary(driverId);
        res.json({ driver, overallStatus, requiredDocTypes: REQUIRED_DOC_TYPES, missing, documents: docs });
    } catch (err) {
        console.error('adminGetDriverCompliance error:', err);
        res.status(500).json({ error: 'Failed to fetch driver compliance' });
    }
};

// ─── ADMIN: Approve a compliance document ───────────────────────────────────
export const adminApproveDoc = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user?.userId;
        const { docId } = req.params;
        const { adminNote } = req.body;

        const doc = await prisma.driverComplianceDocument.findUnique({ where: { id: docId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        const updated = await prisma.driverComplianceDocument.update({
            where: { id: docId },
            data: {
                status: 'verified',
                adminNote: adminNote || null,
                rejectionReason: null,
                verifiedByAdminId: adminId,
                verifiedAt: new Date(),
            },
        });

        res.json({ message: 'Document approved', document: updated });
    } catch (err) {
        console.error('adminApproveDoc error:', err);
        res.status(500).json({ error: 'Failed to approve document' });
    }
};

// ─── ADMIN: Reject a compliance document ────────────────────────────────────
export const adminRejectDoc = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user?.userId;
        const { docId } = req.params;
        const { rejectionReason, adminNote } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ error: 'rejectionReason is required when rejecting' });
        }

        const doc = await prisma.driverComplianceDocument.findUnique({ where: { id: docId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        const updated = await prisma.driverComplianceDocument.update({
            where: { id: docId },
            data: {
                status: 'rejected',
                rejectionReason,
                adminNote: adminNote || null,
                verifiedByAdminId: adminId,
                verifiedAt: new Date(),
            },
        });

        res.json({ message: 'Document rejected', document: updated });
    } catch (err) {
        console.error('adminRejectDoc error:', err);
        res.status(500).json({ error: 'Failed to reject document' });
    }
};
