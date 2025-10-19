// Environment configuration with validation
// This ensures all required environment variables are properly set

interface EnvironmentConfig {
  // Core App Settings
  APP_ENV: 'development' | 'production' | 'test';
  NODE_ENV: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  DEBUG_MODE: boolean;
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: string;
  NEXTAUTH_URL: string;
  
  // Database
  DATABASE_URL: string;
  DATABASE_READ_URL?: string;
  DATABASE_CONNECTION_LIMIT: number;
  DATABASE_POOL_TIMEOUT: number;
  
  // Authentication
  NEXTAUTH_SECRET: string;
  
  // OAuth Providers
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  
  // AI Services
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_ORGANIZATION_ID?: string;
  AI_RATE_LIMIT_REQUESTS_PER_MINUTE: number;
  AI_RATE_LIMIT_TOKENS_PER_MINUTE: number;
  
  // External Services
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  UPLOADTHING_SECRET?: string;
  UPLOADTHING_APP_ID?: string;
  
  // Monitoring & Analytics
  SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  VERCEL_ANALYTICS_ID?: string;
  GOOGLE_ANALYTICS_ID?: string;
  NEW_RELIC_LICENSE_KEY?: string;
  NEW_RELIC_APP_NAME?: string;
  
  // Payments
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // Security & Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: boolean;
  CORS_ORIGINS: string[];
  SECURITY_HEADERS_STRICT: boolean;
  
  // Caching & Performance
  REDIS_URL?: string;
  REDIS_PASSWORD?: string;
  CDN_URL?: string;
  ASSET_PREFIX?: string;
  
  // Backup & Recovery
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_S3_BACKUP_BUCKET?: string;
  AWS_S3_REGION?: string;
  BACKUP_RETENTION_DAYS: number;
  
  // Feature Flags
  FEATURE_AI_TUTORING: boolean;
  FEATURE_ADVANCED_ANALYTICS: boolean;
  FEATURE_PAYMENT_PROCESSING: boolean;
  FEATURE_SOCIAL_LOGIN: boolean;
  
  // Health & Monitoring
  HEALTH_CHECK_ENABLED: boolean;
  METRICS_ENDPOINT_ENABLED: boolean;
  LOG_RETENTION_DAYS: number;
  
  // Performance Thresholds
  RESPONSE_TIME_THRESHOLD_WARNING: number;
  RESPONSE_TIME_THRESHOLD_ERROR: number;
  MEMORY_USAGE_THRESHOLD_WARNING: number;
  MEMORY_USAGE_THRESHOLD_ERROR: number;
  DB_QUERY_THRESHOLD_WARNING: number;
  DB_QUERY_THRESHOLD_ERROR: number;
}

