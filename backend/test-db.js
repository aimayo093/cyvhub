require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Test with sslmode=require appended
const baseUrl = process.env.DATABASE_URL;
const url = baseUrl.includes('?') ? baseUrl + '&sslmode=require' : baseUrl + '?sslmode=require';
console.log('Testing URL:', url.replace(/:[^:@]+@/, ':***@'));

const prisma = new PrismaClient({ datasources: { db: { url } } });

prisma.$queryRawUnsafe('SELECT 1 AS ok')
  .then(r => { console.log('SUCCESS:', r); return prisma.$disconnect(); })
  .catch(e => { console.error('FAILED:', e.message); prisma.$disconnect(); process.exit(1); });
