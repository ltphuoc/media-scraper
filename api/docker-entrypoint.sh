#!/bin/sh
set -e

echo "🚀 Starting Media Scraper API..."
echo "DATABASE_URL=${DATABASE_URL}"

# Run migration
echo "📦 Deploying migrations..."
pnpm prisma:deploy

# Start API
echo "🚀 Launching API server..."
pnpm start