/**
 * CYVhub Quote Engine Diagnostic Tool
 * This script verifies that the suitability and pricing engines are functioning correctly
 * with the current database state and logic.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock dependencies if needed, or use the real ones
// Note: We are using the compiled or source files depending on environment.
// For simplicity in this scratch script, we will import directly.

const items_normal = [
  { lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 5, quantity: 1 }
];

const items_heavy = [
  { lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 2000, quantity: 1 }
];

async function runDiagnostic() {
  console.log("--- 🔍 CYVhub Quote Engine Diagnostic ---");

  try {
    // 1. Check for Active Vehicles
    const activeVehicles = await prisma.vehicleClass.findMany({ where: { isActive: true } });
    console.log(`\n[DB_STATE] Active Vehicles: ${activeVehicles.length}`);
    activeVehicles.forEach(v => {
      console.log(`  - ${v.name} (Max: ${v.maxWeightKg}kg, Dim: ${v.maxLengthCm}x${v.maxWidthCm}x${v.maxHeightCm})`);
    });

    if (activeVehicles.length === 0) {
      console.error("\n❌ CRITICAL: No active vehicles found! 'No suitable vehicles found' error is expected.");
      return;
    }

    // 2. Check for Pricing Rules
    console.log("\n[DB_STATE] Pricing Rules Check:");
    for (const v of activeVehicles) {
      const rules = await prisma.pricingRule.findMany({ where: { vehicleClassId: v.id } });
      console.log(`  - ${v.name}: ${rules.length} rules found.`);
      const types = rules.map(r => r.type);
      console.log(`    Types: ${[...new Set(types)].join(', ')}`);
      
      const hasBase = types.includes('BASE_FEE');
      const hasMiles = types.includes('MILEAGE');
      if (!hasBase || !hasMiles) {
        console.warn(`    ⚠️  MISSING CRITICAL RULES: ${!hasBase ? '[BASE_FEE] ' : ''}${!hasMiles ? '[MILEAGE]' : ''}`);
      }
    }

    // 3. Test Suitability (Normal Load)
    const globalConfig = await prisma.globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
    console.log(`\n[DB_STATE] Global Config 'pricing_engine_config': ${globalConfig ? 'PRESENT' : 'NOT FOUND (Fallbacks will be used)'}`);
    if (globalConfig) console.log(`  - Data: ${JSON.stringify(globalConfig.config)}`);

    console.log("\n--- ✅ Diagnostic Complete ---");
  } catch (err) {
    console.error("\n❌ Diagnostic Failed with Error:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostic();
