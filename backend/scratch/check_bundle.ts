import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const config = await prisma.globalConfig.findUnique({
        where: { key: 'global_cms_bundle' }
    });
    
    if (!config) {
        console.log('No global_cms_bundle found!');
        return;
    }
    
    const data = config.config as any;
    const medical = data.industryDetails?.['medical-healthcare'];
    
    if (medical) {
        console.log('Medical Subtitle:', medical.subtitle);
        console.log('Medical Challenges Icon 0:', medical.challenges?.[0]?.icon);
        console.log('Medical Challenges Title 0:', medical.challenges?.[0]?.title);
    } else {
        console.log('Medical details not found in bundle.');
    }
}

check().finally(() => prisma.$disconnect());
