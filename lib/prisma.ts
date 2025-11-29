import { PrismaClient } from 'db/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from '../prisma.config';

const globalThisForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

// Create PostgreSQL connection pool
const pool = globalThisForPrisma.pgPool ?? new Pool({
  connectionString: config?.datasource?.url as string || process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalThisForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = globalThisForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThisForPrisma.prisma = prisma;
}
