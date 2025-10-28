/**
 * Database query optimization utilities for improved performance
 */

import { PrismaClient } from '@prisma/client';
import { cache, generateCacheKey, CACHE_CONFIG } from './cache';

// Optimized Prisma client configuration
export const createOptimizedPrismaClient = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add query logging and monitoring in development
  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
      if (e.duration > 1000) {
        console.warn(`Slow query detected (${e.duration}ms):`, {
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      }
    });
  }

  return prisma;
};

// Database connection pool configuration
export const DB_CONFIG = {
  CONNECTION_LIMIT: 20,
  TIMEOUT: 30000, // 30 seconds
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
  BATCH_SIZE: 50, // For batch operations
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Cached database query wrapper
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL
): Promise<T> {
  // Try cache first
  const cached = await cache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await queryFn();

  // Cache the result
  await cache.set(cacheKey, result, ttl);

  return result;
}

/**
 * Optimized qualification run queries
 */
export class QualificationRunQueries {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get qualification run with optimized includes
   */
  async getRunWithDetails(runId: string, userId: string) {
    const cacheKey = generateCacheKey('run_details', runId, userId);
    
    return cachedQuery(
      cacheKey,
      () => this.prisma.qualificationRun.findUnique({
        where: { 
          id: runId,
          userId 
        },
        include: {
          icp: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  domain: true,
                }
              }
            }
          },
          results: {
            select: {
              id: true,
              domain: true,
              companyName: true,
              score: true,
              fitLevel: true,
              status: true,
              error: true,
              createdAt: true,
              analyzedAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }),
      CACHE_CONFIG.DEFAULT_TTL
    );
  }

  /**
   * Get recent runs with pagination and optimized loading
   */
  async getRecentRuns(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const cacheKey = generateCacheKey('recent_runs', userId, page, limit);
    
    return cachedQuery(
      cacheKey,
      async () => {
        const [runs, total] = await Promise.all([
          this.prisma.qualificationRun.findMany({
            where: { userId },
            include: {
              icp: {
                include: {
                  company: {
                    select: {
                      id: true,
                      name: true,
                      domain: true,
                    }
                  }
                }
              },
              _count: {
                select: {
                  results: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take: limit,
          }),
          this.prisma.qualificationRun.count({
            where: { userId }
          })
        ]);

        return {
          runs,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + runs.length < total,
        };
      },
      CACHE_CONFIG.DEFAULT_TTL / 2 // Shorter cache for dynamic data
    );
  }

  /**
   * Get active runs with minimal data for monitoring
   */
  async getActiveRuns(userId: string) {
    const cacheKey = generateCacheKey('active_runs', userId);
    
    return cachedQuery(
      cacheKey,
      () => this.prisma.qualificationRun.findMany({
        where: {
          userId,
          status: {
            in: ['PENDING', 'PROCESSING']
          }
        },
        select: {
          id: true,
          status: true,
          totalProspects: true,
          completed: true,
          createdAt: true,
          icp: {
            select: {
              title: true,
              company: {
                select: {
                  name: true,
                  domain: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      CACHE_CONFIG.DEFAULT_TTL / 4 // Very short cache for real-time data
    );
  }

  /**
   * Batch create prospect qualifications for better performance
   */
  async batchCreateQualifications(runId: string, prospects: Array<{
    domain: string;
    companyName?: string;
    companyData?: any;
    score: number;
    fitLevel: string;
    reasoning: string;
    matchedCriteria: any;
    gaps: any;
    status: string;
    error?: string;
  }>) {
    const batchSize = DB_CONFIG.BATCH_SIZE;
    const results = [];

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize);
      
      const batchResults = await this.prisma.prospectQualification.createMany({
        data: batch.map(prospect => ({
          runId,
          domain: prospect.domain,
          companyName: prospect.companyName,
          companyData: prospect.companyData,
          score: prospect.score,
          fitLevel: prospect.fitLevel as any,
          reasoning: prospect.reasoning,
          matchedCriteria: prospect.matchedCriteria,
          gaps: prospect.gaps,
          status: prospect.status as any,
          error: prospect.error,
          analyzedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      results.push(batchResults);

      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < prospects.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Invalidate related caches
    await this.invalidateRunCaches(runId);

    return results;
  }

  /**
   * Update run status with cache invalidation
   */
  async updateRunStatus(runId: string, status: string, completed?: number) {
    const result = await this.prisma.qualificationRun.update({
      where: { id: runId },
      data: {
        status: status as any,
        completed,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      }
    });

    // Invalidate related caches
    await this.invalidateRunCaches(runId);

    return result;
  }

  /**
   * Get qualification results with pagination and filtering
   */
  async getQualificationResults(
    runId: string, 
    options: {
      page?: number;
      limit?: number;
      fitLevel?: string[];
      minScore?: number;
      maxScore?: number;
      search?: string;
    } = {}
  ) {
    const {
      page = 1,
      limit = 50,
      fitLevel,
      minScore,
      maxScore,
      search
    } = options;
    
    const skip = (page - 1) * limit;
    const cacheKey = generateCacheKey('qualification_results', runId, options);

    return cachedQuery(
      cacheKey,
      async () => {
        const where: any = { runId };

        // Apply filters
        if (fitLevel && fitLevel.length > 0) {
          where.fitLevel = { in: fitLevel };
        }

        if (minScore !== undefined || maxScore !== undefined) {
          where.score = {};
          if (minScore !== undefined) where.score.gte = minScore;
          if (maxScore !== undefined) where.score.lte = maxScore;
        }

        if (search) {
          where.OR = [
            { domain: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [results, total] = await Promise.all([
          this.prisma.prospectQualification.findMany({
            where,
            select: {
              id: true,
              domain: true,
              companyName: true,
              score: true,
              fitLevel: true,
              reasoning: true,
              matchedCriteria: true,
              gaps: true,
              status: true,
              error: true,
              createdAt: true,
              analyzedAt: true,
            },
            orderBy: [
              { score: 'desc' },
              { analyzedAt: 'desc' }
            ],
            skip,
            take: limit,
          }),
          this.prisma.prospectQualification.count({ where })
        ]);

        return {
          results,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + results.length < total,
        };
      },
      CACHE_CONFIG.DEFAULT_TTL
    );
  }

  /**
   * Invalidate caches related to a specific run
   */
  private async invalidateRunCaches(runId: string) {
    // Get the run to find the userId for cache invalidation
    const run = await this.prisma.qualificationRun.findUnique({
      where: { id: runId },
      select: { userId: true }
    });

    if (run) {
      // We would need to implement pattern-based cache invalidation
      // For now, we'll clear the entire cache (not ideal for production)
      console.log(`Cache invalidation needed for run ${runId}, user ${run.userId}`);
    }
  }
}

/**
 * Company queries optimization
 */
export class CompanyQueries {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get companies with ICP count for a user
   */
  async getCompaniesWithICPCount(userId: string) {
    const cacheKey = generateCacheKey('user_companies', userId);
    
    return cachedQuery(
      cacheKey,
      () => this.prisma.company.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              icps: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      CACHE_CONFIG.DEFAULT_TTL
    );
  }

  /**
   * Get company with latest ICP
   */
  async getCompanyWithLatestICP(companyId: string, userId: string) {
    const cacheKey = generateCacheKey('company_latest_icp', companyId, userId);
    
    return cachedQuery(
      cacheKey,
      () => this.prisma.company.findUnique({
        where: {
          id: companyId,
          userId
        },
        include: {
          icps: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      }),
      CACHE_CONFIG.DEFAULT_TTL
    );
  }
}

/**
 * Database performance monitoring
 */
export class DatabaseMonitor {
  private queryMetrics = new Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    slowQueries: number;
  }>();

  recordQuery(operation: string, duration: number) {
    const existing = this.queryMetrics.get(operation) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      slowQueries: 0,
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    
    if (duration > DB_CONFIG.SLOW_QUERY_THRESHOLD) {
      existing.slowQueries++;
    }

    this.queryMetrics.set(operation, existing);
  }

  getMetrics() {
    const metrics = Object.fromEntries(this.queryMetrics.entries());
    const totalQueries = Array.from(this.queryMetrics.values())
      .reduce((sum, m) => sum + m.count, 0);
    const totalSlowQueries = Array.from(this.queryMetrics.values())
      .reduce((sum, m) => sum + m.slowQueries, 0);

    return {
      queryTypes: metrics,
      summary: {
        totalQueries,
        totalSlowQueries,
        slowQueryRate: totalQueries > 0 ? (totalSlowQueries / totalQueries) * 100 : 0,
      }
    };
  }

  reset() {
    this.queryMetrics.clear();
  }
}

// Export singleton instances
export const dbMonitor = new DatabaseMonitor();

/**
 * Create query wrapper with monitoring
 */
export function createMonitoredQuery<T>(
  operation: string,
  queryFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      dbMonitor.recordQuery(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      dbMonitor.recordQuery(`${operation}_error`, duration);
      throw error;
    }
  };
}