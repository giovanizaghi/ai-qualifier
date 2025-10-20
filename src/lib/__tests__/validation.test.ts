import { 
  isValidDomain, 
  sanitizeDomain, 
  validateAndSanitizeDomain,
  parseMultipleDomains,
  RateLimiter,
  sanitizeInput,
  validateFileSize,
  DOMAIN_REGEX 
} from '../validation';

describe('Domain Validation', () => {
  describe('isValidDomain', () => {
    test('validates correct domains', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('sub.example.com')).toBe(true);
      expect(isValidDomain('example.co.uk')).toBe(true);
      expect(isValidDomain('test-domain.org')).toBe(true);
      expect(isValidDomain('a.io')).toBe(true);
    });

    test('rejects invalid domains', () => {
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain('invalid')).toBe(false);
      expect(isValidDomain('example.')).toBe(false);
      expect(isValidDomain('.com')).toBe(false);
      expect(isValidDomain('example..com')).toBe(false);
      expect(isValidDomain('example.c')).toBe(false);
    });

    test('handles domains with protocols', () => {
      expect(isValidDomain('https://example.com')).toBe(true);
      expect(isValidDomain('http://sub.example.org')).toBe(true);
    });
  });

  describe('sanitizeDomain', () => {
    test('sanitizes domains correctly', () => {
      expect(sanitizeDomain('https://www.example.com/path')).toBe('example.com');
      expect(sanitizeDomain('HTTP://WWW.EXAMPLE.COM')).toBe('example.com');
      expect(sanitizeDomain('example.com/path?query=1#hash')).toBe('example.com');
      expect(sanitizeDomain('  Example.Com  ')).toBe('example.com');
    });

    test('removes www prefix', () => {
      expect(sanitizeDomain('www.example.com')).toBe('example.com');
      expect(sanitizeDomain('https://www.example.org')).toBe('example.org');
    });

    test('removes protocols', () => {
      expect(sanitizeDomain('https://example.com')).toBe('example.com');
      expect(sanitizeDomain('http://example.org')).toBe('example.org');
    });

    test('removes paths and queries', () => {
      expect(sanitizeDomain('example.com/about')).toBe('example.com');
      expect(sanitizeDomain('example.com?utm_source=google')).toBe('example.com');
      expect(sanitizeDomain('example.com#section')).toBe('example.com');
    });
  });

  describe('validateAndSanitizeDomain', () => {
    test('validates and sanitizes valid domains', () => {
      const result = validateAndSanitizeDomain('https://www.example.com/path');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('example.com');
      expect(result.error).toBeUndefined();
    });

    test('handles invalid domains', () => {
      const result = validateAndSanitizeDomain('invalid-domain');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('invalid-domain');
      expect(result.error).toBe('Invalid domain format');
    });

    test('handles empty input', () => {
      const result = validateAndSanitizeDomain('');
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('');
      expect(result.error).toBe('Domain is required');
    });

    test('handles null input', () => {
      const result = validateAndSanitizeDomain(null as any);
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe('');
      expect(result.error).toBe('Domain is required');
    });
  });

  describe('parseMultipleDomains', () => {
    test('parses comma-separated domains', () => {
      const input = 'example.com, test.org, invalid, sample.net';
      const result = parseMultipleDomains(input);
      
      expect(result.valid).toHaveLength(3);
      expect(result.valid).toContain('example.com');
      expect(result.valid).toContain('test.org');
      expect(result.valid).toContain('sample.net');
      
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].domain).toBe('invalid');
      expect(result.invalid[0].error).toBe('Invalid domain format');
    });

    test('parses newline-separated domains', () => {
      const input = 'example.com\ntest.org\ninvalid\nsample.net';
      const result = parseMultipleDomains(input);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(1);
    });

    test('handles mixed separators', () => {
      const input = 'example.com,test.org\nsample.net';
      const result = parseMultipleDomains(input);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    test('handles empty lines and extra whitespace', () => {
      const input = 'example.com, , test.org\n\n  sample.net  ';
      const result = parseMultipleDomains(input);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
  });

  test('allows requests within limit', () => {
    expect(rateLimiter.isRateLimited('user1')).toBe(false);
    expect(rateLimiter.isRateLimited('user1')).toBe(false);
    expect(rateLimiter.isRateLimited('user1')).toBe(false);
  });

  test('blocks requests exceeding limit', () => {
    // Use up all attempts
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    
    // Should now be rate limited
    expect(rateLimiter.isRateLimited('user1')).toBe(true);
  });

  test('tracks different users separately', () => {
    // Use up attempts for user1
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    
    // user1 should be limited, user2 should not
    expect(rateLimiter.isRateLimited('user1')).toBe(true);
    expect(rateLimiter.isRateLimited('user2')).toBe(false);
  });

  test('calculates remaining attempts correctly', () => {
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(3);
    
    rateLimiter.isRateLimited('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(2);
    
    rateLimiter.isRateLimited('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(1);
    
    rateLimiter.isRateLimited('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(0);
  });

  test('resets user attempts', () => {
    // Use up attempts
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user1');
    
    expect(rateLimiter.isRateLimited('user1')).toBe(true);
    
    // Reset and try again
    rateLimiter.reset('user1');
    expect(rateLimiter.isRateLimited('user1')).toBe(false);
  });

  test('clears all attempts', () => {
    rateLimiter.isRateLimited('user1');
    rateLimiter.isRateLimited('user2');
    
    rateLimiter.clearAll();
    
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(3);
    expect(rateLimiter.getRemainingAttempts('user2')).toBe(3);
  });
});

describe('Utility Functions', () => {
  describe('sanitizeInput', () => {
    test('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    test('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    test('limits length', () => {
      const longString = 'a'.repeat(20000);
      const result = sanitizeInput(longString);
      expect(result.length).toBe(10000);
    });
  });

  describe('validateFileSize', () => {
    test('validates file sizes within limit', () => {
      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB (default max)
    });

    test('rejects files exceeding limit', () => {
      expect(validateFileSize(6 * 1024 * 1024)).toBe(false); // 6MB
      expect(validateFileSize(10 * 1024 * 1024)).toBe(false); // 10MB
    });

    test('respects custom size limits', () => {
      expect(validateFileSize(2 * 1024 * 1024, 1)).toBe(false); // 2MB with 1MB limit
      expect(validateFileSize(2 * 1024 * 1024, 3)).toBe(true); // 2MB with 3MB limit
    });
  });

  describe('DOMAIN_REGEX', () => {
    test('matches valid domain patterns', () => {
      expect(DOMAIN_REGEX.test('example.com')).toBe(true);
      expect(DOMAIN_REGEX.test('sub.example.com')).toBe(true);
      expect(DOMAIN_REGEX.test('example.co.uk')).toBe(true);
      expect(DOMAIN_REGEX.test('test-domain.org')).toBe(true);
    });

    test('rejects invalid patterns', () => {
      expect(DOMAIN_REGEX.test('invalid')).toBe(false);
      expect(DOMAIN_REGEX.test('example.')).toBe(false);
      expect(DOMAIN_REGEX.test('.com')).toBe(false);
      expect(DOMAIN_REGEX.test('')).toBe(false);
    });
  });
});