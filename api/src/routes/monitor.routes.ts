import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { scrapeQueue } from '../lib/queue'
import { redis } from '../lib/redis'

const router = Router()

let requestCount = 0

router.use((_req, _res, next) => {
  requestCount++
  next()
})

/**
 * @swagger
 * tags:
 *   name: Monitor
 *   description: Monitor system health and metrics
 */

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check database and Redis connectivity.
 *     responses:
 *       200:
 *         description: Healthy
 *       500:
 *         description: Unhealthy
 */
router.get('/health', async (_req, res) => {
  try {
    await Promise.all([
      //
      await prisma.$queryRaw`SELECT 1`,
      await redis.ping(),
    ])

    res.status(200).json({
      status: 'ok',
      services: {
        database: 'connected',
        redis: 'connected',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: (err as Error).message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  }
})

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Application and queue metrics
 *     description: Returns runtime metrics (uptime, requests, queue counts, Redis memory usage).
 *     responses:
 *       200:
 *         description: Metrics summary
 */
let lastCpuUsage = process.cpuUsage()
let lastHrtime = process.hrtime()

router.get('/metrics', async (_req, res) => {
  try {
    const uptime = process.uptime()
    const memory = process.memoryUsage()
    const totalMB = (memory.rss / 1024 / 1024).toFixed(2)
    const heapUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2)
    const heapTotalMB = (memory.heapTotal / 1024 / 1024).toFixed(2)
    const heapUsedPercent = ((memory.heapUsed / memory.heapTotal) * 100).toFixed(2)

    // --- CPU USAGE ---
    const currentCpu = process.cpuUsage(lastCpuUsage)
    const currentHr = process.hrtime(lastHrtime)
    lastCpuUsage = process.cpuUsage()
    lastHrtime = process.hrtime()

    const elapsedMicros = currentHr[0] * 1e6 + currentHr[1] / 1e3
    const userMs = currentCpu.user / 1000
    const systemMs = currentCpu.system / 1000
    const cpuPercent = ((userMs + systemMs) / elapsedMicros) * 100

    const [waiting, active, completed, failed] = await Promise.all([
      scrapeQueue.getWaitingCount(),
      scrapeQueue.getActiveCount(),
      scrapeQueue.getCompletedCount(),
      scrapeQueue.getFailedCount(),
    ])

    const redisInfo = await redis.info('memory')
    const usedMemoryMatch = redisInfo.match(/used_memory_human:(\S+)/)
    const redisMemory = usedMemoryMatch ? usedMemoryMatch[1] : 'N/A'

    res.json({
      status: 'ok',
      uptimeSeconds: uptime,
      requests: requestCount,
      memory: {
        totalMB,
        heapUsedMB,
        heapTotalMB,
        heapUsedPercent: `${heapUsedPercent}%`,
      },
      cpu: {
        userMs: userMs.toFixed(2),
        systemMs: systemMs.toFixed(2),
        usagePercent: `${cpuPercent.toFixed(2)}%`,
      },
      redisMemory,
      queue: { waiting, active, completed, failed },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: (err as Error).message,
    })
  }
})

export default router
