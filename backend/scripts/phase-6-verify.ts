import { prisma } from '../index';
import { CommercialService } from '../services/commercial.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTests() {
    console.log('--- UK LOGISTICS ENGINE: PHASE 6 VERIFICATION ---');

    try {
        // Mock Coords for Neath -> Cardiff
        const pNeath = { lat: 51.6631, lng: -3.8058 };
        const dCardiff = { lat: 51.4813, lng: -3.2323 };

        // Mock Coords for London -> Highlands (Approximation)
        const pLondon = { lat: 51.5074, lng: -0.1278 };
        const dHighlands = { lat: 57.4778, lng: -4.2247 }; // Inverness IV1

        // 1. NEATH -> CARDIFF (Medium Van)
        console.log('\n[TEST 1] Neath SA11 2AY -> Cardiff CF5 4TF (Medium Van)');
        const test1 = await CommercialService.requestQuote({
            pickupPostcode: 'SA11 2AY',
            dropoffPostcode: 'CF5 4TF',
            pickupCoords: pNeath,
            dropoffCoords: dCardiff,
            items: [{ weightKg: 50, lengthCm: 100, widthCm: 100, heightCm: 100, quantity: 1 }],
            flags: {},
            vehicleType: 'MEDIUM_VAN'
        });
        
        if (test1.approved && test1.metrics && test1.quote) {
            console.log(`- Status: ${test1.status}`);
            console.log(`- Distance: ${test1.metrics.distanceMiles} miles`);
            console.log(`- Total (Inc VAT): £${test1.metrics.totalIncVat}`);
            console.log(`- Remote Surcharge: ${test1.metrics.isRemote ? 'YES' : 'NO'}`);
        } else {
            console.log(`- Test 1 Failed: ${test1.message || 'Unknown Error'}`);
        }

        // 2. REMOTE SURCHARGE (Inverness IV)
        console.log('\n[TEST 2] London EC1A 1BB -> Inverness IV1 1AA (Small Van)');
        const test2 = await CommercialService.requestQuote({
            pickupPostcode: 'EC1A 1BB',
            dropoffPostcode: 'IV1 1AA',
            pickupCoords: pLondon,
            dropoffCoords: dHighlands,
            items: [{ weightKg: 5, lengthCm: 20, widthCm: 20, heightCm: 20, quantity: 1 }],
            flags: {},
            vehicleType: 'SMALL_VAN'
        });
        if (test2.approved && test2.metrics) {
            console.log(`- Status: ${test2.status}`);
            console.log(`- Distance: ${test2.metrics.distanceMiles} miles`);
            console.log(`- Total (Inc VAT): £${test2.metrics.totalIncVat}`);
            console.log(`- Remote Surcharge Applied: ${test2.metrics.isRemote ? 'YES' : 'NO'}`);
        } else {
            console.log(`- Test 2 Failed: ${test2.message || 'Unknown Error'}`);
        }

        // 3. BULK HANDLING (1 vs 11 parcels)
        console.log('\n[TEST 3] Bulk Handling Check (1 vs 11 parcels)');
        const resSingle = await CommercialService.requestQuote({
            pickupPostcode: 'EC1A 1BB',
            dropoffPostcode: 'EC2A 2BB',
            pickupCoords: pLondon,
            dropoffCoords: pLondon, // Short hop
            items: [{ weightKg: 1, lengthCm: 10, widthCm: 10, heightCm: 10, quantity: 1 }],
            flags: {},
            vehicleType: 'SMALL_VAN'
        });
        const resBulk = await CommercialService.requestQuote({
            pickupPostcode: 'EC1A 1BB',
            dropoffPostcode: 'EC2A 2BB',
            pickupCoords: pLondon,
            dropoffCoords: pLondon,
            items: [{ weightKg: 1, lengthCm: 10, widthCm: 10, heightCm: 10, quantity: 11 }],
            flags: {},
            vehicleType: 'SMALL_VAN'
        });
        
        if (resSingle.approved && resSingle.metrics && resBulk.approved && resBulk.metrics) {
            console.log(`- Single Parcel: £${resSingle.metrics.totalIncVat}`);
            console.log(`- 11 Parcels (Bulk): £${resBulk.metrics.totalIncVat}`);
            const priceDiff = resBulk.metrics.totalIncVat - resSingle.metrics.totalIncVat;
            console.log(`- Handling Fee Delta: £${priceDiff.toFixed(2)} (Includes VAT)`);
        } else {
            console.log('- Test 3 Failed');
        }

        console.log('\nVERIFICATION COMPLETE');
    } catch (e: any) {
        console.error('TEST FAIL:', e.message);
    } finally {
        process.exit(0);
    }
}

runTests();
