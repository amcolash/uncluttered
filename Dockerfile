# --- Stage 1: Build React Client ---
FROM node:lts-alpine AS client-builder
ENV ROOT=/usr/src/app
WORKDIR $ROOT/react

COPY react/package*.json ./
RUN npm install

COPY react ./
COPY .env package.json ../
RUN npm run build

# --- Stage 2: Setup Server (Final Image) ---
FROM node:lts-alpine
ENV ROOT=/usr/src/app
WORKDIR $ROOT/server

COPY server/package*.json ./
RUN npm install --production

WORKDIR $ROOT
COPY server ./server

# Copy client from previous stage
COPY --from=client-builder $ROOT/www ./www

ENV NODE_ENV=production

# Limit heap to prevent server from running out of memory
CMD ["npm", "--prefix", "server/", "run", "start:prod"]