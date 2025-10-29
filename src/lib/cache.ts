/**
 * Response caching implementation for performance optimization
 * Memory-only caching implementation
 */

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
 * Simple hash function for browser compatibility
 * Generates a deterministic hash from input string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
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
  
  const hash = simpleHash(keyData);
  return `${prefix}:${hash}`;
}

/**
 * Generate a user-specific cache key to ensure data isolation
 */
export function generateUserCacheKey(userId: string, prefix: string, ...params: (string | number | object)[]): string {
  // Always include userId as the first parameter for user-specific data
  return generateCacheKey(prefix, userId, ...params);
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
 * Cache manager using in-memory cache only
 */
class CacheManager {
  private memoryCache: MemoryCache;

  constructor() {
    this.memoryCache = new MemoryCache();
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    // Get from memory cache
    return this.memoryCache.get<T>(key);
  }

  async has(key: string): Promise<boolean> {
    // Check memory cache
    return this.memoryCache.has(key);
  }

  async delete(key: string): Promise<boolean> {
    // Delete from memory cache
    return this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
  }

  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * Clear all cache entries for a specific user
   */
  clearUserCache(userId: string): number {
    let clearedCount = 0;
    const now = Date.now();
    
    // Access the internal cache from memoryCache
    const internalCache = (this.memoryCache as any).cache as Map<string, CacheEntry>;
    
    // Look for cache keys that might contain user-specific data
    for (const [key, entry] of internalCache.entries()) {
      // Check if the key contains the user ID or if the cached data might be user-specific
      if (key.includes(userId) || this.isUserSpecificKey(key)) {
        internalCache.delete(key);
        clearedCount++;
      }
      // Also remove expired entries while we're at it
      else if (now > entry.expiresAt) {
        internalCache.delete(key);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  /**
   * Check if a cache key represents user-specific data
   */
  private isUserSpecificKey(key: string): boolean {
    const userSpecificPrefixes = [
      'companies:',
      'qualify:',
      'icp:',
      'user:',
      'dashboard:',
      'runs:'
    ];
    
    return userSpecificPrefixes.some(prefix => key.startsWith(prefix));
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
    memoryUsageKB: Math.round(stats.memoryUsage / 1024)
  });
}

/**
 * Clear all browser-level caches that might contain user data
 * This should be called when users sign out or switch accounts
 */
export function clearBrowserCaches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    const localKeys = Object.keys(localStorage);
    localKeys.forEach(key => {
      if (key.includes('user') || key.includes('companies') || 
          key.includes('dashboard') || key.includes('qualify') ||
          key.includes('auth') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('user') || key.includes('companies') || 
          key.includes('dashboard') || key.includes('qualify') ||
          key.includes('auth') || key.includes('session')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('[Cache] Cleared browser caches');
  } catch (error) {
    console.warn('[Cache] Error clearing browser caches:', error);
  }
}

// Export cache instance for direct use
export { cacheManager as cache };