import { PrismaClient } from '@prisma/client'

// Fix DATABASE_URL before Prisma Client initializes
// The environment may have a stale SQLite URL from the dev server
const envUrl = process.env.DATABASE_URL
if (envUrl && !envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
  // Build from individual env vars
  const user = process.env.USER_ROACH
  const password = process.env.PASSWORD_ROACH
  const host = process.env.HOST_ROACH

  if (user && password && host) {
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:26257/defaultdb?sslmode=require`
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
