import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const config = await prisma.globalConfig.findUnique({
        where: { key: 'about_page' }
    });
    console.log('About Page in Supabase:', JSON.stringify(config?.config, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
