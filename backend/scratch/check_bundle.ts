import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const bundle = await prisma.globalConfig.findUnique({
    where: { key: 'global_cms_bundle' }
  });
  
  if (!bundle) {
    console.log('No bundle found');
    return;
  }
  
  const config = bundle.config as any;
  const medical = config.industryDetails['medical-healthcare'];
  console.log('Medical Layout Theme:', medical?.layoutTheme);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
