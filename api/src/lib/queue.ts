import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import { logger } from './logger'
import { prisma } from './prisma'
import { redis as connection } from './redis'
import { scrapeMediaURLs } from './scrape'

export const scrapeQueue = new Queue('scrape', { connection })
export const scrapeQueueEvents = new QueueEvents('scrape', { connection })

export const scrapeWorker = new Worker(
  'scrape',
  async (job: Job<{ urls: string[] }>) => {
    const { urls } = job.data
    const results = []
    const totalUrls = urls.length

    logger.info(`🚀 [Worker] Starting job ${job.id} with ${totalUrls} URL(s)`)

    for (let i = 0; i < totalUrls; i++) {
      const url = urls[i]
      const progress = Math.round(((i + 1) / totalUrls) * 100)

      try {
        const { images, videos } = await scrapeMediaURLs(url)

        const page = await prisma.page.upsert({
          where: { url },
          update: {},
          create: { url },
        })

        const mediaRecords = [
          ...images.map((m) => ({ type: 'image' as const, url: m, pageId: page.id })),
          ...videos.map((m) => ({ type: 'video' as const, url: m, pageId: page.id })),
        ]

        if (mediaRecords.length) {
          await prisma.media.createMany({ data: mediaRecords, skipDuplicates: true })
        }

        await job.updateProgress(progress)

        results.push({
          url,
          images: images.length,
          videos: videos.length,
          success: true,
        })

        logger.info(`✅ [Worker] Scraped ${url} (${images.length} img / ${videos.length} vid)`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const errorType = err instanceof Error ? err.constructor.name : 'UnknownError'
        logger.error(`❌ [Worker] Error scraping ${url}: ${message}`)

        results.push({
          url,
          error: message,
          errorType,
          success: false,
          images: 0,
          videos: 0,
        })
      }
    }

    logger.info(`🏁 [Worker] Job ${job.id} completed with ${results.length} results`)
    return results
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  }
)

scrapeWorker.on('completed', (job) => logger.info(`✅ Job ${job.id} done`))
scrapeWorker.on('failed', (job, err) => logger.error(`❌ Job ${job?.id} failed: ${err.message}`))

scrapeQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`📦 [QueueEvents] Job ${jobId} completed`)
})
scrapeQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`💥 [QueueEvents] Job ${jobId} failed: ${failedReason}`)
})

const shutdown = async (signal: string) => {
  logger.info(`⚠️ Received ${signal}, shutting down worker gracefully...`)
  await scrapeWorker.close()
  await scrapeQueue.close()
  await scrapeQueueEvents.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
