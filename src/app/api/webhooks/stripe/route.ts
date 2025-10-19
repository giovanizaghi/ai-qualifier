import { NextRequest, NextResponse } from 'next/server'

import { processWebhook } from '@/lib/integrations/webhooks'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text()
    
    // Get headers
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Process the webhook
    const result = await processWebhook('stripe', body, {
      signature,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}