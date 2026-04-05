/**
 * CYVhub Admin Account Fixer
 * This script ensures the system admin account is ACTIVE and emailVerified.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  const adminEmail = 'admin@cyvhub.com';
  console.log(`--- 🛠️  Fixing Admin Account: ${adminEmail} ---`);

  try {
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!user) {
      console.log(`Creating missing admin user...`);
      // Use the standard hashed password 'Password123!' with salt 12
      // $2a$12$D23/p2L9Q28N5KqXk5c/uOF5mS0.6.2O.G.y8ySgG7.r.G.r.G.rG
      // Actually, we'll just let the seed handle creation if it doesn't exist, 
      // but for this fix, we'll just update if it exists.
      console.error(`❌ User ${adminEmail} not found in database. Please run 'npm run seed' first.`);
      return;
    }

    console.log(`Current State: Role=${user.role}, Status=${user.status}, Verified=${user.emailVerified}`);

    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'admin',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log(`✅ Success! Updated ${adminEmail}:`);
    console.log(`   New State: Role=${updated.role}, Status=${updated.status}, Verified=${updated.emailVerified}`);

  } catch (err) {
    console.error(`❌ Failed to fix admin account:`);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
