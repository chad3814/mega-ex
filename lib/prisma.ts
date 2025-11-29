import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from 'db/client';
import config from '../prisma.config';

const globalThisForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};


const adapter = new PrismaBetterSqlite3({
  url: config?.datasource?.url as string || 'file:../dev.db',
});

export const prisma = globalThisForPrisma.prisma ?? new PrismaClient({adapter});

if (process.env.NODE_ENV !== 'production') {
  globalThisForPrisma.prisma = prisma;
}
