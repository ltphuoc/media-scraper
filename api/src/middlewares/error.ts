import type { NextFunction, Request, Response } from 'express'
import { logger } from '../lib/logger'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status || 500
  const message = err?.message || 'Internal Server Error'
  logger.error({ err, status }, 'Unhandled error')
  res.status(status).json({ message })
}
