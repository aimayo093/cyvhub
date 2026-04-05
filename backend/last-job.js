
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const lastJob = await prisma.job.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Last Job:', lastJob ? { id: lastJob.id, jobNumber: lastJob.jobNumber, createdAt: lastJob.createdAt } : 'None');
    
    if (lastJob) {
      const count = await prisma.job.count();
      console.log('Total Jobs:', count);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
