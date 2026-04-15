import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'CMSRevision', 'DispatchAttempt', 'Dispute', 
    'DisputeMessage', 'JobFinancialRecord', 'TaxNiRecord', 'VatRecord'
  ];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`CREATE POLICY "Service role only" ON "public"."${table}" FOR ALL USING (false);`);
      console.log(`Added policy to ${table}`);
    } catch (e: any) {
      console.log(`Error adding policy to ${table} (${e.message})`);
    }
  }
}
main().finally(() => prisma.$disconnect());
