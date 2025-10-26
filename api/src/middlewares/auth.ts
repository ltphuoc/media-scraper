import basicAuth from 'basic-auth'
import type { NextFunction, Request, Response } from 'express'

const USER = process.env.BASIC_AUTH_USER || ''
const PASS = process.env.BASIC_AUTH_PASS || ''

export function basicAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = basicAuth(req)
  if (!USER && !PASS) return next()

  if (!user || user.name !== USER || user.pass !== PASS) {
    res.set('WWW-Authenticate', 'Basic realm="MediaScraper"')
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}