function getEnvironmentConfig(): EnvironmentConfig {
  // Required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENAI_API_KEY',
  ];

  // Check for missing required variables
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate API keys format (basic check)
  if (process.env.OPENAI_API_KEY?.includes('placeholder')) {
    console.warn('⚠️  OPENAI_API_KEY appears to be a placeholder. Please update with your actual API key.');
  }

  if (process.env.ANTHROPIC_API_KEY?.includes('placeholder')) {
    console.warn('⚠️  ANTHROPIC_API_KEY appears to be a placeholder. Please update with your actual API key.');
  }

  // Helper function to parse boolean environment variables
  const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) {return defaultValue;}
    return value.toLowerCase() === 'true';
  };

  // Helper function to parse number environment variables
  const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (value === undefined) {return defaultValue;}
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to parse array environment variables
  const parseArray = (value: string | undefined, defaultValue: string[]): string[] => {
    if (value === undefined) {return defaultValue;}
    return value.split(',').map(item => item.trim()).filter(Boolean);
  };

  return {
    // Core App Settings
    APP_ENV: (process.env.APP_ENV as any) || 'development',
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'debug',
    DEBUG_MODE: parseBoolean(process.env.DEBUG_MODE, process.env.NODE_ENV !== 'production'),
    
    // Application URLs
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL!,
    DATABASE_READ_URL: process.env.DATABASE_READ_URL,
    DATABASE_CONNECTION_LIMIT: parseNumber(process.env.DATABASE_CONNECTION_LIMIT, 10),
    DATABASE_POOL_TIMEOUT: parseNumber(process.env.DATABASE_POOL_TIMEOUT, 30000),
    
    // Authentication
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    
    // OAuth Providers
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    
    // AI Services
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_ORGANIZATION_ID: process.env.OPENAI_ORGANIZATION_ID,
    AI_RATE_LIMIT_REQUESTS_PER_MINUTE: parseNumber(process.env.AI_RATE_LIMIT_REQUESTS_PER_MINUTE, 60),
    AI_RATE_LIMIT_TOKENS_PER_MINUTE: parseNumber(process.env.AI_RATE_LIMIT_TOKENS_PER_MINUTE, 100000),
    
    // External Services
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    
    // Monitoring & Analytics
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID,
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
    NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
    NEW_RELIC_APP_NAME: process.env.NEW_RELIC_APP_NAME,
    
    // Payments
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    // Security & Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000),
    RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: parseBoolean(process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS, true),
    CORS_ORIGINS: parseArray(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    SECURITY_HEADERS_STRICT: parseBoolean(process.env.SECURITY_HEADERS_STRICT, process.env.NODE_ENV === 'production'),
    
    // Caching & Performance
    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    CDN_URL: process.env.CDN_URL,
    ASSET_PREFIX: process.env.ASSET_PREFIX,
    
    // Backup & Recovery
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BACKUP_BUCKET: process.env.AWS_S3_BACKUP_BUCKET,
    AWS_S3_REGION: process.env.AWS_S3_REGION || 'us-east-1',
    BACKUP_RETENTION_DAYS: parseNumber(process.env.BACKUP_RETENTION_DAYS, 30),
    
    // Feature Flags
    FEATURE_AI_TUTORING: parseBoolean(process.env.FEATURE_AI_TUTORING, true),
    FEATURE_ADVANCED_ANALYTICS: parseBoolean(process.env.FEATURE_ADVANCED_ANALYTICS, true),
    FEATURE_PAYMENT_PROCESSING: parseBoolean(process.env.FEATURE_PAYMENT_PROCESSING, false),
    FEATURE_SOCIAL_LOGIN: parseBoolean(process.env.FEATURE_SOCIAL_LOGIN, true),
    
    // Health & Monitoring
    HEALTH_CHECK_ENABLED: parseBoolean(process.env.HEALTH_CHECK_ENABLED, true),
    METRICS_ENDPOINT_ENABLED: parseBoolean(process.env.METRICS_ENDPOINT_ENABLED, true),
    LOG_RETENTION_DAYS: parseNumber(process.env.LOG_RETENTION_DAYS, 90),
    
    // Performance Thresholds
    RESPONSE_TIME_THRESHOLD_WARNING: parseNumber(process.env.RESPONSE_TIME_THRESHOLD_WARNING, 1000),
    RESPONSE_TIME_THRESHOLD_ERROR: parseNumber(process.env.RESPONSE_TIME_THRESHOLD_ERROR, 5000),
    MEMORY_USAGE_THRESHOLD_WARNING: parseNumber(process.env.MEMORY_USAGE_THRESHOLD_WARNING, 512),
    MEMORY_USAGE_THRESHOLD_ERROR: parseNumber(process.env.MEMORY_USAGE_THRESHOLD_ERROR, 1024),
    DB_QUERY_THRESHOLD_WARNING: parseNumber(process.env.DB_QUERY_THRESHOLD_WARNING, 500),
    DB_QUERY_THRESHOLD_ERROR: parseNumber(process.env.DB_QUERY_THRESHOLD_ERROR, 2000),
  };
}

// Export configuration
export const env = getEnvironmentConfig();

// Export individual configs for convenience
export const {
  // Core
  APP_ENV,
  NODE_ENV,
  LOG_LEVEL,
  DEBUG_MODE,
  
  // URLs
  NEXT_PUBLIC_APP_URL,
  NEXTAUTH_URL,
  
  // Database
  DATABASE_URL,
  DATABASE_READ_URL,
  DATABASE_CONNECTION_LIMIT,
  DATABASE_POOL_TIMEOUT,
  
  // Auth
  NEXTAUTH_SECRET,
  
  // AI Services
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  OPENAI_ORGANIZATION_ID,
  
  // Feature Flags
  FEATURE_AI_TUTORING,
  FEATURE_ADVANCED_ANALYTICS,
  FEATURE_PAYMENT_PROCESSING,
  FEATURE_SOCIAL_LOGIN,
  
  // Security
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SECURITY_HEADERS_STRICT,
  
  // Monitoring
  SENTRY_DSN,
  HEALTH_CHECK_ENABLED,
  METRICS_ENDPOINT_ENABLED,
} = env;

// Environment check helpers
export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
export const isTest = APP_ENV === 'test';

// Validation helper
export function validateProductionConfig(): void {
  if (!isProduction) {return;}
  
  const productionRequiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENAI_API_KEY',
    'SENTRY_DSN',
  ];
  
  const missingProdVars = productionRequiredVars.filter(
    (varName) => !env[varName as keyof EnvironmentConfig]
  );
  
  if (missingProdVars.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingProdVars.join(', ')}\n` +
      'These variables are required for production deployment.'
    );
  }
  
  // Validate URLs are HTTPS in production
  if (!NEXTAUTH_URL.startsWith('https://')) {
    throw new Error('NEXTAUTH_URL must use HTTPS in production');
  }
  
  if (!NEXT_PUBLIC_APP_URL.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTPS in production');
  }
  
  console.log('✅ Production environment configuration validated successfully');
}