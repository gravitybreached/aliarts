import { PrismaClient } from '@prisma/client'

// Fix DATABASE_URL before Prisma Client initializes
// The dev server environment may have a stale SQLite URL that overrides .env
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // If it's already a PostgreSQL/CockroachDB URL, use it
  if (envUrl && (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://'))) {
    return envUrl
  }

  // Try building from individual env vars
  const user = process.env.USER_ROACH
  const password = process.env.PASSWORD_ROACH
  const host = process.env.HOST_ROACH

  if (user && password && host) {
    return `postgresql://${user}:${password}@${host}:26257/defaultdb?sslmode=require`
  }

  // Hardcoded fallback for the AliArts CockroachDB instance
  return 'postgresql://aliarts:clUKLBXTxpzW1hb09Kzd3Q@bright-burro-15816.jxf.gcp-asia-southeast1.cockroachlabs.cloud:26257/defaultdb?sslmode=require'
}

// Override the environment variable BEFORE any PrismaClient is created
process.env.DATABASE_URL = getDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a fresh PrismaClient with the correct URL
// Don't reuse cached instance that might have wrong DATABASE_URL
export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
