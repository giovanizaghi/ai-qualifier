// Environment configuration with validation
// This ensures all required environment variables are properly set

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // AI Services
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  
  // External Services
  RESEND_API_KEY?: string;
  UPLOADTHING_SECRET?: string;
  UPLOADTHING_APP_ID?: string;
  
  // Analytics
  VERCEL_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
  
  // Payments (optional)
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // App Configuration
  APP_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;
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

  return {
    // Database
    DATABASE_URL: process.env.DATABASE_URL!,
    
    // Authentication
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    
    // AI Services
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    
    // External Services
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    
    // Analytics
    VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,
    
    // Payments
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    // App Configuration
    APP_ENV: (process.env.APP_ENV as any) || 'development',
    LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'debug',
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  };
}

// Export configuration
export const env = getEnvironmentConfig();

// Export individual configs for convenience
export const {
  DATABASE_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  APP_ENV,
  LOG_LEVEL,
} = env;