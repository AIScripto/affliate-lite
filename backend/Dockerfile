# Backend Dockerfile using Node v24
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Production image
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY src/db/schema.sql ./dist/db/schema.sql

EXPOSE 5000

CMD ["node", "dist/index.js"]
