/**
 * @swagger
 * tags:
 *   name: Scrape
 *   description: Manage web scraping jobs using Redis queue (BullMQ)
 */

/**
 * @swagger
 * /api/scrape:
 *   post:
 *     summary: Enqueue a new scraping job
 *     description: Add one or more URLs to the scrape queue. The job will be processed asynchronously by a worker.
 *     tags: [Scrape]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 minItems: 1
 *                 maxItems: 10
 *             example:
 *               urls: ["https://example.com", "https://wikipedia.org"]
 *     responses:
 *       200:
 *         description: Job successfully queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: queued
 *       400:
 *         description: Invalid request body
 */

/**
 * @swagger
 * /api/scrape/{id}:
 *   get:
 *     summary: Get job status and result
 *     description: Retrieve the current state and result of a scraping job by its ID.
 *     tags: [Scrape]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job status and details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 state:
 *                   type: string
 *                   enum: [waiting, active, completed, failed, delayed]
 *                 progress:
 *                   type: number
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       images:
 *                         type: integer
 *                       videos:
 *                         type: integer
 *                       error:
 *                         type: string
 *                 attemptsMade:
 *                   type: integer
 *       404:
 *         description: Job not found
 */

import { Router } from 'express'
import { z } from 'zod'
import { scrapeQueue } from '../lib/queue'

const router = Router()

router.post('/scrape', async (req, res, next) => {
  try {
    const schema = z.object({
      urls: z.array(z.url()).min(1).max(10),
    })

    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid body', issues: parsed.error.issues })
    }

    const uniqueUrls = Array.from(new Set(parsed.data.urls))

    const job = await scrapeQueue.add(
      'scrapeJob',
      { urls: uniqueUrls },
      {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    )
    return res.json({ jobId: job.id, status: 'queued' })
  } catch (err) {
    next(err)
  }
})

router.get('/scrape/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const job = await scrapeQueue.getJob(id)

    if (!job) return res.status(404).json({ message: 'Job not found' })

    const state = await job.getState()
    const progress = job.progress ?? 0
    const result = job.returnvalue || job.data.result || null

    res.json({
      id: job.id,
      state,
      progress,
      result,
      attemptsMade: job.attemptsMade,
    })
  } catch (err) {
    next(err)
  }
})

export default router
