
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const vc = await prisma.vehicleClass.findMany();
    console.log('Available Vehicles:', JSON.stringify(vc.map(v => ({ id: v.id, name: v.name, maxWeightKg: v.maxWeightKg })), null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
