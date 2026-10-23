# Frontend Dockerfile with Node v24
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

ENV VITE_BACKEND_URL=http://backend:5000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
