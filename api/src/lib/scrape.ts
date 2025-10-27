import * as cheerio from 'cheerio'
import { Page } from 'puppeteer'
import { getBrowser } from './browser'
import { logger } from './logger'

const FETCH_TIMEOUT = 10_000
const PUPPETEER_TIMEOUT = 40_000
const MIN_HTML_LENGTH = 3_000 // Minimum HTML length to consider it valid
const NETWORK_IDLE_WAIT = 3_000
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function scrapeMediaURLs(baseURL: string) {
  let html: string | null = null
  const videoUrls = new Set<string>()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const res = await fetch(baseURL, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
      },
    })
    clearTimeout(timeout)

    if (res.ok) {
      html = await res.text()
      logger.info(`Static fetch successful for ${baseURL}, HTML length: ${html.length}`)
    } else {
      logger.warn(`Static fetch returned ${res.status} for ${baseURL}`)
    }
  } catch (err) {
    console.warn(`Static fetch failed for ${baseURL}:`, (err as Error).message)
  }

  const hasMedia = html ? html.includes('<img') || html.includes('<video') : false
  const looksLikeCSR =
    !html ||
    (html.length < MIN_HTML_LENGTH && !hasMedia) ||
    /(id|class)="(root|app|__next)"/.test(html) ||
    html.includes('data-reactroot') ||
    html.includes('ng-version')

  if (looksLikeCSR || (html && !hasMedia)) {
    logger.info(`Detected CSR page → using Puppeteer for ${baseURL}`)
    const result = await renderWithPuppeteer(baseURL)
    html = result.html
    result.videoUrls.forEach((v) => videoUrls.add(v))
  }

  if (!html || html.length === 0) throw new Error(`Cannot load HTML from ${baseURL}`)

  const { images, videos } = extractMedia(html, baseURL)
  const allVideos = [...new Set([...videos, ...videoUrls])]

  logger.info(`Scraped ${images.length} images and ${allVideos.length} videos from ${baseURL}`)

  return { images, videos: allVideos }
}

async function renderWithPuppeteer(url: string): Promise<{ html: string; videoUrls: string[] }> {
  const browser = await getBrowser()
  const videoUrls = new Set<string>()
  let page: Page | null = null

  try {
    page = await browser.newPage()

    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent({ userAgent: USER_AGENT })
    await page.setRequestInterception(true)

    page.on('request', (req) => req.continue().catch(() => {}))

    page.on('response', async (res) => {
      try {
        const link = res.url()
        const ct = res.headers()['content-type'] || ''

        if (
          ct.includes('video/') ||
          ct.includes('application/x-mpegURL') ||
          ct.includes('application/dash+xml') ||
          /\.(mp4|webm|ogg|mov|avi|m3u8|mpd)(\?|$)/i.test(link) ||
          link.includes('/video/') ||
          link.includes('/stream/') ||
          link.includes('videoplayback') ||
          link.includes('/media/') ||
          link.includes('v.redd.it')
        ) {
          videoUrls.add(link)
          logger.debug(`Found video URL from network: ${link}`)
        }
      } catch (err) {
        // Ignore errors in response handler
      }
    })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: PUPPETEER_TIMEOUT })

    await page.waitForSelector('body', { visible: true, timeout: 10000 }).catch(() => {
      logger.warn(`Body not visible within timeout for ${url}`)
    })

    await autoScroll(page)

    await page.exposeFunction('onMediaFound', (src: string) => {
      if (src && src.startsWith('http')) {
        videoUrls.add(src)
        logger.debug(`Found video URL from DOM: ${src}`)
      }
    })

    await page.evaluate(() => {
      const report = (src?: string) => {
        if (src) (window as any).onMediaFound(src).catch(() => {})
      }

      const scan = (el: HTMLMediaElement) => {
        if (el.src) report(el.src)
        if (el.currentSrc) report(el.currentSrc)

        new MutationObserver(() => {
          if (el.src) report(el.src)
          if (el.currentSrc) report(el.currentSrc)
        }).observe(el, { attributes: true, attributeFilter: ['src'] })
      }

      document.querySelectorAll('video, audio').forEach((v) => scan(v as HTMLMediaElement))

      new MutationObserver((muts) => {
        muts.forEach((m) =>
          m.addedNodes.forEach((n) => {
            if (n instanceof HTMLVideoElement || n instanceof HTMLAudioElement) scan(n)
          })
        )
      }).observe(document.body, { childList: true, subtree: true })
    })

    await new Promise((resolve) => setTimeout(resolve, NETWORK_IDLE_WAIT))

    const domVideoLinks = await page.evaluate(() => {
      const urls = new Set<string>()

      document.querySelectorAll('video, source, a, iframe, script, [data-video-url], [data-src]').forEach((el) => {
        const attrs = ['src', 'href', 'data-src', 'data-video-url', 'data-video', 'data-stream-url']

        for (const attr of attrs) {
          const val = (el as any).getAttribute?.(attr)
          if (val && /\.(mp4|webm|ogg|mov|avi|m3u8|mpd)(\?|#|$)/i.test(val)) urls.add(val)
        }
        if (el.tagName === 'SCRIPT') {
          const txt = el.textContent || ''
          const matches = txt.match(/https?:\/\/[^"'\s]+\.(mp4|webm|ogg|mov|avi|m3u8|mpd)([?#][^"'\s]*)?/gi)
          matches?.forEach((m) => urls.add(m))
        }
      })

      return Array.from(urls)
    })

    domVideoLinks.forEach((u) => videoUrls.add(u))

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
    await page?.close().catch((err) => logger.warn(`Failed to close page: ${(err as Error).message}`))
  }
}

async function autoScroll(page: Page, maxScroll = 8000, step = 300) {
  try {
    await page.evaluate(
      async (maxScroll, step) => {
        await new Promise<void>((resolve) => {
          let total = 0
          const timer = setInterval(() => {
            const oldHeight = document.body.scrollHeight
            window.scrollBy(0, step)
            total += step

            if (total >= oldHeight || total >= maxScroll) {
              clearInterval(timer)
              resolve()
            }
          }, 100)
        })
      },
      maxScroll,
      step
    )
  } catch (err) {
    logger.warn(`Auto-scroll failed: ${(err as Error).message}`)
  }
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
    const src =
      $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || ''

    const abs = absolutify(src)
    if (abs && !abs.includes('data:image')) images.add(abs)
  })

  $('video, source, a[href], iframe[src]').each((_i, el) => {
    const src =
      $(el).attr('src') ||
      $(el).attr('href') ||
      $(el).attr('data-src') ||
      $(el).attr('data-lazy-src') ||
      $(el).attr('data-video-url') ||
      ''
    const lower = src.toLowerCase()

    if (
      /\.(mp4|webm|ogg|mov|avi|m3u8|mpd)(\?|#|$)/.test(lower) ||
      lower.includes('/video/') ||
      lower.includes('/embed/') ||
      lower.includes('/stream/') ||
      lower.includes('/media/') ||
      lower.includes('videoplayback')
    ) {
      const abs = absolutify(src)
      if (abs) videos.add(abs)
    }
  })

  return {
    images: [...images].filter(Boolean),
    videos: [...videos].filter(Boolean),
  }
}
