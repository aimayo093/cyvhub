import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdmin() {
    const email = 'admin@cyvhub.com';
    const rawPassword = 'Iyangbe@123';
    
    try {
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        
        const existing = await prisma.user.findUnique({ where: { email } });
        
        if (existing) {
            console.log(`User ${email} exists. Updating password and ensuring role is admin...`);
            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash,
                    role: 'admin',
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });
            console.log('Admin user updated successfully.');
        } else {
            console.log(`User ${email} does not exist. Creating...`);
            await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });
            console.log('Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error fixing admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdmin();
