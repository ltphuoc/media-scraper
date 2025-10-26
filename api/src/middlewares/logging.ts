import pinoHttp from 'pino-http'
import { logger } from '../lib/logger'

export const loggingMiddleware = pinoHttp({
  logger,
  autoLogging: true,
})
