import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const config = await prisma.globalConfig.findUnique({
        where: { key: 'global_cms_bundle' }
    });
    console.log(JSON.stringify(config, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
