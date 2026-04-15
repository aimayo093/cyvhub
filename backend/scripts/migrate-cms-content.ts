/**
 * migrate-cms-content.ts
 * 
 * This script migrates the legacy 'global_cms_bundle' data from GlobalConfig 
 * into the new granular CMSPage and CMSSection models.
 * 
 * Workflow:
 * 1. Fetch current global_cms_bundle
 * 2. Create 'homepage' CMSPage if it doesn't exist
 * 3. Map homepageData keys to CMSSections
 * 4. Map header and footer keys to GlobalConfig (legacy compatible) OR new sections
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting CMS Content Migration...');

    try {
        // 1. Fetch current config
        const globalBundle = await prisma.globalConfig.findUnique({
            where: { key: 'global_cms_bundle' }
        });

        if (!globalBundle) {
            console.error('❌ Error: global_cms_bundle not found in GlobalConfig table.');
            return;
        }

        const data = (globalBundle.config as any);
        const homepageData = data.homepageData || {};

        // 2. Ensure Homepage exists in CMSPage
        let homepage = await prisma.cMSPage.findUnique({
            where: { slug: 'homepage' }
        });

        if (!homepage) {
            console.log('📄 Creating "homepage" CMSPage...');
            homepage = await prisma.cMSPage.create({
                data: {
                    title: 'Home',
                    slug: 'homepage',
                    status: 'PUBLISHED'
                }
            });
        }

        // 3. Map homepage sections
        // Keys in bundle: cms_heroConfig, cms_slidesConfig, etc.
        const sectionMap: Record<string, string> = {
            'cms_heroConfig': 'hero',
            'cms_slidesConfig': 'slider',
            'cms_howItWorksConfig': 'howItWorks',
            'cms_whyUsConfig': 'whyUs',
            'cms_servicesConfig': 'services',
            'cms_statsConfig': 'stats',
            'cms_industriesConfig': 'industries',
            'cms_testimonialsConfig': 'testimonials',
            'cms_ctaConfig': 'cta',
            'cms_customSections': 'custom'
        };

        let order = 10;
        for (const [bundleKey, sectionType] of Object.entries(sectionMap)) {
            const content = homepageData[bundleKey];
            if (content) {
                console.log(`🧩 Migrating section: ${sectionType}...`);
                await prisma.cMSSection.upsert({
                   where: { 
                       pageId_type: { 
                           pageId: homepage.id, 
                           type: sectionType 
                       } 
                   },
                   update: {
                       content: content,
                       order: order
                   },
                   create: {
                       pageId: homepage.id,
                       type: sectionType,
                       content: content,
                       order: order
                   }
                });
                order += 10;
            }
        }

        console.log('✅ Homepage migration complete.');

        // 4. (Optional) Check for other pages if they exist in the bundle
        // industryDetails, serviceDetails, etc. could also be migrated to CMSPage records later.
        
        console.log('🏁 Migration finished successfully.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
