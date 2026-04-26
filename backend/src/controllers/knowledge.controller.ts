import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { isAdminRole, isSuperAdminRole, logAudit } from '../utils/roles';
import { NotificationService } from '../utils/notification.service';

const normalizeStatus = (status?: string) => {
    const value = String(status || '').toUpperCase().replace(/\s+/g, '_');
    return ['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(value) ? value : 'NEW';
};

const templateSelect = {
    id: true,
    title: true,
    scenario: true,
    responseMessage: true,
    internalNotes: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true } }
};

const paramString = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value || '';

export const listCategories = async (req: Request, res: Response) => {
    const type = req.query.type ? String(req.query.type) : undefined;
    const categories = await prisma.supportCategory.findMany({
        where: type ? { type } : undefined,
        orderBy: [{ type: 'asc' }, { order: 'asc' }, { name: 'asc' }]
    });
    res.json({ categories });
};

export const upsertCategory = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { id, name, slug, type, description, order } = req.body;
    if (!name || !slug || !type) return res.status(400).json({ error: 'Missing required fields' });
    const data = { name, slug, type, description, order: Number(order || 0) };
    const category = id
        ? await prisma.supportCategory.update({ where: { id }, data })
        : await prisma.supportCategory.create({ data });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'CATEGORY_EDITED', entityType: 'SupportCategory', entityId: category.id, summary: `${type} category saved: ${name}` });
    res.json({ category });
};

export const listInquiries = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const inquiries = await prisma.customerInquiry.findMany({
        orderBy: { createdAt: 'desc' },
        include: { assignedAdmin: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } }
    });
    res.json({ inquiries });
};

export const createInquiry = async (req: Request, res: Response) => {
    const { customerName, email, phone, bookingId, message } = req.body;
    if (!customerName || !email || !message) return res.status(400).json({ error: 'Missing required fields' });
    const inquiry = await prisma.customerInquiry.create({ data: { customerName, email, phone, bookingId, message } });
    res.status(201).json({ inquiry });
};

export const getInquiry = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const inquiry = await prisma.customerInquiry.findUnique({
        where: { id: paramString(req.params.id) },
        include: {
            assignedAdmin: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            responses: { include: { responder: { select: { firstName: true, lastName: true, email: true } }, template: { select: { title: true } } }, orderBy: { sentAt: 'desc' } }
        }
    });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    res.json({ inquiry });
};

export const updateInquiry = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { status, assignedAdminId } = req.body;
    const inquiry = await prisma.customerInquiry.update({
        where: { id: paramString(req.params.id) },
        data: {
            ...(status ? { status: normalizeStatus(status) } : {}),
            ...(assignedAdminId !== undefined ? { assignedAdminId: assignedAdminId || null } : {})
        }
    });
    res.json({ inquiry });
};

export const sendInquiryResponse = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role) || !req.user) return res.status(403).json({ error: 'Forbidden' });
    const { message, templateId, aiGenerated } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const inquiry = await prisma.customerInquiry.findUnique({ where: { id: paramString(req.params.id) } });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    const response = await prisma.inquiryResponse.create({
        data: {
            inquiryId: inquiry.id,
            responderId: req.user.userId,
            templateId: templateId || null,
            message,
            sentToEmail: inquiry.email,
            aiGenerated: !!aiGenerated
        }
    });
    await prisma.customerInquiry.update({ where: { id: inquiry.id }, data: { status: 'RESOLVED' } });
    await NotificationService.sendEmail(inquiry.email, 'CYVhub support response', message).catch(() => undefined);
    await logAudit(prisma, { userId: req.user.userId, role: req.user.role, actionType: 'INQUIRY_RESPONSE_SENT', entityType: 'CustomerInquiry', entityId: inquiry.id, relatedBookingId: inquiry.bookingId || undefined, summary: `Support response sent to ${inquiry.email}`, humanApprovalRequired: !!aiGenerated });
    res.status(201).json({ response });
};

export const listTemplates = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const templates = await prisma.responseTemplate.findMany({ orderBy: { updatedAt: 'desc' }, select: templateSelect });
    res.json({ templates });
};

export const upsertTemplate = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { id, title, categoryId, scenario, responseMessage, internalNotes, isActive } = req.body;
    if (!title || !scenario || !responseMessage) return res.status(400).json({ error: 'Missing required fields' });
    const data = { title, categoryId: categoryId || null, scenario, responseMessage, internalNotes, isActive: isActive !== false };
    const template = id ? await prisma.responseTemplate.update({ where: { id }, data }) : await prisma.responseTemplate.create({ data });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'TEMPLATE_EDITED', entityType: 'ResponseTemplate', entityId: template.id, summary: `Response template saved: ${title}` });
    res.json({ template });
};

export const deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const id = paramString(req.params.id);
    await prisma.responseTemplate.delete({ where: { id } });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'TEMPLATE_DELETED', entityType: 'ResponseTemplate', entityId: id, summary: 'Response template deleted' });
    res.json({ ok: true });
};

export const listFaq = async (req: Request, res: Response) => {
    const includeDrafts = req.query.includeDrafts === 'true';
    const faqs = await prisma.fAQ.findMany({
        where: includeDrafts ? undefined : { publishStatus: 'PUBLISHED' },
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }]
    });
    res.json({ faqs });
};

export const upsertFaq = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { id, question, answer, categoryId, order, publishStatus } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Missing required fields' });
    const data = { question, answer, categoryId: categoryId || null, order: Number(order || 0), publishStatus: publishStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' };
    const faq = id ? await prisma.fAQ.update({ where: { id }, data }) : await prisma.fAQ.create({ data });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'FAQ_EDITED', entityType: 'FAQ', entityId: faq.id, summary: `FAQ saved: ${question}` });
    res.json({ faq });
};

export const deleteFaq = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const id = paramString(req.params.id);
    await prisma.fAQ.delete({ where: { id } });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'FAQ_DELETED', entityType: 'FAQ', entityId: id, summary: 'FAQ deleted' });
    res.json({ ok: true });
};

export const listPolicies = async (req: AuthenticatedRequest, res: Response) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const policies = await prisma.policy.findMany({ include: { category: true }, orderBy: { lastUpdated: 'desc' } });
    res.json({ policies });
};

export const upsertPolicy = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const { id, title, categoryId, description, fullContent, version } = req.body;
    if (!title || !description || !fullContent) return res.status(400).json({ error: 'Missing required fields' });
    const data = { title, categoryId: categoryId || null, description, fullContent, version: version || '1.0', lastUpdated: new Date() };
    const policy = id ? await prisma.policy.update({ where: { id }, data }) : await prisma.policy.create({ data });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'POLICY_EDITED', entityType: 'Policy', entityId: policy.id, summary: `Policy saved: ${title}` });
    res.json({ policy });
};

export const deletePolicy = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const id = paramString(req.params.id);
    await prisma.policy.delete({ where: { id } });
    await logAudit(prisma, { userId: req.user?.userId, role: req.user?.role, actionType: 'POLICY_DELETED', entityType: 'Policy', entityId: id, summary: 'Policy deleted' });
    res.json({ ok: true });
};

export const listAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 250 });
    res.json({ logs });
};
