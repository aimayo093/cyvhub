/**
 * CYVhub Production Recovery & Integrity Script
 * 
 * Performs Section D tasks:
 * 1. Verifies/Creates Admin User (admin@cyvhub.com)
 * 2. Forces Admin status to ACTIVE and emailVerified to true
 * 3. Verifies/Ensures core Vehicle Classes exist
 * 4. Verifies/Ensures core Pricing Rules exist
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function recover() {
    console.log('--- 🚀 Starting Production Recovery Script ---');

    try {
        // 1. Recover Admin Account
        const adminEmail = 'admin@cyvhub.com';
        const passwordHash = await bcrypt.hash('Password123!', 10);

        console.log(`[AUTH] Checking admin account: ${adminEmail}`);
        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                status: 'ACTIVE',
                emailVerified: true,
                role: 'admin'
            },
            create: {
                email: adminEmail,
                firstName: 'System',
                lastName: 'Admin',
                passwordHash: passwordHash,
                role: 'admin',
                status: 'ACTIVE',
                emailVerified: true
            }
        });
        console.log(`✅ Admin account secured: ${admin.id} (Status: ACTIVE, Verified: true)`);

        // 2. Ensure Vehicle Classes and Pricing Rules
        const vehicleClasses = [
            { 
                name: 'SMALL_VAN', 
                maxWeight: 400.0, 
                maxLength: 100, 
                maxWidth: 120, 
                maxHeight: 100, 
                baseFee: 35.00, 
                mileage: 1.25 
            },
            { 
                name: 'MEDIUM_VAN', 
                maxWeight: 800.0, 
                maxLength: 200, 
                maxWidth: 120, 
                maxHeight: 100, 
                baseFee: 45.00, 
                mileage: 1.45 
            },
            { 
                name: 'LARGE_VAN', 
                maxWeight: 1100.0, 
                maxLength: 300, 
                maxWidth: 120, 
                maxHeight: 170, 
                baseFee: 65.00, 
                mileage: 1.75 
            }
        ];

        for (const vc of vehicleClasses) {
            console.log(`[DATA] Ensuring Vehicle Class: ${vc.name}`);
            const record = await (prisma as any).vehicleClass.upsert({
                where: { name: vc.name },
                update: {
                    maxWeightKg: vc.maxWeight,
                    maxLengthCm: vc.maxLength,
                    maxWidthCm: vc.maxWidth,
                    maxHeightCm: vc.maxHeight,
                    baseFee: vc.baseFee,
                    mileageRate: vc.mileage,
                    isActive: true
                },
                create: {
                    name: vc.name,
                    maxWeightKg: vc.maxWeight,
                    maxLengthCm: vc.maxLength,
                    maxWidthCm: vc.maxWidth,
                    maxHeightCm: vc.maxHeight,
                    baseFee: vc.baseFee,
                    mileageRate: vc.mileage,
                    isActive: true,
                    pricingRules: {
                        create: [
                            { name: 'Base Pickup Fee', type: 'BASE_FEE', amount: vc.baseFee },
                            { name: 'Standard Mileage Rate', type: 'MILEAGE', amount: vc.mileage }
                        ]
                    }
                }
            });
            console.log(`✅ Vehicle Class ${vc.name} synced.`);
        }

        console.log('--- ✨ Recovery Script Completed Successfully ---');
    } catch (error) {
        console.error('❌ FATAL RECOVERY ERROR:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

recover();
