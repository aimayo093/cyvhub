const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedVehicles() {
  const vehicles = [
    {
      name: 'CAR',
      maxWeightKg: 80,
      maxLengthCm: 100,
      maxWidthCm: 80,
      maxHeightCm: 60,
      baseFee: 25,
      mileageRate: 1.0,
      driverPickupFee: 15,
      driverMileageRate: 0.7
    },
    {
      name: 'SMALL_VAN',
      maxWeightKg: 600,
      maxLengthCm: 170,
      maxWidthCm: 140,
      maxHeightCm: 120,
      baseFee: 35,
      mileageRate: 1.25,
      driverPickupFee: 20,
      driverMileageRate: 0.85
    },
    {
      name: 'MEDIUM_VAN',
      maxWeightKg: 900,
      maxLengthCm: 240,
      maxWidthCm: 170,
      maxHeightCm: 140,
      baseFee: 45,
      mileageRate: 1.45,
      driverPickupFee: 25,
      driverMileageRate: 1.0
    },
    {
      name: 'LARGE_VAN',
      maxWeightKg: 1200,
      maxLengthCm: 340,
      maxWidthCm: 170,
      maxHeightCm: 170,
      baseFee: 65,
      mileageRate: 1.75,
      driverPickupFee: 35,
      driverMileageRate: 1.25
    },
    {
      name: 'LUTON_VAN',
      maxWeightKg: 1000,
      maxLengthCm: 400,
      maxWidthCm: 200,
      maxHeightCm: 220,
      baseFee: 85,
      mileageRate: 2.10,
      driverPickupFee: 45,
      driverMileageRate: 1.50
    }
  ];

  console.log('--- SEEDING VEHICLE CLASSES ---');
  for (const v of vehicles) {
    const record = await prisma.vehicleClass.upsert({
      where: { name: v.name },
      update: {
        maxWeightKg: v.maxWeightKg,
        maxLengthCm: v.maxLengthCm,
        maxWidthCm: v.maxWidthCm,
        maxHeightCm: v.maxHeightCm,
        baseFee: v.baseFee,
        mileageRate: v.mileageRate,
        driverPickupFee: v.driverPickupFee,
        driverMileageRate: v.driverMileageRate,
        isActive: true
      },
      create: {
        ...v,
        isActive: true
      }
    });
    console.log(`✅ Upserted ${record.name} (ID: ${record.id})`);
    
    // Add default pricing rules if none exist
    const rulesCount = await prisma.pricingRule.count({ where: { vehicleClassId: record.id } });
    if (rulesCount === 0) {
        await prisma.pricingRule.createMany({
            data: [
                { name: 'Base Pickup Fee', vehicleClassId: record.id, type: 'BASE_FEE', amount: v.baseFee },
                { name: 'Standard Mileage Rate', vehicleClassId: record.id, type: 'MILEAGE', amount: v.mileageRate }
            ]
        });
        console.log(`   + Created default pricing rules for ${record.name}`);
    }
  }
}

seedVehicles()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
