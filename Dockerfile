# FoodRush X Production Multi-Stage Container Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm test

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/types ./src/types

EXPOSE 5000

CMD ["node", "--loader", "tsx", "server/index.ts"]
