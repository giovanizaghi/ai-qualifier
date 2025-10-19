import { registerGitHubWebhooks } from './github'
import { registerStripeWebhooks } from './stripe'

// Initialize all webhook handlers
export function initializeWebhooks(): void {
  console.log('Initializing webhook handlers...')
  
  // Register all webhook handlers
  registerStripeWebhooks()
  registerGitHubWebhooks()
  
  console.log('All webhook handlers initialized successfully')
}

// Export individual registration functions for selective initialization
export { registerStripeWebhooks, registerGitHubWebhooks }