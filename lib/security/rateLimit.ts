import { NextRequest } from "next/server"
import { ipAddress } from "@vercel/functions"
import { logger } from "@/lib/serverLogger"
import { rateLimit as config } from "./config"

const RATE_LIMIT_WINDOW = config.window // 1 minute
const MAX_REQUESTS = config.maxRequests // Maximum requests per window
const CACHE_TTL = config.cacheTTL // 2 minutes

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  retryAfter: number
}

// Use a Map to store rate limit data in memory
// In production, consider using Redis or a similar distributed cache
const rateLimitMap = new Map<
  string,
  { count: number; timestamp: number }
>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      rateLimitMap.delete(key)
      logger.debug("Cleaned up rate limit entry", { key })
    }
  }
}, CACHE_TTL)

export async function rateLimit(
  req: NextRequest
): Promise<RateLimitResult> {
  try {
    const key = generateKey(req)
    const now = Date.now()
    
    // Get current rate limit data
    const current = rateLimitMap.get(key) || {
      count: 0,
      timestamp: now,
    }
    
    // Reset count if window has expired
    if (now - current.timestamp > RATE_LIMIT_WINDOW) {
      current.count = 0
      current.timestamp = now
      logger.debug("Reset rate limit counter", { key })
    }
    
    // Increment request count
    current.count++
    
    // Update rate limit data
    rateLimitMap.set(key, current)
    
    // Calculate remaining requests and retry after time
    const remaining = Math.max(0, MAX_REQUESTS - current.count)
    const retryAfter = Math.ceil(
      (RATE_LIMIT_WINDOW - (now - current.timestamp)) / 1000
    )
    
    const result = {
      success: current.count <= MAX_REQUESTS,
      limit: MAX_REQUESTS,
      remaining,
      retryAfter,
    }

    logger.debug("Rate limit check", {
      key,
      count: current.count,
      ...result
    })

    return result
  } catch (error) {
    const typedError = error as Error
    logger.error("Rate limit error", {
      error: typedError.message,
      stack: typedError.stack,
      path: req.nextUrl.pathname,
    })
    
    // If there's an error, allow the request to proceed
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS,
      retryAfter: 0,
    }
  }
}

function generateKey(req: NextRequest): string {
  // Generate a unique key based on IP and path
  const ip = ipAddress(req) || 
             req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  const path = req.nextUrl.pathname
  return `${ip}:${path}`
}
