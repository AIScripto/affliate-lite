# Test-only sandbox: fake network + fake publisher for the affiliate tracker.
# Never run this image next to the production tracker.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9999

COPY package*.json tsconfig.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 9999
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:9999/health || exit 1

CMD ["npx", "tsx", "src/server.ts"]
