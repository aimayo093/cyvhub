const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVehicles() {
    try {
        const vehicles = await prisma.vehicleClass.findMany({
            include: { pricingRules: true }
        });
        console.log('--- VEHICLE CLASSES ---');
        console.log(JSON.stringify(vehicles, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkVehicles();
