import { NextRequest, NextResponse } from 'next/server'

import { processWebhook } from '@/lib/integrations/webhooks'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text()
    
    // Get headers
    const signature = request.headers.get('x-hub-signature-256')
    const githubEvent = request.headers.get('x-github-event')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-hub-signature-256 header' },
        { status: 400 }
      )
    }

    if (!githubEvent) {
      return NextResponse.json(
        { error: 'Missing x-github-event header' },
        { status: 400 }
      )
    }

    // Process the webhook
    const result = await processWebhook('github', body, {
      signature,
      'x-github-event': githubEvent,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('GitHub webhook error:', error)
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}