
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking JobCounter table...');
    const counter = await prisma.jobCounter.findFirst();
    console.log('JobCounter exists:', counter);

    console.log('Checking VehicleClass table...');
    const vcCount = await prisma.vehicleClass.count();
    console.log('VehicleClass count:', vcCount);
    
    console.log('Checking QuoteRequest table...');
    const qrCount = await prisma.quoteRequest.count();
    console.log('QuoteRequest count:', qrCount);
  } catch (error) {
    console.error('Database connection or schema error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
