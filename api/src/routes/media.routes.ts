/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Retrieve stored media items
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get paginated media items with optional filters
 *     tags: [Media]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of media items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       url:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [image, video]
 *                       page:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 */

import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const router = Router()

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['image', 'video']).optional(),
  search: z.string().max(500).optional().or(z.literal('')),
})

router.get('/media', async (req, res, next) => {
  try {
    const parsed = QuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid query', issues: parsed.error.issues })
    }
    const { page, limit, type, search } = parsed.data

    const where: Prisma.MediaWhereInput = {}
    if (type) where.type = type
    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { page: { url: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { page: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({ where }),
    ])

    res.json({
      data: items,
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
