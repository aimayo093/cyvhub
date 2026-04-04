const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await Promise.all([
    prisma.vehicleClass.count(),
    prisma.pricingRule.count(),
    prisma.jobCounter.count(),
    prisma.notificationSettings.count()
  ]);

  console.log('--- DB Counts ---');
  console.log('VehicleClass:', counts[0]);
  console.log('PricingRule:', counts[1]);
  console.log('JobCounter:', counts[2]);
  console.log('NotificationSettings:', counts[3]);

  const vehicles = await prisma.vehicleClass.findMany({
    include: { pricingRules: true }
  });
  console.log('\n--- Vehicle Configuration ---');
  console.log(JSON.stringify(vehicles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
