import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log("Seeding commercial engine data...");

        const smallVan = await prisma.vehicleClass.create({
            data: {
                name: 'Small Van',
                maxWeightKg: 400,
                maxLengthCm: 150,
                maxWidthCm: 120,
                maxHeightCm: 120,
                baseFee: 30.0,
                mileageRate: 1.20,
                driverPickupFee: 20.0,
                driverMileageRate: 0.85
            }
        });

        await prisma.pricingRule.create({
            data: {
                name: 'Heavy Item Surcharge',
                vehicleClassId: smallVan.id,
                type: 'WEIGHT_SURCHARGE',
                conditionMin: 100,
                conditionMax: 400,
                amount: 25.0,
                isPercentage: false
            }
        });

        await prisma.payoutRule.create({
            data: {
                name: 'Heavy Item Bonus',
                vehicleClassId: smallVan.id,
                type: 'WEIGHT_BONUS',
                conditionMin: 100,
                conditionMax: 400,
                amount: 15.0,
                isPercentage: false
            }
        });

        console.log("Seed complete. Small Van ID:", smallVan.id);
    } catch(err) {
        console.error("Seeding failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
