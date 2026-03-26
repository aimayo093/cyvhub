import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@cyvhub.com' } });
    console.log('User found:', !!user);
    if (!user) return;
    
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('EmailVerified:', user.emailVerified);
    
    const isValid = await bcrypt.compare('lyangbe@123', user.passwordHash);
    console.log('Password compares true?:', isValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
