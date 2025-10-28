/**
 * Response caching implementation for performance optimization
 * Supports both in-memory and Redis caching strategies
 */

import { createHash } from 'crypto';

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_MEMORY_ENTRIES: 1000,    // Maximum entries in memory cache
  DOMAIN_ANALYSIS_TTL: 60 * 60 * 1000, // 1 hour for domain analysis
  ICP_GENERATION_TTL: 24 * 60 * 60 * 1000, // 24 hours for ICP generation
  QUALIFICATION_TTL: 15 * 60 * 1000, // 15 minutes for qualification results
  OPENAI_RESPONSE_TTL: 60 * 60 * 1000, // 1 hour for OpenAI responses
} as const;

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsage: number;
  hitRate: number;
}

/**
 * Generate a cache key from input parameters
 */
export function generateCacheKey(prefix: string, ...params: (string | number | object)[]): string {
  const keyData = params.map(param => {
    if (typeof param === 'object') {
      return JSON.stringify(param, Object.keys(param).sort());
    }
    return String(param);
  }).join('|');
  
  const hash = createHash('sha256').update(keyData).digest('hex').substring(0, 16);
  return `${prefix}:${hash}`;
}

/**
 * In-memory cache implementation with LRU eviction
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private maxEntries: number;

  constructor(maxEntries: number = CACHE_CONFIG.MAX_MEMORY_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  private evictOldest(): void {
    // Remove entries that have expired first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        if (this.cache.size < this.maxEntries) return;
      }
    }

    // If still full, remove least recently used entry
    if (this.cache.size >= this.maxEntries) {
      let oldestKey = '';
      let oldestTime = Infinity;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  getStats(): CacheStats {
    const entries = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    // Estimate memory usage
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // String size in bytes (rough estimate)
      memoryUsage += JSON.stringify(entry.value).length * 2; // Entry size
      memoryUsage += 64; // Overhead for entry metadata
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries,
      memoryUsage,
      hitRate: Math.round(hitRate * 10) / 10,
    };
  }
}

/**
 * Cache manager that handles different cache strategies
 */
class CacheManager {
  private memoryCache: MemoryCache;
  private redisCache: any | null = null; // Will be set if Redis is available

  constructor() {
    this.memoryCache = new MemoryCache();
    this.initializeRedisCache();
  }

  private async initializeRedisCache(): Promise<void> {
    try {
      // Only try to initialize Redis if we have a Redis URL
      if (process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING) {
        const Redis = await import('ioredis').catch(() => null);
        if (Redis) {
          this.redisCache = new Redis.default(
            process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING
          );
          console.log('Redis cache initialized successfully');
        }
      }
    } catch (error) {
      console.warn('Redis cache initialization failed, using memory cache only:', error);
      this.redisCache = null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    // Always set in memory cache for fast access
    this.memoryCache.set(key, value, ttl);

    // Also set in Redis if available
    if (this.redisCache) {
      try {
        const serializedValue = JSON.stringify({
          value,
          expiresAt: Date.now() + ttl,
          createdAt: Date.now(),
        });
        await this.redisCache.setex(key, Math.ceil(ttl / 1000), serializedValue);
      } catch (error) {
        console.warn('Redis cache set failed:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Try Redis cache if available
    if (this.redisCache) {
      try {
        const redisValue = await this.redisCache.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          
          // Check if entry has expired
          if (Date.now() <= parsed.expiresAt) {
            // Store in memory cache for next time
            const remainingTtl = Math.max(0, parsed.expiresAt - Date.now());
            this.memoryCache.set(key, parsed.value, remainingTtl);
            return parsed.value;
          } else {
            // Remove expired entry from Redis
            await this.redisCache.del(key);
          }
        }
      } catch (error) {
        console.warn('Redis cache get failed:', error);
      }
    }

    return null;
  }

  async has(key: string): Promise<boolean> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return true;
    }

    // Check Redis cache
    if (this.redisCache) {
      try {
        const exists = await this.redisCache.exists(key);
        return exists === 1;
      } catch (error) {
        console.warn('Redis cache exists check failed:', error);
      }
    }

    return false;
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Delete from memory cache
    if (this.memoryCache.delete(key)) {
      deleted = true;
    }

    // Delete from Redis cache
    if (this.redisCache) {
      try {
        const result = await this.redisCache.del(key);
        if (result > 0) deleted = true;
      } catch (error) {
        console.warn('Redis cache delete failed:', error);
      }
    }

    return deleted;
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear Redis cache (only our keys)
    if (this.redisCache) {
      try {
        // Get all keys with our prefix patterns
        const patterns = ['domain:', 'icp:', 'qualify:', 'openai:'];
        for (const pattern of patterns) {
          const keys = await this.redisCache.keys(`${pattern}*`);
          if (keys.length > 0) {
            await this.redisCache.del(...keys);
          }
        }
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }
    }
  }

  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  isRedisAvailable(): boolean {
    return this.redisCache !== null;
  }
}

// Create a singleton cache manager
export const cacheManager = new CacheManager();

/**
 * Decorator function to add caching to async functions
 */
export function withCache<T extends any[], R>(
  keyPrefix: string,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  keyGenerator?: (...args: T) => string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator 
        ? `${keyPrefix}:${keyGenerator(...args)}`
        : generateCacheKey(keyPrefix, ...args);

      // Try to get from cache first
      const cached = await cacheManager.get<R>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute the original method
      const result = await method.apply(this, args);

      // Cache the result
      await cacheManager.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper function to create cached versions of functions
 */
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  keyGenerator?: (...args: T) => string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator 
      ? `${keyPrefix}:${keyGenerator(...args)}`
      : generateCacheKey(keyPrefix, ...args);

    // Try to get from cache first
    const cached = await cacheManager.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute the original function
    const result = await fn(...args);

    // Cache the result
    await cacheManager.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Cache warming utilities
 */
export async function warmCache(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
  const promises = entries.map(({ key, value, ttl }) => 
    cacheManager.set(key, value, ttl)
  );
  
  await Promise.all(promises);
  console.log(`Cache warmed with ${entries.length} entries`);
}

/**
 * Cache monitoring and metrics
 */
export function logCacheStats(): void {
  const stats = cacheManager.getStats();
  console.log('Cache Statistics:', {
    ...stats,
    redisAvailable: cacheManager.isRedisAvailable(),
    memoryUsageKB: Math.round(stats.memoryUsage / 1024)
  });
}

// Export cache instance for direct use
export { cacheManager as cache };