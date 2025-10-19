// Third-party integrations index
// Phase 5.3 - Integration & APIs implementation

// Payment processing
export * from './stripe'

// Email services
export * from './email'
export * from './email-templates'

// File storage
export * from './storage'
export * from './uploadthing'

// Webhook handling
export * from './webhooks'
export { initializeWebhooks } from './webhooks/index'

// Backup and restore
export * from './backup'

// Initialize all integrations
export function initializeIntegrations(): void {
  console.log('Initializing all third-party integrations...')
  
  // Initialize webhooks
  const { initializeWebhooks } = require('./webhooks/index')
  initializeWebhooks()
  
  console.log('All integrations initialized successfully')
}

// Integration health check
export async function checkIntegrationsHealth(): Promise<{
  stripe: boolean
  email: boolean
  storage: boolean
  webhooks: boolean
  backup: boolean
}> {
  const health = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    email: !!process.env.RESEND_API_KEY,
    storage: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    webhooks: !!(process.env.STRIPE_WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET),
    backup: !!(process.env.AWS_S3_BACKUP_BUCKET || process.env.AWS_S3_BUCKET),
  }
  
  console.log('Integration health check:', health)
  return health
}