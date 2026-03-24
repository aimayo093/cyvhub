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
                where: query,
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
                weightKg = 0, lengthCm = 0, widthCm = 0, heightCm = 0, isReturnTrip = false, extraStops = 0
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
            const distanceMiles = distanceKm ? parseFloat(distanceKm) / 1.60934 : 10.0; // Assume 10 miles minimum if unprovided
            
            const { CommercialService } = require('../services/commercial.service');
            const quoteResult = await CommercialService.requestQuote({
                pickupPostcode,
                dropoffPostcode,
                distanceMiles,
                items: [{ 
                    weightKg: parseFloat(weightKg), 
                    lengthCm: parseFloat(lengthCm), 
                    widthCm: parseFloat(widthCm), 
                    heightCm: parseFloat(heightCm) 
                }],
                flags: {
                    stairs: specialInstructions?.toLowerCase().includes('stairs'),
                    isReturnTrip: isReturnTrip === true || isReturnTrip === 'true',
                    extraStops: parseInt(extraStops, 10) || 0
                }
            });

            // HARD ENFORCEMENT: Reject immediately if load is overweight/unsuitable
            if (!quoteResult.approved) {
                 res.status(422).json({ 
                     error: 'Commercial Rules Engine Rejected Booking', 
                     reason: quoteResult.reason,
                     message: quoteResult.message 
                 });
                 return;
            }

            // Generate a random tracking number, CYV-TRK-XXXX
            const randomTrk = `CYV-TRK-${Math.floor(1000 + Math.random() * 9000)}`;

            const newDelivery = await prisma.job.create({
                data: {
                    customerId: userId,
                    jobNumber: `JOB-${Date.now()}`,
                    trackingNumber: randomTrk,
                    status: quoteResult.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'PENDING_DISPATCH', // Honor Margin Gates
                    paymentStatus: 'PENDING',
                    priority: priority || 'NORMAL',
                    pickupContactName, pickupContactPhone, pickupAddressLine1, pickupCity, pickupPostcode,
                    pickupLatitude: pickupLatitude ? parseFloat(pickupLatitude) : 0,
                    pickupLongitude: pickupLongitude ? parseFloat(pickupLongitude) : 0,
                    pickupWindowStart, pickupWindowEnd,
                    dropoffContactName, dropoffContactPhone, dropoffAddressLine1, dropoffCity, dropoffPostcode,
                    dropoffLatitude: dropoffLatitude ? parseFloat(dropoffLatitude) : 0,
                    dropoffLongitude: dropoffLongitude ? parseFloat(dropoffLongitude) : 0,
                    dropoffWindowStart, dropoffWindowEnd,
                    vehicleType, specialInstructions, goodsDescription,
                    calculatedPrice: quoteResult.quote.customerTotal, // Guaranteed pure by the core margin engine
                    distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
                    quoteRequestId: quoteResult.quote.id // Formal Linkage
                }
            });

            // ==========================================
            // NOTIFICATIONS
            // ==========================================
            try {
                const settings = await NotificationService.getSettings();
                if (settings.notifyOnJobCreated) {
                    const customer = await prisma.user.findUnique({ where: { id: userId } });
                    if (customer) {
                        if (customer.email) {
                            NotificationService.sendEmail(customer.email, 'Job Created Successfully', `<p>Your job <b>${newDelivery.jobNumber}</b> has been created and is pending dispatch.</p>`);
                        }
                        if (customer.phone) {
                            NotificationService.sendSms(customer.phone, `CYVhub: Your job ${newDelivery.jobNumber} has been created.`);
                        }
                    }
                }
            } catch (notifErr) {
                console.error('[DeliveryController] Failed to send creation notification:', notifErr);
            }

            res.status(201).json({ data: newDelivery, commercial_breakdown: quoteResult.quote });
        } catch (error) {
            console.error('[DeliveryController] Error creating delivery:', error);
            res.status(500).json({ error: 'Failed to create delivery.' });
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

}
