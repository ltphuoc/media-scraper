import 'dotenv/config'
import { createApp } from './app'
import { logger } from './lib/logger'

const PORT = Number(process.env.PORT || 4000)
const app = createApp()

app.listen(PORT, () => {
  logger.info(`Media Scraper API listening on http://localhost:${PORT}`)
})
