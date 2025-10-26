FROM node:22-bullseye AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "start"]
