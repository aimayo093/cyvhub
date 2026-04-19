import { PrismaClient } from '@prisma/client';
import { initialIndustries, initialIndustryDetails } from '../../../frontend/constants/cmsDefaults';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting CMS content migration...');

    try {
        console.log('Updating cms_industriesConfig...');
        await prisma.globalConfig.upsert({
            where: { key: 'cms_industriesConfig' },
            create: { key: 'cms_industriesConfig', config: initialIndustries as any },
            update: { config: initialIndustries as any, updatedAt: new Date() }
        });

        console.log('Updating cms_industryDetails...');
        await prisma.globalConfig.upsert({
            where: { key: 'cms_industryDetails' },
            create: { key: 'cms_industryDetails', config: initialIndustryDetails as any },
            update: { config: initialIndustryDetails as any, updatedAt: new Date() }
        });

        console.log('CMS Industry content successfully migrated to DB.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
