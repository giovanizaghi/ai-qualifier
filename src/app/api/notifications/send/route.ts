import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendNotificationEmail } from '@/lib/integrations/email'
import { z } from 'zod'

// Validation schema for notification requests
const notificationSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow admin users to send notifications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = notificationSchema.parse(body)

    // Send notification email
    const result = await sendNotificationEmail({
      email: validatedData.recipientEmail,
      name: validatedData.recipientName,
      title: validatedData.title,
      message: validatedData.message,
      actionUrl: validatedData.actionUrl,
      actionText: validatedData.actionText,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send notification', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.data?.id || 'unknown',
    })
  } catch (error) {
    console.error('Notification API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}