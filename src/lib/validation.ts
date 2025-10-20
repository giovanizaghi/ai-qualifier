/**
 * Input Validation Utilities
 * Domain validation, sanitization, and rate limiting
 */

import { z } from 'zod';

/**
 * Domain validation regex
 * Matches valid domain formats like example.com, sub.example.com, example.co.uk
 */
export const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Validate a single domain
 */
export function isValidDomain(domain: string): boolean {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
  return DOMAIN_REGEX.test(cleanDomain);
}

/**
 * Sanitize domain input
 * Removes protocol, paths, query strings, and normalizes
 */
export function sanitizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/^www\./, '') // Remove www
    .split('/')[0] // Remove path
    .split('?')[0] // Remove query string
    .split('#')[0]; // Remove hash
}

/**
 * Sanitize and validate a domain
 */
export function validateAndSanitizeDomain(domain: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!domain || typeof domain !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Domain is required',
    };
  }

  const sanitized = sanitizeDomain(domain);

  if (!sanitized) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Domain cannot be empty',
    };
  }

  if (!isValidDomain(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Invalid domain format',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Parse multiple domains from text input
 * Accepts comma-separated or newline-separated domains
 */
export function parseMultipleDomains(input: string): {
  valid: string[];
  invalid: Array<{ domain: string; error: string }>;
} {
  const domains = input
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: Array<{ domain: string; error: string }> = [];

  for (const domain of domains) {
    const result = validateAndSanitizeDomain(domain);
    if (result.isValid) {
      valid.push(result.sanitized);
    } else {
      invalid.push({
        domain,
        error: result.error || 'Invalid domain',
      });
    }
  }

  return { valid, invalid };
}

/**
 * Zod schemas for API validation
 */
export const schemas = {
  // Company analysis
  analyzeCompany: z.object({
    domain: z.string().min(1, 'Domain is required').refine(
      (val) => {
        const sanitized = sanitizeDomain(val);
        return isValidDomain(sanitized);
      },
      { message: 'Invalid domain format' }
    ),
  }),

  // Qualification request
  qualifyProspects: z.object({
    icpId: z.string().cuid('Invalid ICP ID'),
    domains: z
      .array(z.string())
      .min(1, 'At least one domain is required')
      .max(50, 'Maximum 50 domains per request')
      .refine(
        (domains) => {
          return domains.every((d) => {
            const sanitized = sanitizeDomain(d);
            return isValidDomain(sanitized);
          });
        },
        { message: 'One or more domains are invalid' }
      ),
  }),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
};

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if identifier has exceeded rate limit
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }

    // Update attempts
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return false;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Global rate limiters for different operations
 */
export const rateLimiters = {
  // Company analysis: 5 requests per minute
  analysis: new RateLimiter(5, 60000),
  
  // Qualification: 3 requests per minute
  qualification: new RateLimiter(3, 60000),
  
  // API general: 100 requests per minute
  api: new RateLimiter(100, 60000),
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

/**
 * Validate file upload size
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeMB: number = 5
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxBytes;
}
