import { Request, Response } from 'express';
import { prisma } from '../index';
import cloudinary from '../utils/cloudinary';

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

// ─── Carrier Document type definitions ─────────────────────────────────────────
export const CARRIER_DOC_TYPES = [
    { slug: 'operator_licence',   label: 'Operator Licence' },
    { slug: 'git_insurance',      label: 'Goods in Transit Insurance' },
    { slug: 'public_liability',   label: 'Public Liability Insurance' },
    { slug: 'background_checks',  label: 'Driver Background Checks' },
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

    const anyExpired = docs.some((d) => d.expiryDate && d.expiryDate < now && d.status === 'verified');
    const anyRejected = docs.some((d) => d.status === 'rejected');
    const anyPending = docs.some((d) => d.status === 'pending_review');
    const allVerified = missing.length === 0 && docs.every((d) => d.status === 'verified') && !anyExpired;

    let overallStatus: string;
    if (missing.length === allRequired.length && docs.length === 0) overallStatus = 'not_submitted';
    else if (anyExpired || (missing.length > 0 && docs.length > 0)) overallStatus = 'action_required';
    else if (anyRejected) overallStatus = 'rejected';
    else if (anyPending) overallStatus = 'pending_verification';
    else if (allVerified) overallStatus = 'verified';
    else overallStatus = 'pending_verification';

    return { docs, overallStatus, missing };
}

// ─── Compute overall carrier compliance status ────────────────────────────────
async function getCarrierComplianceSummary(carrierId: string) {
    const docs = await prisma.complianceDocument.findMany({
        where: { carrierId },
    });

    const now = new Date();
    const slugsUploaded = new Set(docs.map((d) => d.type));
    const allRequired = CARRIER_DOC_TYPES.map((t) => t.slug);
    const missing = allRequired.filter((s) => !slugsUploaded.has(s));

    const anyExpired = docs.some((d) => d.expiryDate && d.expiryDate < now && d.status === 'verified');
    const anyRejected = docs.some((d) => d.status === 'rejected');
    const anyPending = docs.some((d) => d.status === 'pending_review');
    const allVerified = missing.length === 0 && docs.every((d) => d.status === 'verified') && !anyExpired;

    let overallStatus: string;
    if (missing.length === allRequired.length && docs.length === 0) overallStatus = 'not_submitted';
    else if (anyExpired || (missing.length > 0 && docs.length > 0)) overallStatus = 'action_required';
    else if (anyRejected) overallStatus = 'rejected';
    else if (anyPending) overallStatus = 'pending_verification';
    else if (allVerified) overallStatus = 'verified';
    else overallStatus = 'pending_verification';

    return { docs, overallStatus, missing };
}

// ─── DRIVER: Get my compliance documents ────────────────────────────────────
export const getMyCompliance = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).user?.userId;
        if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { docs, overallStatus, missing } = await getDriverComplianceSummary(driverId);
        res.json({ overallStatus, requiredDocTypes: REQUIRED_DOC_TYPES, missing, documents: docs });
    } catch (err) {
        console.error('getMyCompliance error:', err);
        res.status(500).json({ error: 'Failed to fetch compliance documents' });
    }
};

// ─── CARRIER: Get my compliance documents ───────────────────────────────────
export const getMyCarrierCompliance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { carrierProfileId: true } });
        const carrierId = user?.carrierProfileId;
        if (!carrierId) return res.status(401).json({ error: 'No carrier profile found' });

        const { docs, overallStatus, missing } = await getCarrierComplianceSummary(carrierId);
        res.json({ overallStatus, requiredDocTypes: CARRIER_DOC_TYPES, missing, documents: docs });
    } catch (err) {
        console.error('getMyCarrierCompliance error:', err);
        res.status(500).json({ error: 'Failed to fetch carrier compliance docs' });
    }
};

