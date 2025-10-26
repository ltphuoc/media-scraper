# ---- BUILD STAGE ----
FROM node:22-bullseye AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN pnpm build

# ---- RUNTIME STAGE ----
FROM node:22-bullseye

WORKDIR /app
ENV NODE_ENV=production

# Install Chromium & dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  ffmpeg \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libnss3 \
  libxss1 \
  libgtk-3-0 \
  libx11-xcb1 \
  libdrm2 \
  libgbm1 \
  libasound2 \
  ca-certificates \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=builder /app ./

RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["dumb-init", "./docker-entrypoint.sh"]