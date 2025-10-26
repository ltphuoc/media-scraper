import IORedis from 'ioredis'
import { logger } from './logger'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

export const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error('❌ Redis retry limit reached, giving up.')
      return null
    }
    const delay = Math.min(times * 500, 5000)
    console.warn(`⚠️ Redis reconnecting in ${delay}ms (attempt ${times})`)
    return delay
  },
})

redis.on('connect', () => logger.info(`✅ Redis connected → ${REDIS_URL}`))
redis.on('ready', () => logger.info('🚀 Redis client ready'))
redis.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`))
redis.on('close', () => console.warn('⚠️ Redis connection closed'))

let isShuttingDown = false
const shutdown = async (signal: string) => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`⚙️ Received ${signal}, closing Redis connection...`)
  try {
    await redis.quit()
    logger.info('🧹 Redis connection closed cleanly.')
  } catch (err) {
    logger.error(`Redis shutdown error: ${(err as Error).message}`)
    redis.disconnect()
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
