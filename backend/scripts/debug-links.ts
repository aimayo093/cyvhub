import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- FETCHING RECENT USERS ---');
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            role: true,
            carrierProfileId: true
        }
    });
    console.table(users);

    console.log('--- RECENT CARRIER PROFILES ---');
    const profiles = await prisma.carrierProfile.findMany({
        take: 10,
        select: {
            id: true,
            companyName: true,
            email: true
        }
    });
    console.table(profiles);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
