# ─── AliArts Dockerfile (Bun + Next.js Standalone) ───
# Multi-stage build for minimal production image

# ── Stage 1: Install dependencies ──
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json ./
COPY bun.lock* ./

# Install all dependencies (including devDependencies for build)
# Use --frozen-lockfile if bun.lock exists, otherwise plain install
RUN if [ -f bun.lock ]; then bun install --frozen-lockfile; else bun install; fi

# ── Stage 2: Build the application ──
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Set a dummy DATABASE_URL for Prisma generate (doesn't connect, just needs a value)
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:26257/placeholder?sslmode=require"

# Generate Prisma Client
RUN bunx prisma generate

# Build the Next.js app (creates .next/standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ── Stage 3: Production runner ──
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and generated client (needed at runtime for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set correct ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Use node to run the standalone server (most reliable for production)
# bun can also work but node is more battle-tested with Next.js standalone
CMD ["node", "server.js"]
