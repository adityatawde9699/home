# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and lockfile for workspace resolution
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies (only for backend workspace)
RUN npm ci --workspace=backend

COPY backend/ ./backend/

WORKDIR /app/backend
# Generate Prisma Client
RUN npx prisma generate
# Build the NestJS app
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
