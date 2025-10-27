import { Job, Queue, QueueEvents, Worker } from 'bullmq'
import { logger } from './logger'
import { prisma } from './prisma'
import { redis as connection } from './redis'
import { scrapeMediaURLs } from './scrape'

export const scrapeQueue = new Queue('scrape', { connection })
export const scrapeQueueEvents = new QueueEvents('scrape', { connection })

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 2)
export const scrapeWorker = new Worker(
  'scrape',
  async (job: Job<{ urls: string[] }>) => {
    const { urls } = job.data
    const results = []
    const totalUrls = urls.length

    logger.info(`🚀 [Worker] Starting job ${job.id} with ${totalUrls} URL(s)`)

    const CHUNK_SIZE = 2
    for (let i = 0; i < totalUrls; i += CHUNK_SIZE) {
      const chunk = urls.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map(async (url) => {
          try {
            const { images, videos } = await scrapeMediaURLs(url)

            const page = await prisma.page.upsert({
              where: { url },
              update: {},
              create: { url },
            })

            const data = [
              ...images.map((u) => ({ type: 'image' as const, url: u, pageId: page.id })),
              ...videos.map((u) => ({ type: 'video' as const, url: u, pageId: page.id })),
            ]
            if (data.length) await prisma.media.createMany({ data, skipDuplicates: true })

            logger.info(`✅ [Worker] ${url} (${images.length} img / ${videos.length} vid)`)
            return { url, images: images.length, videos: videos.length, success: true }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            logger.error(`❌ [Worker] ${url} failed: ${message}`)
            return { url, images: 0, videos: 0, success: false, error: message }
          }
        })
      )
      results.push(...chunkResults)
      const progress = Math.min(Math.round(((i + chunk.length) / totalUrls) * 100), 100)
      await job.updateProgress(progress)
    }

    logger.info(`🏁 [Worker] Job ${job.id} completed with ${results.length} results`)
    return results
  },
  {
    connection,
    concurrency,
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
