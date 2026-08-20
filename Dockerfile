# --- Build stage ---
FROM oven/bun:1 AS builder
WORKDIR /app

# Vars VITE_* são embutidas no bundle no build-time (client-side!).
# Passadas via build-args (ver docker-compose). NUNCA colocar segredos
# aqui (ex: WAHA_API_KEY) — só a URL pública do Supabase/anon key, que
# já são projetadas pra serem públicas.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# --- Runtime stage ---
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
