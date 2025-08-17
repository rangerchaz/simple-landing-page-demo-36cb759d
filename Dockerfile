# Multi-stage build for Node.js backend + static frontend
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy backend package files first (for better caching)
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Production stage
FROM node:18-alpine as production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R appuser:nodejs /app

# Copy backend files
COPY --from=builder --chown=appuser:nodejs /app/backend ./backend

# Copy static frontend files
COPY --chown=appuser:nodejs frontend/ ./frontend/

# Set user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the Node.js backend server
CMD ["node", "backend/server.js"]
