import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { getBrowser } from './browser'
import { logger } from './logger'

const FETCH_TIMEOUT = 10000 // 10 seconds
const PUPPETEER_TIMEOUT = 40000 // 40 seconds
const MIN_HTML_LENGTH = 5000 // Minimum HTML length to consider it valid
const NETWORK_IDLE_WAIT = 3000 // 3 seconds

export async function scrapeMediaURLs(baseURL: string) {
  let html: string | null = null
  let videoUrls: string[] = []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const res = await fetch(baseURL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaScraper/1.0)' },
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Failed ${res.status}`)
    html = await res.text()
  } catch (err) {
    console.warn(`Static fetch failed for ${baseURL}:`, (err as Error).message)
  }

  const hasMedia = html && (html.includes('<img') || html.includes('<video'))
  const looksLikeCSR =
    !html ||
    (html.length < MIN_HTML_LENGTH && !hasMedia) ||
    /(id|class)="(root|app|__next)"/.test(html) ||
    html.includes('id="root"') ||
    html.includes('id="app"') ||
    html.includes('ng-version') ||
    html.includes('data-reactroot')

  if (looksLikeCSR || (html && !hasMedia)) {
    logger.info(`Detected CSR page → using Puppeteer for ${baseURL}`)
    const result = await renderWithPuppeteer(baseURL)
    html = result.html
    videoUrls = result.videoUrls
  }

  if (!html) throw new Error(`Cannot load HTML from ${baseURL}`)

  const { images, videos } = extractMedia(html, baseURL)
  const allVideos = [...new Set([...videos, ...videoUrls])]

  return { images, videos: allVideos }
}

async function renderWithPuppeteer(url: string): Promise<{ html: string; videoUrls: string[] }> {
  const browser = await getBrowser()
  const videoUrls = new Set<string>()
  let page: Page | null = null

  try {
    page = await browser.newPage()

    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Windows',
    })
    await page.setRequestInterception(true)

    page.on('request', (req) => req.continue())
    page.on('response', async (res) => {
      try {
        const url = res.url()
        const ct = res.headers()['content-type'] || ''
        if (
          ct.includes('video/') ||
          /\.(mp4|webm|ogg|m3u8|mpd)(\?|$)/i.test(url) ||
          url.includes('/video/') ||
          url.includes('/stream/')
          // ||
          // url.includes('googlevideo.com/videoplayback')
        ) {
          videoUrls.add(url)
        }
      } catch {}
    })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: PUPPETEER_TIMEOUT })
    await page.waitForSelector('body', { visible: true, timeout: 10000 }).catch(() => {})
    await autoScroll(page)
    await page.click('button.play').catch(() => {})
    await new Promise((resolve) => setTimeout(resolve, NETWORK_IDLE_WAIT))

    let html = ''
    try {
      html = await page.content()
    } catch (e: any) {
      if (e.message?.includes('detached')) {
        console.warn('[scrape] Frame detached, retrying get content...')
        try {
          await page.waitForSelector('body', { timeout: 5000 })
          html = await page.evaluate(() => document.documentElement.outerHTML)
        } catch (e2) {
          logger.error(`[scrape] Second attempt failed: ${(e2 as Error).message}`)
          html = ''
        }
      } else {
        throw e
      }
    }

    return { html, videoUrls: [...videoUrls] }
  } catch (e) {
    logger.error(`Puppeteer render failed: ${(e as Error).message}`)
    return { html: '', videoUrls: [...videoUrls] }
  } finally {
    await page?.close().catch(() => {})
  }
}

async function autoScroll(page: Page, maxScroll = 8000, step = 300) {
  await page.evaluate(
    async (maxScroll, step) => {
      await new Promise<void>((resolve) => {
        let total = 0
        const timer = setInterval(() => {
          window.scrollBy(0, step)
          total += step
          if (total >= document.body.scrollHeight || total >= maxScroll) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    },
    maxScroll,
    step
  )
}

function extractMedia(html: string, baseURL: string) {
  const $ = cheerio.load(html)

  const absolutify = (src: string) => {
    if (!src) return null
    try {
      return new URL(src, baseURL).toString()
    } catch {
      return null
    }
  }

  const images = new Set<string>()
  const videos = new Set<string>()

  $('img').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || ''
    const abs = absolutify(src)
    if (abs) images.add(abs)
  })

  $('video, source, a[href], iframe[src]').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('href') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || ''
    const lower = src.toLowerCase()
    if (
      /\.(mp4|webm|ogg|mov|avi|m3u8|mpd)(\?|#|$)/.test(lower) ||
      lower.includes('/video/') ||
      lower.includes('/embed/') ||
      lower.includes('/stream/')
    ) {
      const abs = absolutify(src)
      if (abs) videos.add(abs)
    }
  })

  return {
    images: [...images],
    videos: [...videos],
  }
}
