import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seed } from './seed/index';

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
  });

  try {
    await prisma.$connect();
    console.log('Connected to database.\n');
    await seed(prisma);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
