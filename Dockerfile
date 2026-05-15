FROM oven/bun:1 AS base
WORKDIR /app

# Copy dependency files first (for layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:26257/placeholder?sslmode=require"
RUN bun run db:generate

# Build the Next.js app
RUN bun run build

# Production image - minimal
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy standalone build
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000

CMD ["bun", "server.js"]
