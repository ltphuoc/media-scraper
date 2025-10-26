import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Browser } from 'puppeteer'
import { logger } from './logger'

puppeteer.use(StealthPlugin())

let browser: Browser | null = null
let launchingPromise: Promise<Browser> | null = null

export async function getBrowser() {
  if (browser && browser.connected) return browser

  if (launchingPromise) return launchingPromise

  launchingPromise = (async () => {
    logger.info('🧠 Launching new Puppeteer browser...')

    try {
      const instance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-infobars',
          '--no-zygote',
          '--single-process',
          '--no-first-run',
          '--disk-cache-dir=/tmp/puppeteer-cache',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
      })

      browser = instance

      browser.on('disconnected', () => {
        console.warn('⚠️ Puppeteer browser disconnected, will recreate on next job')
        browser = null
      })

      logger.info('✅ Puppeteer browser launched successfully')
      return instance
    } catch (err: any) {
      logger.error('❌ Failed to launch Puppeteer:', err.message)
      browser = null
      throw err
    } finally {
      launchingPromise = null
    }
  })()

  return launchingPromise
}

async function closeBrowser() {
  if (browser) {
    logger.info('🧹 Closing Puppeteer browser...')
    try {
      await browser.close()
    } catch {}
    browser = null
  }
}

process.on('SIGTERM', closeBrowser)
process.on('SIGINT', closeBrowser)
process.on('exit', closeBrowser)
