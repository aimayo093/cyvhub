import { Request, Response } from 'express';
import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';

export class DeliveryController {

    // GET /api/deliveries
    static async getDeliveries(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            let query = {};

            if (role === 'customer') {
                query = { customerId: userId };
            } else if (role === 'driver') {
                query = { assignedDriverId: userId };
            } else if (role === 'carrier') {
                query = { assignedCarrierId: userId };
            }
            // Admin sees all

            const deliveries = await prisma.job.findMany({
                where: query as any,
                orderBy: { createdAt: 'desc' },
                include: { quoteRequest: { include: { lineItems: true } } }
            });

            res.status(200).json({ data: deliveries });
        } catch (error) {
            console.error('[DeliveryController] Error fetching deliveries:', error);
            res.status(500).json({ error: 'Failed to fetch deliveries' });
        }
    }

    // POST /api/deliveries
    static async createDelivery(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const payload = req.body;

            // SEC-5: Mass Assignment Protection
            const {
                pickupContactName, pickupContactPhone, pickupAddressLine1, pickupCity, pickupPostcode, pickupLatitude, pickupLongitude, pickupWindowStart, pickupWindowEnd,
                dropoffContactName, dropoffContactPhone, dropoffAddressLine1, dropoffCity, dropoffPostcode, dropoffLatitude, dropoffLongitude, dropoffWindowStart, dropoffWindowEnd,
                vehicleType, specialInstructions, goodsDescription, distanceKm, priority,
                // Epic 2/3: Advanced Bookings
                isReturnTrip = false, extraStops = 0,
                // Multi-Parcel Integration
                parcels = [], 
                // Legacy fields (fallback)
                weightKg, lengthCm, widthCm, heightCm, quantity,
                // Additional Fields
                jobType, pickupWindow, deliveryWindow
            } = payload;

            // Validate foundational required fields
            if (
                !pickupContactName || !pickupContactPhone || !pickupAddressLine1 || !pickupCity || !pickupPostcode ||
                !dropoffContactName || !dropoffContactPhone || !dropoffAddressLine1 || !dropoffCity || !dropoffPostcode ||
                !vehicleType
            ) {
                res.status(400).json({ error: 'Missing required delivery location fields.' });
                return;
            }

            // ==========================================
            // COMMERCIAL ENGINE GATEWAY (Epic 2/3)
            // ==========================================
            const distanceMiles = distanceKm ? parseFloat(distanceKm) / 1.60934 : 10.0;
            
            // Normalize items for the commercial engine
            let itemsToQuote = parcels && parcels.length > 0 ? parcels : [{
                weightKg: parseFloat(weightKg) || 0,
                lengthCm: parseFloat(lengthCm) || 0,
                widthCm: parseFloat(widthCm) || 0,
                heightCm: parseFloat(heightCm) || 0,
                quantity: parseInt(quantity, 10) || 1
            }];

            const { CommercialService } = require('../services/commercial.service');
            const quoteResult = await CommercialService.requestQuote({
                pickupPostcode,
                dropoffPostcode,
                distanceMiles,
                items: itemsToQuote,
                vehicleType, // Pass the selected vehicle type
                flags: {
                    stairs: specialInstructions?.toLowerCase().includes('stairs'),
                    isReturnTrip: isReturnTrip === true || isReturnTrip === 'true',
                    extraStops: parseInt(extraStops, 10) || 0
                }
            });

            // HARD ENFORCEMENT: Reject immediately if load is overweight/unsuitable
            if (!quoteResult.approved) {
                 console.warn('[DeliveryController] Quote Rejected:', quoteResult.reason);
                 res.status(422).json({ 
                     error: 'Commercial Rules Engine Rejected Booking', 
                     reason: quoteResult.reason,
                     message: quoteResult.message 
                 });
                 return;
            }

            // 03-29 Fix: Atomic Job Numbering via Transaction
            const { jobNumber, quoteRequestId } = await prisma.$transaction(async (tx) => {
                const counter = await tx.jobCounter.upsert({
                    where: { id: 1 },
                    update: { current: { increment: 1 } },
                    create: { id: 1, current: 1 }
                });
                
                const nextNumber = `CYV-${String(counter.current).padStart(6, '0')}`;
                return { jobNumber: nextNumber, quoteRequestId: quoteResult.quote.id };
            });

            // Generate a professional tracking number linked to the job number
            const trackingNumber = jobNumber.replace('CYV-', 'CYV-TRK-');


            // Default window times if missing (critical for Prisma mandatory fields)
            const now = new Date();
            const defaultStart = now.toISOString();
            const defaultEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // +4 hours

            const newDelivery = await prisma.job.create({
                data: {
                    customerId: userId || null,
                    jobNumber: jobNumber,
                    trackingNumber: trackingNumber,
                    status: 'PENDING_PAYMENT', 
                    paymentStatus: 'PENDING',
                    priority: priority || 'NORMAL',
                    jobType: jobType || 'Standard',
                    pickupWindow: pickupWindow || 'ASAP',
                    deliveryWindow: deliveryWindow || 'Standard',
                    pickupContactName, pickupContactPhone, pickupAddressLine1, pickupCity, pickupPostcode,
                    pickupLatitude: pickupLatitude ? parseFloat(pickupLatitude) : 0,
                    pickupLongitude: pickupLongitude ? parseFloat(pickupLongitude) : 0,
                    pickupWindowStart: pickupWindowStart || defaultStart,
                    pickupWindowEnd: pickupWindowEnd || defaultEnd,
                    dropoffContactName, dropoffContactPhone, dropoffAddressLine1, dropoffCity, dropoffPostcode,
                    dropoffLatitude: dropoffLatitude ? parseFloat(dropoffLatitude) : 0,
                    dropoffLongitude: dropoffLongitude ? parseFloat(dropoffLongitude) : 0,
                    dropoffWindowStart: dropoffWindowStart || defaultStart,
                    dropoffWindowEnd: dropoffWindowEnd || defaultEnd,
                    vehicleType, specialInstructions, goodsDescription,
                    calculatedPrice: quoteResult.quote.customerTotal,
                    quantity: quoteResult.additionalMetrics?.quantity || 1,
                    basePrice: quoteResult.additionalMetrics?.basePrice,
                    bulkDiscount: quoteResult.additionalMetrics?.bulkDiscount || 0,
                    distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
                    quoteRequestId: quoteRequestId,
                    parcels: {
                        create: itemsToQuote.map((p: any) => ({
                            weightKg: parseFloat(p.weightKg) || 0,
                            lengthCm: parseFloat(p.lengthCm) || 0,
                            widthCm: parseFloat(p.widthCm) || 0,
                            heightCm: parseFloat(p.heightCm) || 0,
                            quantity: parseInt(p.quantity, 10) || 1,
                            description: p.description || null
                        }))
                    }
                }
            });

            // ==========================================
            // NOTIFICATIONS
            // ==========================================
            try {
                const settings = await NotificationService.getSettings();
                if (settings && settings.notifyOnJobCreated) {
                    let targetEmail = payload.guestEmail || payload.email;
                    let targetPhone = pickupContactPhone;
                    let targetName = pickupContactName;

                    if (userId) {
                        const customer = await prisma.user.findUnique({ where: { id: userId } });
                        if (customer) {
                            targetEmail = customer.email;
                            targetPhone = customer.phone;
                            targetName = customer.firstName;
                        }
                    }

                    if (targetEmail) {
                        NotificationService.sendEmail(targetEmail, 'Job Created Successfully', `<p>Hi ${targetName},</p><p>Your job <b>${newDelivery.jobNumber}</b> has been created and is pending payment.</p>`);
                    }
                    if (targetPhone) {
                        NotificationService.sendSms(targetPhone, `CYVhub: Your job ${newDelivery.jobNumber} has been created.`);
                    }
                }
            } catch (notifErr) {
                console.error('[DeliveryController] Notification Error:', notifErr);
            }

            res.status(201).json({ data: newDelivery, commercial_breakdown: quoteResult.quote });
        } catch (error: any) {
            console.error('[DeliveryController] CRITICAL Error creating delivery:', error);
            res.status(500).json({ 
                error: 'Failed to create delivery.', 
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // PATCH /api/deliveries/:id/cancel
    static async cancelDelivery(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            const existing = await prisma.job.findUnique({ where: { id: id as string } });
            if (!existing) {
                res.status(404).json({ error: 'Delivery not found' });
                return;
            }

            // SEC-AUDIT-2: IDOR Protection — enforce ownership for all roles.
            // Previously, only customers were checked. Drivers/carriers can now only
            // cancel deliveries they are assigned to.
            if (role === 'customer' && existing.customerId !== userId) {
                res.status(403).json({ error: 'Forbidden. You do not own this delivery.' });
                return;
            }

            if (role === 'driver' && existing.assignedDriverId !== userId) {
                res.status(403).json({ error: 'Forbidden. This delivery is not assigned to you.' });
                return;
            }

            if (role === 'carrier' && existing.assignedCarrierId !== userId) {
                res.status(403).json({ error: 'Forbidden. This delivery is not assigned to your fleet.' });
                return;
            }

            if (['DELIVERED', 'CANCELLED'].includes(existing.status)) {
                res.status(400).json({ error: 'Cannot cancel a completed or already cancelled delivery.' });
                return;
            }

            const updated = await prisma.job.update({
                where: { id: id as string },
                data: { status: 'CANCELLED' }
            });

            res.status(200).json({ data: updated });
        } catch (error) {
            console.error('[DeliveryController] Error cancelling delivery:', error);
            res.status(500).json({ error: 'Failed to cancel delivery.' });
        }
    }

    /**
     * PATCH /api/deliveries/:id
     * Allows updating job details. Restricted based on status.
     */
    static async updateDelivery(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;
            const updates = req.body;

            const existing = await prisma.job.findUnique({ where: { id: id as string } });
            if (!existing) {
                res.status(404).json({ error: 'Delivery not found.' });
                return;
            }

            // Ownership check
            if (role !== 'admin' && existing.customerId !== userId) {
                res.status(403).json({ error: 'Forbidden. You do not own this delivery.' });
                return;
            }

            // Status check - allow edits if not yet dispatched
            const editableStatuses = ['PENDING_PAYMENT', 'AWAITING_PAYMENT', 'PENDING_DISPATCH'];
            if (role !== 'admin' && !editableStatuses.includes(existing.status)) {
                res.status(400).json({ error: `Cannot edit delivery in status: ${existing.status}` });
                return;
            }

            // Shallow update of fields
            const allowedFields = [
                'pickupContactName', 'pickupContactPhone', 'pickupAddressLine1', 'pickupCity', 'pickupPostcode',
                'dropoffContactName', 'dropoffContactPhone', 'dropoffAddressLine1', 'dropoffCity', 'dropoffPostcode',
                'specialInstructions', 'goodsDescription', 'priority', 'jobType'
            ];

            const filteredUpdates: any = {};
            for (const key of allowedFields) {
                if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
            }

            const updated = await prisma.job.update({
                where: { id: id as string },
                data: filteredUpdates
            });

            res.status(200).json({ data: updated });
        } catch (error) {
            console.error('[DeliveryController] Error updating delivery:', error);
            res.status(500).json({ error: 'Failed to update delivery.' });
        }
    }

    // GET /api/deliveries/:id
    static async getDeliveryById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            const delivery = await prisma.job.findUnique({
                where: { id: id as string },
                include: { 
                    quoteRequest: { include: { lineItems: true } },
                    parcels: true 
                }
            });

            if (!delivery) {
                res.status(404).json({ error: 'Delivery not found.' });
                return;
            }

            // SEC-AUDIT-2: IDOR Protection
            if (role !== 'admin' && delivery.customerId !== userId) {
                res.status(403).json({ error: 'Forbidden. Access restricted to the owner.' });
                return;
            }

            res.status(200).json({ data: delivery });
        } catch (error) {
            console.error('[DeliveryController] Error fetching delivery by ID:', error);
            res.status(500).json({ error: 'Failed to retrieve delivery details.' });
        }
    }
}
