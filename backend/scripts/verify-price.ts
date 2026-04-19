import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { PricingService } from '../services/pricing.service';
import { RoutingService } from '../services/routing.service';
import { AddressService } from '../services/address.service';

dotenv.config();

const prisma = new PrismaClient();

async function verify() {
    console.log('[VERIFY] Testing Neath SA11 2AY to Cardiff CF5 4TF...');

    try {
        // 1. Resolve Locations
        const pAddrs = await AddressService.findAddresses('SA11 2AY');
        const dAddrs = await AddressService.findAddresses('CF5 4TF');
        
        const p = { lat: pAddrs[0].latitude, lng: pAddrs[0].longitude };
        const d = { lat: dAddrs[0].latitude, lng: dAddrs[0].longitude };

        // 2. Routing
        const route = await RoutingService.calculateRoadRoute(p, d);
        console.log(`[VERIFY] Road Distance: ${route.distanceMiles} miles`);

        // 3. Pricing (Medium Van)
        // Find Medium Van id
        const vc = await (prisma as any).vehicleClass.findFirst({ where: { name: 'MEDIUM_VAN' } });
        if (!vc) throw new Error('Medium Van class not found');

        const quote = await PricingService.generateCustomerQuote(
            vc.id,
            route.distanceMiles,
            10, // 10kg
            {}, // flags
            1   // 1 parcel
        );

        console.log('[VERIFY] RESULTS:');
        console.log(JSON.stringify(quote, null, 2));

    } catch (e: any) {
        console.error('[VERIFY] ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
