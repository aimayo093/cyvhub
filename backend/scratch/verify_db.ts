const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const config = await prisma.globalConfig.findUnique({ where: { key: 'global_cms_bundle' } });
    if (!config) {
        console.log('No global_cms_bundle found');
        return;
    }
    const data = config.config;
    console.log('--- Industry Slugs ---');
    console.log(Object.keys(data.industryDetails || {}));
    console.log('--- Service Slugs ---');
    console.log(Object.keys(data.serviceDetails || {}));
    
    // Check one industry for premium content
    const firstInd = Object.values(data.industryDetails || {})[0] as any;
    console.log('--- Sample Industry Content (Medical) ---');
    console.log({
        slug: firstInd?.slug,
        title: firstInd?.title,
        subtitle: firstInd?.subtitle,
        accentColor: firstInd?.accentColor,
        challengesCount: firstInd?.challenges?.length,
        featuresCount: firstInd?.features?.length
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
