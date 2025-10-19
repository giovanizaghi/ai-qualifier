import { webhookRegistry, type WebhookEvent, verifyStripeSignature } from '../webhooks'
import { stripe } from '../stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail, sendNotificationEmail } from '../email'

// Stripe webhook event handlers
async function handleCustomerCreated(event: WebhookEvent): Promise<void> {
  const customer = event.data.object
  
  console.log('Stripe customer created:', customer.id)
  
  // Update user record with Stripe customer ID
  if (customer.email) {
    try {
      await prisma.user.update({
        where: { email: customer.email },
        data: { stripeCustomerId: customer.id },
      })
      
      console.log(`Updated user ${customer.email} with Stripe customer ID: ${customer.id}`)
    } catch (error) {
      console.error('Failed to update user with Stripe customer ID:', error)
    }
  }
}

async function handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
  const subscription = event.data.object
  
  console.log('Stripe subscription created:', subscription.id)
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer)
    
    if ('email' in customer && customer.email) {
      // Update user subscription status
      await prisma.user.update({
        where: { email: customer.email },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionPriceId: subscription.items.data[0]?.price.id,
        },
      })

      // Send welcome email for subscription
      await sendNotificationEmail({
        email: customer.email,
        name: customer.name || 'User',
        title: 'Welcome to AI Qualifier Premium!',
        message: `
          <p>Your subscription has been activated successfully. You now have access to premium features:</p>
          <ul>
            <li>Unlimited assessments</li>
            <li>Advanced analytics</li>
            <li>Priority support</li>
            <li>Custom learning paths</li>
          </ul>
        `,
        actionUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
        actionText: 'Access Your Dashboard',
      })
      
      console.log(`Updated user ${customer.email} with subscription: ${subscription.id}`)
    }
  } catch (error) {
    console.error('Failed to process subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
  const subscription = event.data.object
  
  console.log('Stripe subscription updated:', subscription.id)
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer)
    
    if ('email' in customer && customer.email) {
      // Update user subscription status
      await prisma.user.update({
        where: { email: customer.email },
        data: {
          subscriptionStatus: subscription.status,
          subscriptionPriceId: subscription.items.data[0]?.price.id,
        },
      })
      
      // Send notification for subscription changes
      if (subscription.status === 'canceled') {
        await sendNotificationEmail({
          email: customer.email,
          name: customer.name || 'User',
          title: 'Subscription Canceled',
          message: `
            <p>Your subscription has been canceled. You'll continue to have access to premium features until the end of your billing period.</p>
            <p>We're sorry to see you go! If you have any feedback, please let us know.</p>
          `,
          actionUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
          actionText: 'Manage Subscription',
        })
      }
      
      console.log(`Updated user ${customer.email} subscription status: ${subscription.status}`)
    }
  } catch (error) {
    console.error('Failed to process subscription update:', error)
  }
}

async function handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
  const paymentIntent = event.data.object
  
  console.log('Stripe payment succeeded:', paymentIntent.id)
  
  try {
    // Get customer details
    if (paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer)
      
      if ('email' in customer && customer.email) {
        // Send payment confirmation email
        await sendNotificationEmail({
          email: customer.email,
          name: customer.name || 'User',
          title: 'Payment Confirmed',
          message: `
            <p>Your payment of $${(paymentIntent.amount / 100).toFixed(2)} has been processed successfully.</p>
            <p>Thank you for your continued subscription to AI Qualifier Premium!</p>
          `,
          actionUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
          actionText: 'View Dashboard',
        })
        
        console.log(`Sent payment confirmation to ${customer.email}`)
      }
    }
  } catch (error) {
    console.error('Failed to process payment success:', error)
  }
}

async function handlePaymentFailed(event: WebhookEvent): Promise<void> {
  const paymentIntent = event.data.object
  
  console.log('Stripe payment failed:', paymentIntent.id)
  
  try {
    // Get customer details
    if (paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer)
      
      if ('email' in customer && customer.email) {
        // Send payment failure notification
        await sendNotificationEmail({
          email: customer.email,
          name: customer.name || 'User',
          title: 'Payment Failed',
          message: `
            <p>We were unable to process your payment of $${(paymentIntent.amount / 100).toFixed(2)}.</p>
            <p>Please update your payment method to continue your subscription.</p>
            <p>If you need assistance, please contact our support team.</p>
          `,
          actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
          actionText: 'Update Payment Method',
        })
        
        console.log(`Sent payment failure notification to ${customer.email}`)
      }
    }
  } catch (error) {
    console.error('Failed to process payment failure:', error)
  }
}

async function handleInvoicePaymentFailed(event: WebhookEvent): Promise<void> {
  const invoice = event.data.object
  
  console.log('Stripe invoice payment failed:', invoice.id)
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer)
    
    if ('email' in customer && customer.email) {
      // Send invoice failure notification
      await sendNotificationEmail({
        email: customer.email,
        name: customer.name || 'User',
        title: 'Invoice Payment Failed',
        message: `
          <p>We were unable to collect payment for your invoice of $${(invoice.amount_due / 100).toFixed(2)}.</p>
          <p>Please update your payment method to avoid service interruption.</p>
          <p>Your subscription will be canceled if payment is not received within 7 days.</p>
        `,
        actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
        actionText: 'Update Payment Method',
      })
      
      console.log(`Sent invoice failure notification to ${customer.email}`)
    }
  } catch (error) {
    console.error('Failed to process invoice payment failure:', error)
  }
}

// Register Stripe webhook handlers
export function registerStripeWebhooks(): void {
  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['customer.created'],
    handler: handleCustomerCreated,
    verifySignature: verifyStripeSignature,
  })

  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['customer.subscription.created'],
    handler: handleSubscriptionCreated,
    verifySignature: verifyStripeSignature,
  })

  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['customer.subscription.updated'],
    handler: handleSubscriptionUpdated,
    verifySignature: verifyStripeSignature,
  })

  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['payment_intent.succeeded'],
    handler: handlePaymentSucceeded,
    verifySignature: verifyStripeSignature,
  })

  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['payment_intent.payment_failed'],
    handler: handlePaymentFailed,
    verifySignature: verifyStripeSignature,
  })

  webhookRegistry.register({
    source: 'stripe',
    eventTypes: ['invoice.payment_failed'],
    handler: handleInvoicePaymentFailed,
    verifySignature: verifyStripeSignature,
  })

  console.log('Stripe webhook handlers registered')
}