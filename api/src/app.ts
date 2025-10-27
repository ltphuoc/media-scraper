import cors from 'cors'
import express, { json, urlencoded } from 'express'
import { serverAdapter } from './lib/bullboard'
import { setupSwagger } from './lib/swagger'
import { basicAuthMiddleware } from './middlewares/auth'
import { errorHandler } from './middlewares/error'
import { loggingMiddleware } from './middlewares/logging'
import jobRoutes from './routes/job.routes'
import mediaRoutes from './routes/media.routes'
import monitorRoutes from './routes/monitor.routes'

export const createApp = () => {
  const app = express()

  app.use(loggingMiddleware)
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  )
  app.use(json({ limit: '1mb' }))
  app.use(urlencoded({ extended: true }))

  setupSwagger(app)

  app.use('/api', monitorRoutes)
  app.use('/api', basicAuthMiddleware)

  // Routes API
  app.use('/admin/queues', serverAdapter.getRouter())
  app.use('/api', jobRoutes)
  app.use('/api', mediaRoutes)

  app.use(errorHandler)

  return app
}
