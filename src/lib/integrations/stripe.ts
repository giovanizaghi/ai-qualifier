import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

// Stripe configuration types
export interface StripeProductOptions {
  name: string
  description?: string
  metadata?: Record<string, string>
}

export interface StripePriceOptions {
  unit_amount: number
  currency: string
  recurring?: {
    interval: 'month' | 'year'
    interval_count?: number
  }
  metadata?: Record<string, string>
}

// Helper functions for common Stripe operations
export async function createCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createProduct(options: StripeProductOptions) {
  return await stripe.products.create(options)
}

export async function createPrice(productId: string, options: StripePriceOptions) {
  return await stripe.prices.create({
    product: productId,
    ...options,
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function retrieveSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

// Webhook signature verification
export function verifyWebhookSignature(
  body: string,
  signature: string,
  endpointSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`)
  }
}