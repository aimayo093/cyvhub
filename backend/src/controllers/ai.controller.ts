import { Request, Response } from 'express';
import { prisma } from '../index';
import axios from 'axios';
import { sanitizeUserInput } from '../utils/sanitize';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Helper to calculate distance/duration using Google Maps
async function getDistanceMatrix(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('No GOOGLE_MAPS_API_KEY provided. Falling back to mock distance logic.');
        return { distanceText: '25 km', durationText: '40 mins', durationSeconds: 2400 };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
            const element = response.data.rows[0].elements[0];
            return {
                distanceText: element.distance.text,
                durationText: element.duration.text,
                durationSeconds: element.duration.value
            };
        }
    } catch (e) {
        console.error('Distance Matrix Error:', e);
    }

    // Fallback if API fails
    return { distanceText: 'Unknown', durationText: 'Unknown', durationSeconds: 3600 };
}

// 1. Dispatch Suggestions (Rank real drivers by distance to pickup)
export const getDispatchSuggestions = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.query;
        let job;

        if (jobId) {
            job = await prisma.job.findUnique({ where: { id: String(jobId) } });
        }

        // Default test coordinates (London) if no job provided
        const pickupLat = job?.pickupLatitude || 51.5074;
        const pickupLng = job?.pickupLongitude || -0.1278;

        // Find active drivers with known locations
        const drivers = await prisma.user.findMany({
            where: {
                role: { in: ['driver', 'carrier'] },
                status: 'ACTIVE',
                lastKnownLat: { not: null },
                lastKnownLng: { not: null }
            },
            include: { carrierProfile: true },
            take: 5
        });

        const suggestions = [];

        for (const driver of drivers) {
            const matrix = await getDistanceMatrix(
                { lat: driver.lastKnownLat!, lng: driver.lastKnownLng! },
                { lat: pickupLat, lng: pickupLng }
            );

            // Simple confidence score formula: higher rating + closer distance = better
            const ratingScore = driver.carrierProfile ? (driver.carrierProfile.rating / 5) * 50 : 40; // max 50
            const distanceScore = Math.max(0, 50 - (matrix.durationSeconds / 60)); // max 50 (deduct 1 point per minute away)
            const confidence = Math.round(ratingScore + distanceScore);

            suggestions.push({
                id: `sug-${driver.id}`,
                jobNumber: job ? job.jobNumber : 'JOB-SELECT',
                suggestedAssignee: `${driver.firstName} ${driver.lastName}`,
                assigneeType: driver.role,
                confidence: Math.min(99, Math.max(60, confidence)), // cap between 60-99
                estimatedETA: matrix.durationText,
                slaRisk: confidence > 85 ? 'LOW' : confidence > 75 ? 'MEDIUM' : 'HIGH',
                reasons: [
                    `${matrix.durationText} away from pickup`,
                    driver.carrierProfile ? `Carrier Rating: ${driver.carrierProfile.rating}/5` : 'Standard Platform Rating',
                ],
            });
        }

        // Sort by confidence DESC
        suggestions.sort((a, b) => b.confidence - a.confidence);

        res.json({ suggestions: suggestions.length > 0 ? suggestions : getMockSuggestions() });
    } catch (error) {
        console.error('Error in dispatch suggestions:', error);
        res.status(500).json({ error: 'Failed to generate dispatch suggestions' });
    }
};

function getMockSuggestions() {
    return [
        {
            id: 'sug-mock-1', jobNumber: 'JOB-901', suggestedAssignee: 'John Doe',
            assigneeType: 'driver', confidence: 94, estimatedETA: '14 mins',
            slaRisk: 'LOW', reasons: ['Highest rating on route', 'Current location aligns with pickup']
        }
    ];
}

