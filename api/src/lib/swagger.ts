import { Express } from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: '📸 Media Scraper API',
      version: '1.0.0',
      description: `
      📸 Media Scraper System

      This API allows you to submit websites to be scraped for images and videos,
      store the results in a SQL database, and query them with pagination and filters.

      It also supports an asynchronous Redis Queue (BullMQ) model to handle
      high concurrency (5000+ simultaneous requests) efficiently.

      Features:
      - ✅ Swagger UI: /api/docs
      - ✅ Bull Board Dashboard: /admin/queues
      - ✅ Auth: Basic Auth (username: admin / password: admin)
      `,
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local server',
      },
      {
        url: 'http://api:4000',
        description: 'Docker container',
      },
      {
        url: 'http://127.0.0.1:4000',
        description: 'Alternative localhost',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      },
      schemas: {
        MediaItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['image', 'video'] },
            url: { type: 'string', example: 'https://example.com/image.jpg' },
            page: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://example.com' },
              },
            },
          },
        },
        ScrapeJobStatus: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4' },
            state: {
              type: 'string',
              enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
            },
            progress: { type: 'number', example: 50 },
            result: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  images: { type: 'integer' },
                  videos: { type: 'integer' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ basicAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app: Express) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { background-color: #0f172a; }
        .topbar-wrapper img { content:url('https://swagger.io/assets/images/swagger_logo.svg'); }
        body { background: #f8fafc; }
      `,
      customSiteTitle: 'Media Scraper API Docs',
    })
  )
}
