/**
 * Security utilities for input validation, sanitization, and protection
 */

import { z } from 'zod';

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

// Security headers configuration
export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Strict-Transport-Security'?: string;
}

// Input sanitization utilities
class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < and > to prevent tag injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/['";\\]/g, '') // Remove common SQL injection characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .trim();
  }

  /**
   * Sanitize file paths to prevent directory traversal
   */
  static sanitizeFilePath(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .trim();
  }

  /**
   * Sanitize URL to prevent malicious redirects
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Only allow http, https, and relative URLs
    const urlPattern = /^(https?:\/\/[^\s<>"]+|\/[^\s<>"]*|\#[^\s<>"]*)$/i;
    
    if (!urlPattern.test(input)) {
      return '';
    }
    
    return input.trim();
  }

  /**
   * Remove potentially dangerous characters from user input
   */
  static sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Basic XSS prevention
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .substring(0, 1000); // Limit length
  }
}

// Validation schemas for common inputs
export const SecurityValidationSchemas = {
  email: z.string().email().max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash'),
  
  filename: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid filename format'),
  
  url: z.string().url().max(2048),
  
  uuid: z.string().uuid(),
  
  apiKey: z.string()
    .min(32)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid API key format'),
  
  // Assessment specific validations
  questionTitle: z.string()
    .min(10, 'Question title must be at least 10 characters')
    .max(200, 'Question title must be less than 200 characters')
    .transform(InputSanitizer.sanitizeUserInput),
  
  questionContent: z.string()
    .min(20, 'Question content must be at least 20 characters')
    .max(5000, 'Question content must be less than 5000 characters')
    .transform(InputSanitizer.sanitizeHtml),
  
  userFeedback: z.string()
    .min(1)
    .max(2000, 'Feedback must be less than 2000 characters')
    .transform(InputSanitizer.sanitizeUserInput),
};

// CSRF protection
class CSRFProtection {
  private static readonly TOKEN_COOKIE = 'csrf-token';

  /**
   * Generate a CSRF token
   */
  static generateToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for environments without crypto.randomUUID
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(headerToken: string | null, cookieToken: string | null): boolean {
    if (!headerToken || !cookieToken) {
      return false;
    }
    
    return headerToken === cookieToken;
  }

  /**
   * Get CSRF token from cookies (client-side)
   */
  static getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.TOKEN_COOKIE && value) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
}

// Rate limiting utilities
class RateLimiter {
  private static readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request should be rate limited
   */
  static shouldLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return false;
    }

    if (record.count >= config.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  static getRemainingRequests(key: string, config: RateLimitConfig): number {
    const record = this.requestCounts.get(key);
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - record.count);
  }

  /**
   * Clean up expired records
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

// Security audit utilities
class SecurityAuditor {
  /**
   * Audit request for suspicious patterns
   */
  static auditRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    ip?: string;
  }): {
    score: number;
    risks: string[];
    blocked: boolean;
  } {
    const risks: string[] = [];
    let score = 0;

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /exec\s*\(/i,
    ];
    
    const content = `${request.url} ${request.body || ''}`.toLowerCase();
    for (const pattern of sqlPatterns) {
      if (pattern.test(content)) {
        risks.push('Potential SQL injection attempt');
        score += 30;
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\s*\(/i,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(content)) {
        risks.push('Potential XSS attempt');
        score += 25;
        break;
      }
    }

    // Check for path traversal
    if (content.includes('../') || content.includes('..\\')) {
      risks.push('Potential path traversal attempt');
      score += 20;
    }

    // Check suspicious user agents
    const userAgent = request.headers['user-agent']?.toLowerCase() || '';
    const suspiciousUA = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'dirb',
      'gobuster',
    ];
    
    for (const ua of suspiciousUA) {
      if (userAgent.includes(ua)) {
        risks.push('Suspicious user agent detected');
        score += 40;
        break;
      }
    }

    // Check for excessive request size
    const bodySize = request.body?.length || 0;
    if (bodySize > 1024 * 1024) { // 1MB
      risks.push('Unusually large request body');
      score += 15;
    }

    return {
      score,
      risks,
      blocked: score >= 50,
    };
  }
}

// Password utilities
class PasswordUtils {
  /**
   * Check password strength
   */
  static checkStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 20;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 10;
    
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 15;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) score += 15;
    else feedback.push('Include special characters');

    if (!/(.)\1{2,}/.test(password)) score += 10;
    else feedback.push('Avoid repeating characters');

    return {
      score,
      feedback,
      isStrong: score >= 80,
    };
  }

  /**
   * Generate a secure random password
   */
  static generateSecure(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()_+-='[Math.floor(Math.random() * 13)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Default security headers
export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Export all utilities
export {
  InputSanitizer,
  CSRFProtection,
  RateLimiter,
  SecurityAuditor,
  PasswordUtils,
};