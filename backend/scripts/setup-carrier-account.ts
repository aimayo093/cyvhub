import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'amstillthe1@gmail.com';
    console.log(`--- SETTING UP CARRIER ACCOUNT FOR ${email} ---`);

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`User ${email} not found.`);
        return;
    }

    // 2. Create the Carrier Profile
    console.log('Creating Carrier Profile...');
    const profile = await prisma.carrierProfile.create({
        data: {
            companyName: 'CYVhub Logistics',
            tradingName: 'CYVhub Logistics',
            contactFirstName: 'Carrier',
            contactLastName: 'User',
            email: email,
            phone: '0123456789',
            registrationNumber: 'CYV-REG-001',
            status: 'APPROVED',
            insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            operatorLicence: 'OP-LIC-001',
            operatorLicenceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            coverageRegions: JSON.stringify(['London', 'Manchester', 'Birmingham'])
        }
    });

    // 3. Link User to Profile
    console.log('Linking User to Profile...');
    await prisma.user.update({
        where: { id: user.id },
        data: { carrierProfileId: profile.id }
    });

    // 4. Create a dummy vehicle
    console.log('Adding dummy vehicle to fleet...');
    await prisma.fleetVehicle.create({
        data: {
            registration: 'LA21 CYV',
            type: 'VAN',
            make: 'Mercedes',
            model: 'Sprinter',
            year: 2021,
            capacity: '1500kg',
            motExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            lastService: new Date(),
            carrierId: profile.id,
            status: 'ACTIVE'
        }
    });

    console.log('--- SETUP COMPLETE ---');
    console.log(`User ${email} is now linked to Carrier Profile: ${profile.id}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
