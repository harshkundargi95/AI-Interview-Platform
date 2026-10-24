import { ApiError } from './errors.js'

// Bounded process-local windows. Trust proxy stays disabled for this loopback API.
export function createRateLimit({ limit = 240, windowMs = 60000, maxKeys = 10000, key = req => req.ip, now = Date.now } = {}) {
  const entries = new Map()
  return (req, res, next) => {
    if (req.method === 'OPTIONS' || ['/api/v1/live', '/api/v1/ready', '/api/v1/health'].includes(req.path)) return next()
    const time = now()
    for (const [id, entry] of entries) if (entry.reset <= time) entries.delete(id)
    const id = key(req)
    let entry = entries.get(id)
    if (!entry) {
      if (entries.size >= maxKeys) {
        res.set('Retry-After', String(Math.ceil(windowMs / 1000)))
        return next(new ApiError(429, 'RATE_LIMIT', 'Server is busy. Wait a minute, then retry.'))
      }
      entry = { count: 0, reset: time + windowMs }; entries.set(id, entry)
    }
    if (++entry.count > limit) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.reset - time) / 1000))))
      return next(new ApiError(429, 'RATE_LIMIT', 'Too many requests. Wait a minute, then retry. Your saved work is unchanged.'))
    }
    next()
  }
}
