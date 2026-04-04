const { SuitabilityService } = require('./src/services/suitability.service');
const { PricingService } = require('./src/services/pricing.service');
const { prisma } = require('./src/index');

async function testSuitability() {
    console.log('--- Testing Suitability Engine ---');
    
    // Test Case 1: Standard small parcel (Fits everything)
    const items1 = [{ lengthCm: 30, widthCm: 30, heightCm: 30, weightKg: 5, quantity: 1 }];
    const res1 = await SuitabilityService.findSuitableVehicles(items1, 5, 5);
    console.log('Case 1 (Small):', res1.available.map(v => v.name), 'Rejected:', res1.rejected.length);

    // Test Case 2: Long item (Fits only Large Van)
    const items2 = [{ lengthCm: 250, widthCm: 30, heightCm: 30, weightKg: 10, quantity: 1 }];
    const res2 = await SuitabilityService.findSuitableVehicles(items2, 10, 10);
    console.log('Case 2 (Long):', res2.available.map(v => v.name));
    console.log('Case 2 Rejected Reasons:', res2.rejected.map(r => `${r.name}: ${r.reason}`));

    // Test Case 3: Heavy items (Fits only Large Van)
    const items3 = [{ lengthCm: 50, widthCm: 50, heightCm: 50, weightKg: 300, quantity: 3 }]; // 900kg
    const res3 = await SuitabilityService.findSuitableVehicles(items3, 900, 900);
    console.log('Case 3 (Heavy):', res3.available.map(v => v.name));
    console.log('Case 3 Rejected Reasons:', res3.rejected.map(r => `${r.name}: ${r.reason}`));

    // Test Case 4: Oversized (Fits nothing)
    const items4 = [{ lengthCm: 500, widthCm: 50, heightCm: 50, weightKg: 10, quantity: 1 }];
    const res4 = await SuitabilityService.findSuitableVehicles(items4, 10, 10);
    console.log('Case 4 (Impossible):', res4.available.map(v => v.name));
    console.log('Case 4 Rejected Reasons:', res4.rejected.map(r => `${r.name}: ${r.reason}`));
}

testSuitability().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
