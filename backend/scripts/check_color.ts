import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const config = await prisma.globalConfig.findUnique({
        where: { key: 'global_cms_bundle' }
    });
    if (config && (config.config as any).serviceDetails) {
        const firstService = Object.values((config.config as any).serviceDetails)[0] as any;
        console.log('Accent Color in Supabase:', firstService.accentColor);
    } else {
        console.log('Config not found or invalid');
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
