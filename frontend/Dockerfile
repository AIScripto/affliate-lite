# Stage 1: Build static assets
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Development target (for docker-compose local dev)
FROM node:24-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3085

ENV VITE_BACKEND_URL=http://backend:3086

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3085"]

# Stage 3: Production runner (default final stage for deployment builds)
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