// ─── DRIVER: Upload a document ───────────────────────────────────────────────
export const uploadComplianceDoc = async (req: Request, res: Response) => {
    try {
        const driverId = (req as any).user?.userId;
        if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { documentType, fileName, fileUrl, mimeType, fileSize, expiryDate, issueDate } = req.body;
        if (!documentType || !fileName || !fileUrl) return res.status(400).json({ error: 'Missing required fields' });

        const validType = REQUIRED_DOC_TYPES.find((t) => t.slug === documentType);
        if (!validType) return res.status(400).json({ error: `Unknown type: ${documentType}` });

        let finalFileUrl = fileUrl;
        if (fileUrl.startsWith('data:')) {
            const uploadRes = await cloudinary.uploader.upload(fileUrl, {
                folder: 'compliance_docs',
                resource_type: 'auto'
            });
            finalFileUrl = uploadRes.secure_url;
        }

        const existing = await prisma.driverComplianceDocument.findFirst({ where: { driverId, documentType } });

        const data = {
            fileName, fileUrl: finalFileUrl, mimeType: mimeType || null,
            fileSize: fileSize ? parseInt(fileSize) : null,
            issueDate: issueDate ? new Date(issueDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: 'pending_review', adminNote: null, rejectionReason: null, verifiedByAdminId: null, verifiedAt: null,
        };

        let doc;
        if (existing) {
            doc = await prisma.driverComplianceDocument.update({ where: { id: existing.id }, data });
        } else {
            doc = await prisma.driverComplianceDocument.create({ data: { driverId, documentType, ...data } });
        }
        res.status(201).json({ message: 'Success', document: doc });
    } catch (err) {
        console.error('uploadComplianceDoc error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
};

// ─── CARRIER: Upload a document ──────────────────────────────────────────────
export const uploadCarrierComplianceDoc = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { carrierProfileId: true } });
        const carrierId = user?.carrierProfileId;
        if (!carrierId) return res.status(401).json({ error: 'No carrier profile' });

        const { documentType, fileName, fileUrl, mimeType, fileSize, expiryDate, issueDate } = req.body;
        if (!documentType || !fileName || !fileUrl) return res.status(400).json({ error: 'Missing fields' });

        const validType = CARRIER_DOC_TYPES.find((t) => t.slug === documentType);
        if (!validType) return res.status(400).json({ error: `Unknown type: ${documentType}` });

        let finalFileUrl = fileUrl;
        if (fileUrl.startsWith('data:')) {
            const uploadRes = await cloudinary.uploader.upload(fileUrl, {
                folder: 'compliance_docs',
                resource_type: 'auto'
            });
            finalFileUrl = uploadRes.secure_url;
        }

        const existing = await prisma.complianceDocument.findFirst({ where: { carrierId, type: documentType } });

        const data = {
            fileName, fileUrl: finalFileUrl, mimeType: mimeType || null,
            fileSize: fileSize ? parseInt(fileSize) : null,
            issueDate: issueDate ? new Date(issueDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: 'pending_review', adminNote: null, rejectionReason: null, verifiedByAdminId: null, verifiedAt: null,
        };

        let doc;
        if (existing) {
            doc = await prisma.complianceDocument.update({ where: { id: existing.id }, data });
        } else {
            doc = await prisma.complianceDocument.create({ data: { carrierId, type: documentType, ...data } });
        }
        res.status(201).json({ message: 'Success', document: doc });
    } catch (err) {
        console.error('uploadCarrierComplianceDoc error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
};

// ─── ADMIN: List all pending compliance ───────────────────────────────────────
export const adminListCompliance = async (req: Request, res: Response) => {
    try {
        const statusFilter = (req.query.status as string) || 'pending_review';
        const where: any = statusFilter !== 'all' ? { status: statusFilter } : {};

        const driverDocs = await prisma.driverComplianceDocument.findMany({
            where, include: { driver: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        const carrierDocs = await prisma.complianceDocument.findMany({
            where, include: { carrier: { select: { id: true, companyName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        // Grouping logic (simplified for combined view)
        const combined = [
            ...driverDocs.map(d => ({ ...d, entityType: 'driver', entityName: `${d.driver.firstName} ${d.driver.lastName}`, entityId: d.driverId, docType: d.documentType })),
            ...carrierDocs.map(c => ({ ...c, entityType: 'carrier', entityName: c.carrier.companyName, entityId: c.carrier.id, docType: c.type })),
        ].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.json({ counts: { pending_review: combined.filter(c => c.status === 'pending_review').length, total: combined.length }, items: combined });
    } catch (err) {
        console.error('adminListCompliance error:', err);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

// ─── ADMIN: Approve document (Unified) ──────────────────────────────────────
export const adminApproveDoc = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user?.userId;
        const docId = req.params.docId as string;
        const { entityType, adminNote } = req.body; // Expect entityType: 'driver' | 'carrier'

        const updateData = { status: 'verified', adminNote: adminNote || null, rejectionReason: null, verifiedByAdminId: adminId, verifiedAt: new Date() };

        let updated;
        if (entityType === 'carrier') {
            updated = await prisma.complianceDocument.update({ where: { id: docId }, data: updateData });
        } else {
            updated = await prisma.driverComplianceDocument.update({ where: { id: docId }, data: updateData });
        }

        res.json({ message: 'Approved', document: updated });
    } catch (err) {
        console.error('adminApproveDoc error:', err);
        res.status(500).json({ error: 'Approve failed' });
    }
};

// ─── ADMIN: Reject document (Unified) ───────────────────────────────────────
export const adminRejectDoc = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user?.userId;
        const docId = req.params.docId as string;
        const { entityType, rejectionReason, adminNote } = req.body;

        if (!rejectionReason) return res.status(400).json({ error: 'rejectionReason required' });
        const updateData = { status: 'rejected', rejectionReason, adminNote: adminNote || null, verifiedByAdminId: adminId, verifiedAt: new Date() };

        let updated;
        if (entityType === 'carrier') {
            updated = await prisma.complianceDocument.update({ where: { id: docId }, data: updateData });
        } else {
            updated = await prisma.driverComplianceDocument.update({ where: { id: docId }, data: updateData });
        }

        res.json({ message: 'Rejected', document: updated });
    } catch (err) {
        console.error('adminRejectDoc error:', err);
        res.status(500).json({ error: 'Reject failed' });
    }
};

// Placeholder for adminGetDriverCompliance replacement if needed...
export const adminGetDriverCompliance = async (req: Request, res: Response) => {
    try {
        const driverId = req.params.driverId as string;
        const { docs, overallStatus, missing } = await getDriverComplianceSummary(driverId);
        const driver = await prisma.user.findUnique({ where: { id: driverId }, select: { id: true, firstName: true, lastName: true, email: true } });
        res.json({ driver, overallStatus, documents: docs, missing, requiredDocTypes: REQUIRED_DOC_TYPES });
    } catch (err) {
        console.error('adminGetDriverCompliance error:', err);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const adminGetCarrierCompliance = async (req: Request, res: Response) => {
    try {
        const carrierId = req.params.carrierId as string;
        const { docs, overallStatus, missing } = await getCarrierComplianceSummary(carrierId);
        const carrier = await prisma.carrierProfile.findUnique({ where: { id: carrierId } });
        res.json({ carrier, overallStatus, documents: docs, missing, requiredDocTypes: CARRIER_DOC_TYPES });
    } catch (err) {
        console.error('adminGetCarrierCompliance error:', err);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
