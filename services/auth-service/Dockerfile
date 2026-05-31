# ─── Stage 1: Base ────────────────────────────────────────
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files first (layer caching optimization)
# If package.json hasn't changed, npm install layer is cached
COPY package*.json ./

# ─── Stage 2: Dependencies ───────────────────────────────
FROM base AS dependencies

# Install production dependencies only
RUN npm ci --only=production

# ─── Stage 3: Production ──────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/

# Copy package.json for reference
COPY package.json ./

# Create non-root user — security best practice
# Never run containers as root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose service port
EXPOSE 3001

# Health check — Docker monitors this
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Start command
CMD ["node", "src/index.js"]
