import { headers } from 'next/headers'
import crypto from 'crypto'

// Webhook event types
export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, any>
  timestamp: string
  source: string
  signature?: string
}

export interface WebhookHandler {
  source: string
  eventTypes: string[]
  handler: (event: WebhookEvent) => Promise<void>
  verifySignature?: (payload: string, signature: string, secret: string) => boolean
}

export interface WebhookConfig {
  endpoint: string
  secret: string
  timeout?: number
  retries?: number
}

// Webhook verification functions
export function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    const signatureHeader = signature.replace('v1=', '')
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signatureHeader, 'hex')
    )
  } catch (error) {
    console.error('Stripe signature verification failed:', error)
    return false
  }
}

export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    const signatureHeader = signature.replace('sha256=', '')
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signatureHeader, 'hex')
    )
  } catch (error) {
    console.error('GitHub signature verification failed:', error)
    return false
  }
}

export function verifyGenericSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch (error) {
    console.error('Generic signature verification failed:', error)
    return false
  }
}

// Webhook processing queue
class WebhookQueue {
  private queue: WebhookEvent[] = []
  private processing = false

  async addEvent(event: WebhookEvent): Promise<void> {
    this.queue.push(event)
    
    if (!this.processing) {
      await this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.queue.length > 0) {
      const event = this.queue.shift()
      if (event) {
        try {
          await this.processEvent(event)
        } catch (error) {
          console.error('Failed to process webhook event:', error)
          // Implement retry logic here if needed
        }
      }
    }

    this.processing = false
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    const handlers = webhookRegistry.getHandlers(event.source, event.type)
    
    await Promise.allSettled(
      handlers.map(handler => handler.handler(event))
    )
  }
}

// Webhook registry
class WebhookRegistry {
  private handlers: Map<string, WebhookHandler[]> = new Map()

  register(handler: WebhookHandler): void {
    const key = `${handler.source}:${handler.eventTypes.join(',')}`
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, [])
    }
    
    this.handlers.get(key)!.push(handler)
  }

  getHandlers(source: string, eventType: string): WebhookHandler[] {
    const handlers: WebhookHandler[] = []
    
    for (const [key, handlerList] of this.handlers.entries()) {
      const [handlerSource] = key.split(':')
      
      if (handlerSource === source) {
        const matchingHandlers = handlerList.filter(handler =>
          handler.eventTypes.includes(eventType) || handler.eventTypes.includes('*')
        )
        handlers.push(...matchingHandlers)
      }
    }
    
    return handlers
  }

  unregister(source: string, eventTypes: string[]): void {
    const key = `${source}:${eventTypes.join(',')}`
    this.handlers.delete(key)
  }

  clear(): void {
    this.handlers.clear()
  }
}

// Global instances
export const webhookQueue = new WebhookQueue()
export const webhookRegistry = new WebhookRegistry()

// Webhook processor
export async function processWebhook(
  source: string,
  payload: string,
  headers: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse the webhook payload
    let event: WebhookEvent
    
    try {
      const data = JSON.parse(payload)
      event = {
        id: data.id || crypto.randomUUID(),
        type: data.type || 'unknown',
        data: data,
        timestamp: new Date().toISOString(),
        source,
        signature: headers['signature'] || headers['x-signature'] || headers['x-hub-signature-256'],
      }
    } catch (error) {
      return { success: false, error: 'Invalid JSON payload' }
    }

    // Verify signature if required
    const handlers = webhookRegistry.getHandlers(source, event.type)
    
    if (handlers.length > 0) {
      const handler = handlers[0]
      
      if (handler.verifySignature && event.signature) {
        const secret = getWebhookSecret(source)
        
        if (!secret) {
          return { success: false, error: 'Webhook secret not configured' }
        }
        
        const isValid = handler.verifySignature(payload, event.signature, secret)
        
        if (!isValid) {
          return { success: false, error: 'Invalid signature' }
        }
      }
    }

    // Add to processing queue
    await webhookQueue.addEvent(event)

    return { success: true }
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Helper function to get webhook secrets
function getWebhookSecret(source: string): string | null {
  const secrets: Record<string, string> = {
    stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
    github: process.env.GITHUB_WEBHOOK_SECRET || '',
    discord: process.env.DISCORD_WEBHOOK_SECRET || '',
    uploadthing: process.env.UPLOADTHING_WEBHOOK_SECRET || '',
  }
  
  return secrets[source] || null
}

// Webhook event utilities
export function createWebhookEvent(
  type: string,
  data: Record<string, any>,
  source: string
): WebhookEvent {
  return {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: new Date().toISOString(),
    source,
  }
}

export function isWebhookEventValid(event: WebhookEvent): boolean {
  return !!(
    event.id &&
    event.type &&
    event.data &&
    event.timestamp &&
    event.source
  )
}

// Webhook logging
export async function logWebhookEvent(event: WebhookEvent, status: 'success' | 'failed', error?: string): Promise<void> {
  const logEntry = {
    id: event.id,
    type: event.type,
    source: event.source,
    timestamp: event.timestamp,
    status,
    error,
    processedAt: new Date().toISOString(),
  }
  
  // Here you could save to database, send to logging service, etc.
  console.log('Webhook event processed:', logEntry)
}