#!/bin/sh
set -e

echo "🚀 Starting Media Scraper API..."
echo "DATABASE_URL=${DATABASE_URL}"

npx prisma generate
npx prisma migrate deploy

pnpm start
