import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Default Deny" ON "public"."User"`);
  console.log("Successfully removed redundant Default Deny policy on User table.");
}
main().finally(() => prisma.$disconnect());
