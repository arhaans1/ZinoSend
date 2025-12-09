import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiter for API routes
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'ratelimit:api',
})

// Rate limiter for authentication attempts
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
  prefix: 'ratelimit:auth',
})

// Rate limiter for message sending
export const messageRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 s'), // 30 messages per second (Gupshup limit)
  analytics: true,
  prefix: 'ratelimit:message',
})

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data as T
  } catch {
    return null
  }
}

export async function cacheSet(
  key: string,
  value: any,
  expirationSeconds?: number
): Promise<void> {
  try {
    if (expirationSeconds) {
      await redis.set(key, value, { ex: expirationSeconds })
    } else {
      await redis.set(key, value)
    }
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidate pattern error:', error)
  }
}

// Session management helpers
export async function setSessionData(
  sessionId: string,
  data: Record<string, any>,
  expirationSeconds: number = 86400 // 24 hours
): Promise<void> {
  await cacheSet(`session:${sessionId}`, data, expirationSeconds)
}

export async function getSessionData(sessionId: string): Promise<Record<string, any> | null> {
  return cacheGet(`session:${sessionId}`)
}

export async function deleteSessionData(sessionId: string): Promise<void> {
  await cacheDelete(`session:${sessionId}`)
}

// Rate limit check helper
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  const { success, remaining, reset } = await limiter.limit(identifier)
  return {
    success,
    remaining,
    reset: new Date(reset),
  }
}
