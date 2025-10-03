import { RateLimitError } from "./errors";

/**
 * Rate limiter implementation for controlling request frequency
 */
export class RateLimiter {
  private attempts: Map<string, number>;
  private lastAttempt: Map<string, number>;
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  /**
   * Create a new rate limiter
   * @param maxAttempts - Maximum number of attempts allowed within the window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.attempts = new Map();
    this.lastAttempt = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if a key has exceeded its rate limit
   * @param key - Unique identifier for the rate limit check
   * @throws {RateLimitError} When rate limit is exceeded
   */
  async check(key: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Reset if outside window
    if ((this.lastAttempt.get(key) || 0) < windowStart) {
      this.attempts.set(key, 0);
    }

    const attempts = (this.attempts.get(key) || 0) + 1;
    this.attempts.set(key, attempts);
    this.lastAttempt.set(key, now);

    if (attempts > this.maxAttempts) {
      throw new RateLimitError();
    }
  }

  /**
   * Reset the rate limit for a key
   * @param key - Key to reset
   */
  reset(key: string) {
    this.attempts.delete(key);
    this.lastAttempt.delete(key);
  }
}
