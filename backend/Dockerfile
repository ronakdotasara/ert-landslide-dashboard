FROM node:20-alpine
RUN apk add --no-cache python3 make g++ py3-setuptools
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN rm -rf node_modules
RUN npm ci --omit=dev
RUN rm -f ert.db ert.db-wal ert.db-shm
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["node", "api/server.js"]