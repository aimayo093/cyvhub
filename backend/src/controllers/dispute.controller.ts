import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../utils/notification.service';

export const raiseDispute = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { jobId, targetId, reason, description } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const dispute = await prisma.dispute.create({
            data: {
                jobId,
                creatorId: userId,
                targetId: targetId || null,
                reason,
                description,
                status: 'OPEN'
            }
        });

        // Notify Admins
        // TODO: Could use an internal slack webhook or admin email broadcast

        res.status(201).json({ message: 'Dispute raised successfully', dispute });
    } catch (error) {
        console.error('Raise Dispute Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDisputes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let disputes;
        if (role === 'admin') {
            disputes = await prisma.dispute.findMany({
                include: {
                    job: true,
                    creator: { select: { id: true, firstName: true, lastName: true, role: true } },
                    target: { select: { id: true, firstName: true, lastName: true, role: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            disputes = await prisma.dispute.findMany({
                where: {
                    OR: [
                        { creatorId: userId },
                        { targetId: userId }
                    ]
                },
                include: {
                    job: true,
                    creator: { select: { id: true, firstName: true, lastName: true, role: true } },
                    target: { select: { id: true, firstName: true, lastName: true, role: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        res.json({ disputes });
    } catch (error) {
        console.error('Get Disputes Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDisputeDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.userId;
        const role = req.user?.role;

        const dispute = await prisma.dispute.findUnique({
            where: { id },
            include: {
                job: true,
                creator: { select: { id: true, firstName: true, lastName: true, role: true } },
                target: { select: { id: true, firstName: true, lastName: true, role: true } },
                messages: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, role: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        if (role !== 'admin' && dispute.creatorId !== userId && dispute.targetId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json({ dispute });
    } catch (error) {
        console.error('Get Dispute Details Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addDisputeMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { content, fileUrl } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const message = await prisma.disputeMessage.create({
            data: {
                disputeId: id,
                authorId: userId,
                content,
                fileUrl
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, role: true } }
            }
        });

        res.status(201).json({ message: 'Message added', data: message });
    } catch (error) {
        console.error('Add Dispute Message Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resolveDispute = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, refundStatus, refundAmount } = req.body;
        const userId = req.user?.userId;

        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const dispute = await prisma.dispute.findUnique({
            where: { id },
            include: { job: true }
        });

        if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

        // If refund is issued via Stripe
        if (refundStatus === 'FULL' || refundStatus === 'PARTIAL') {
            const financialRecord = await (prisma as any).jobFinancialRecord.findUnique({
                where: { jobId: dispute.jobId }
            });

            if (financialRecord?.stripePaymentIntentId) {
                try {
                    // Try to execute a Stripe refund
                    const { StripeConnectService } = require('../services/stripe-connect.service');
                    await StripeConnectService.executeRefund(
                        financialRecord.stripePaymentIntentId,
                        refundAmount 
                    );
                } catch (refundErr) {
                    console.error('Refund Execution Failed:', refundErr);
                    // Do not block dispute resolution, but let admin know
                }
            }
        }

        const updatedDispute = await prisma.dispute.update({
            where: { id },
            data: {
                status,
                refundStatus,
                refundAmount: refundAmount ? parseFloat(refundAmount) : null,
                resolvedBy: userId,
                resolvedAt: (status === 'RESOLVED' || status === 'REJECTED') ? new Date() : null
            }
        });

        res.json({ message: 'Dispute updated successfully', dispute: updatedDispute });
    } catch (error) {
        console.error('Resolve Dispute Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
