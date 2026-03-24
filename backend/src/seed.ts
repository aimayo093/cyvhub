import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Default password 'Password123!'
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
        {
            email: 'admin@cyvhub.com',
            firstName: 'System',
            lastName: 'Admin',
            role: 'admin',
        },
        {
            email: 'driver@cyvhub.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'driver',
        },
        {
            email: 'customer@cyvhub.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'customer',
        },
        {
            email: 'carrier@cyvhub.com',
            firstName: 'Global',
            lastName: 'Logistics',
            role: 'carrier',
        }
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                ...user,
                passwordHash,
            },
        });
        console.log(`Created/Ensured user: ${user.email}`);
    }

    // Seed mock Carriers
    const carrier = await prisma.carrierProfile.create({
        data: {
            companyName: 'Swift Transport Solutions',
            tradingName: 'Swift Logistics',
            contactFirstName: 'David',
            contactLastName: 'Miller',
            email: 'operations@swiftlogistics.co.uk',
            phone: '0800 123 4567',
            registrationNumber: 'GB12345678',
            vatNumber: 'GB 123 4567 89',
            insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
            operatorLicence: 'OL-987654321',
            operatorLicenceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            coverageRegions: JSON.stringify(['London', 'South East', 'Midlands']),
            status: 'APPROVED',
            totalJobsCompleted: 1450,
            slaScore: 98.5,
            rating: 4.8,
            vehicles: {
                create: [
                    {
                        registration: 'LD24 ABC',
                        type: 'Medium Van',
                        make: 'Ford',
                        model: 'Transit Custom',
                        year: 2024,
                        capacity: '1000kg',
                        motExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
                        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        lastService: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    },
                    {
                        registration: 'MA23 XYZ',
                        type: 'Luton Van',
                        make: 'Mercedes-Benz',
                        model: 'Sprinter',
                        year: 2023,
                        capacity: '1200kg / Tail Lift',
                        motExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
                        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        lastService: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    }
                ]
            },
            complianceDocs: {
                create: [
                    {
                        type: 'INSURANCE',
                        status: 'VALID',
                        documentUrl: 'https://example.com/insurance.pdf',
                        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                    },
                    {
                        type: 'LICENCE',
                        status: 'VALID',
                        documentUrl: 'https://example.com/licence.pdf',
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    }
                ]
            }
        }
    });

    console.log(`Seeded carrier profile: ${carrier.companyName}`);

    // Seed Business Account
    const business = await prisma.businessAccount.create({
        data: {
            tradingName: 'TechCorp Solutions',
            companyName: 'TechCorp Ltd',
            contactEmail: 'billing@techcorp.com',
            status: 'ACTIVE',
            billingTerms: 'Net 30',
            currentBalance: 1250.00
        }
    });

    // Link Jane Smith to this business
    const jane = await prisma.user.findUnique({ where: { email: 'customer@cyvhub.com' } });
    if (jane) {
        await prisma.user.update({
            where: { id: jane.id },
            data: { businessAccountId: business.id }
        });
    }

    // Seed some Jobs for invoicing
    await prisma.job.create({
        data: {
            jobNumber: 'JOB-9901',
            status: 'DELIVERED',
            priority: 'NORMAL',
            pickupContactName: 'Warehouse 1',
            pickupContactPhone: '0123456789',
            pickupAddressLine1: 'Swansea Industrial Estate',
            pickupCity: 'Swansea',
            pickupPostcode: 'SA1 1AA',
            pickupLatitude: 51.6214,
            pickupLongitude: -3.9436,
            pickupWindowStart: '09:00',
            pickupWindowEnd: '11:00',
            dropoffContactName: 'TechCorp HQ',
            dropoffContactPhone: '0987654321',
            dropoffAddressLine1: 'Cardiff Business Park',
            dropoffCity: 'Cardiff',
            dropoffPostcode: 'CF10 1AA',
            dropoffLatitude: 51.4816,
            dropoffLongitude: -3.1791,
            dropoffWindowStart: '13:00',
            dropoffWindowEnd: '15:00',
            vehicleType: 'Small Van',
            calculatedPrice: 85.00,
            customerId: jane?.id || 'placeholder',
            businessAccountId: business.id,
            completedAt: new Date()
        }
    });

    // Seed Invoices
    await prisma.invoice.create({
        data: {
            invoiceNumber: 'INV-2023-001',
            status: 'PENDING',
            amount: 1250.00,
            date: new Date(Date.now() - 86400000 * 5),
            dueDate: new Date(Date.now() + 86400000 * 25),
            businessAccountId: business.id,
            description: 'Monthly Logistics Retainer - October'
        }
    });

    // Seed Activity Logs
    await prisma.activityLog.createMany({
        data: [
            {
                type: 'delivery_created',
                title: 'New Delivery Created',
                message: 'Your delivery from Swansea to Cardiff is being processed.',
                severity: 'info',
                userId: jane?.id
            },
            {
                type: 'payment',
                title: 'Payment Received',
                message: 'Payment for INV-2023-002 has been confirmed.',
                severity: 'info',
                amount: 450.50,
                userId: jane?.id
            }
        ]
    });

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
