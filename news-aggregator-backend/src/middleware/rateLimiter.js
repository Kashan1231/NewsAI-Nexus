/**
 * A lightweight, in-memory rate limiter middleware factory.
 * Tracks requests per IP within a sliding time window.
 */
export function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map()

  return (req, res, next) => {
    const ip = req.ip
    const now = Date.now()

    if (!hits.has(ip)) {
      hits.set(ip, { count: 1, resetAt: now + windowMs })
      return next()
    }

    const data = hits.get(ip)

    // Reset window if expired
    if (now > data.resetAt) {
      data.count = 1
      data.resetAt = now + windowMs
      return next()
    }

    data.count++
    if (data.count > max) {
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.'
      })
    }

    next()
  }
}
