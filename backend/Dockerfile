# Backend Dockerfile using Node v24
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3086

COPY package*.json tsconfig.json ./
COPY prisma ./prisma

RUN npm install && npx prisma generate

COPY src ./src

EXPOSE 3086

CMD ["npx", "tsx", "src/index.ts"]
