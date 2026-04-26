import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const ADMIN_ROLES = ['admin', 'super_admin'];
export const SUPER_ADMIN_ROLES = ['super_admin'];

export const isAdminRole = (role?: string) => !!role && ADMIN_ROLES.includes(role);
export const isSuperAdminRole = (role?: string) => !!role && SUPER_ADMIN_ROLES.includes(role);

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden: admin access required' });
    next();
};

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!isSuperAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden: super admin access required' });
    next();
};

export async function logAudit(prisma: any, input: {
    userId?: string;
    role?: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    relatedBookingId?: string;
    summary: string;
    humanApprovalRequired?: boolean;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: input.userId,
                role: input.role,
                actionType: input.actionType,
                entityType: input.entityType,
                entityId: input.entityId,
                relatedBookingId: input.relatedBookingId,
                summary: input.summary,
                humanApprovalRequired: input.humanApprovalRequired ?? false,
            }
        });
    } catch (error) {
        console.warn('[AuditLog] Failed to persist audit event:', error);
    }
}
