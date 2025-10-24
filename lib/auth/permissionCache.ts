import { UserWithRoles } from "@/types/roles";

/**
 * Interface for cached permission data
 */
interface CachedPermissions {
  data: UserWithRoles;
  timestamp: number;
}

/**
 * Permission Cache Manager
 * Implements in-memory caching with TTL for user permissions
 * 
 * Features:
 * - 5 minute TTL (configurable)
 * - Automatic cache invalidation
 * - Batch invalidation support
 * - Cache statistics
 */
class PermissionCacheManager {
  private cache = new Map<string, CachedPermissions>();
  private ttl: number; // Time to live in milliseconds
  private stats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
    console.log(`[PermissionCache] Initialized with TTL: ${ttlMinutes} minutes`);
  }

  /**
   * Get cached permissions for a user
   * Returns null if cache miss or expired
   */
  get(userId: string): UserWithRoles | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      console.log(`[PermissionCache] Cache expired for user: ${userId}`);
      this.cache.delete(userId);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`[PermissionCache] Cache hit for user: ${userId}`);
    return cached.data;
  }

  /**
   * Set cached permissions for a user
   */
  set(userId: string, data: UserWithRoles): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
    console.log(`[PermissionCache] Cached permissions for user: ${userId}`);
  }

  /**
   * Invalidate cache for a specific user
   */
  invalidate(userId: string): void {
    if (this.cache.has(userId)) {
      this.cache.delete(userId);
      this.stats.invalidations++;
      console.log(`[PermissionCache] Invalidated cache for user: ${userId}`);
    }
  }

  /**
   * Invalidate cache for multiple users
   */
  invalidateMany(userIds: string[]): void {
    userIds.forEach(userId => {
      if (this.cache.has(userId)) {
        this.cache.delete(userId);
        this.stats.invalidations++;
      }
    });
    console.log(`[PermissionCache] Invalidated cache for ${userIds.length} users`);
  }

  /**
   * Clear all cached permissions
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[PermissionCache] Cleared ${size} cached entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : '0.00';

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      invalidations: this.stats.invalidations,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    };
    console.log(`[PermissionCache] Statistics reset`);
  }
}

// Create singleton instance
export const permissionCache = new PermissionCacheManager(5);

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return permissionCache.getStats();
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  permissionCache.resetStats();
}

/**
 * Clear all cache (useful for testing or manual reset)
 */
export function clearPermissionCache() {
  permissionCache.clear();
}