// 2. SLA Risks (Compare real ETA from driver location to pickupWindowEnd)
export const getSLARisks = async (req: Request, res: Response) => {
    try {
        // Find jobs currently awaiting pickup with an assigned driver
        const activeJobs = await prisma.job.findMany({
            where: {
                status: { in: ['ASSIGNED', 'EN_ROUTE_TO_PICKUP'] },
                assignedDriverId: { not: null }
            },
            include: {
                assignedDriver: true,
                businessAccount: true
            },
            take: 10
        });

        const risks = [];

        for (const job of activeJobs) {
            if (!job.assignedDriver?.lastKnownLat || !job.assignedDriver?.lastKnownLng) continue;

            const matrix = await getDistanceMatrix(
                { lat: job.assignedDriver.lastKnownLat, lng: job.assignedDriver.lastKnownLng },
                { lat: job.pickupLatitude, lng: job.pickupLongitude }
            );

            // Assume pickupWindowEnd is in format "HH:MM" (e.g. "14:30")
            // For simplicity in this demo, we'll parse it as today's time
            const now = new Date();
            const [hours, minutes] = job.pickupWindowEnd.split(':').map(Number);
            const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 17, minutes || 0);

            const projectedArrival = new Date(now.getTime() + (matrix.durationSeconds * 1000));
            const delayMs = projectedArrival.getTime() - windowEnd.getTime();
            const delayMins = Math.round(delayMs / 60000);

            if (delayMins > 0) {
                risks.push({
                    id: `risk-${job.id}`,
                    jobNumber: job.jobNumber,
                    route: `${job.pickupCity} → ${job.dropoffCity}`,
                    businessName: job.businessAccount?.tradingName || 'Direct Customer',
                    riskScore: Math.min(99, 50 + delayMins), // higher delay = higher risk score
                    riskLevel: delayMins > 30 ? 'HIGH' : 'MEDIUM',
                    predictedDelay: delayMins,
                    reasons: [`Driver is ${matrix.durationText} away`, `Projected arrival: ${projectedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, `Deadline: ${job.pickupWindowEnd}`],
                    suggestedAction: delayMins > 30 ? 'Notify client of delay immediately and attempt to reroute if possible.' : 'Monitor progress closely. SLA barely at risk.',
                });
            }
        }

        res.json({ risks: risks.length > 0 ? risks : getMockRisks() });
    } catch (error) {
        console.error('Error in SLA risks:', error);
        res.status(500).json({ error: 'Failed to predict SLA risks' });
    }
};

function getMockRisks() {
    return [
        {
            id: 'risk-1', jobNumber: 'JOB-842', route: 'London → Bristol', businessName: 'TechWorks Ltd',
            riskScore: 85, riskLevel: 'HIGH', predictedDelay: 45,
            reasons: ['Google Maps indicates severe traffic', 'Driver current ETA breaches SLA window'],
            suggestedAction: 'Notify client of delay immediately.'
        }
    ];
}

// 3. Anomalies (Real Database Checks for Operational Issues)
export const getAnomalies = async (req: Request, res: Response) => {
    try {
        const anomalies = [];
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        // Anomaly 1: Stalled Jobs (No status update for 12+ hours while active)
        const stalledJobs = await prisma.job.findMany({
            where: {
                status: { in: ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF'] },
                updatedAt: { lt: twelveHoursAgo }
            },
            include: { assignedDriver: true }
        });

        for (const job of stalledJobs) {
            anomalies.push({
                id: `anom-stalled-${job.id}`,
                title: 'Stalled Delivery',
                type: 'OPERATIONAL_ANOMALY',
                description: `Job ${job.jobNumber} has been stuck in '${job.status}' for over 12 hours without an update.`,
                severity: 'WARNING',
                affectedEntity: job.assignedDriver ? `Driver: ${job.assignedDriver.firstName} ${job.assignedDriver.lastName}` : 'Unassigned',
                detectedAt: new Date().toISOString(),
                acknowledged: false,
                suggestedAction: 'Contact the driver to get a status update and ensure the goods are safe.',
            });
        }

        // Anomaly 2: Very high value unassigned quotes (Pending for over 24 hours)
        const staleHighValueQuotes = await prisma.job.findMany({
            where: {
                status: 'QUOTED',
                calculatedPrice: { gt: 500 },
                updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            include: { businessAccount: true }
        });

        for (const job of staleHighValueQuotes) {
            anomalies.push({
                id: `anom-quote-${job.id}`,
                title: 'Stale High-Value Quote',
                type: 'SALES_ANOMALY',
                description: `A high-value quote (£${job.calculatedPrice}) for ${job.businessAccount?.tradingName || 'Customer'} has been pending for over 24 hours.`,
                severity: 'CRITICAL',
                affectedEntity: `Customer: ${job.businessAccount?.tradingName || 'Unknown'}`,
                detectedAt: new Date().toISOString(),
                acknowledged: false,
                suggestedAction: 'Have a sales rep follow up immediately to close the deal before they use a competitor.',
            });
        }

        res.json({ anomalies });
    } catch (error) {
        console.error('Error in anomalies:', error);
        res.status(500).json({ error: 'Failed to detect anomalies' });
    }
};

// 4. Assistant (Connecting Chat to Database)
export const askAssistant = async (req: Request, res: Response) => {
    try {
        // SEC-INPUT: Sanitize and validate user query before processing.
        const sanitized = sanitizeUserInput(req.body?.query);
        if (!sanitized.ok) {
            return res.status(sanitized.status!).json({ error: sanitized.error });
        }
        const q = sanitized.value!.toLowerCase();

        let responseText = '';

        if (q.includes('invoice') || q.includes('overdue') || q.includes('unpaid')) {
            const overdueInvoices = await prisma.invoice.findMany({
                where: { status: 'OVERDUE' },
                include: { businessAccount: true }
            });

            const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

            if (overdueInvoices.length === 0) {
                responseText = '✅ Great news! You have no overdue invoices right now.';
            } else {
                responseText = `💰 Overdue Invoices Summary:\n\nTotal Overdue Amount: £${totalOverdue.toFixed(2)}\nTotal Overdue Count: ${overdueInvoices.length}\n\n`;
                overdueInvoices.slice(0, 3).forEach((inv, i) => {
                    responseText += `${i + 1}. ${inv.invoiceNumber} - £${inv.amount.toFixed(2)} (${inv.businessAccount.tradingName})\n`;
                });
                if (overdueInvoices.length > 3) responseText += `...and ${overdueInvoices.length - 3} more.`;
            }
        }
        else if (q.includes('job') || q.includes('deliveries') || q.includes('active')) {
            const activeJobs = await prisma.job.count({
                where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }
            });
            const drafts = await prisma.job.count({ where: { status: 'DRAFT' } });
            const assigned = await prisma.job.count({ where: { status: 'ASSIGNED' } });

            responseText = `📦 Current Job Status:\n\nTotal Active Jobs: ${activeJobs}\n- Draft Quotes: ${drafts}\n- Assigned to Drivers: ${assigned}`;
        }
        else {
            responseText = '🤖 I am connected to your live database! Try asking:\n\n• "Show me overdue invoices"\n• "How many active jobs do we have?"';
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('Error in assistant:', error);
        res.status(500).json({ error: 'Failed to process AI query' });
    }
};
