import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendBulkEmails } from '@/lib/integrations/email'
import { z } from 'zod'

// Validation schema for bulk notification requests
const bulkNotificationSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
  })).min(1, 'At least one recipient is required').max(100, 'Maximum 100 recipients allowed'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
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

    // Only allow admin users to send bulk emails
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bulkNotificationSchema.parse(body)

    // Prepare email templates for each recipient
    const emailTemplates = validatedData.recipients.map(recipient => ({
      to: recipient.email,
      subject: validatedData.subject,
      html: validatedData.htmlContent.replace(/\{\{name\}\}/g, recipient.name),
      text: validatedData.textContent?.replace(/\{\{name\}\}/g, recipient.name),
      from: validatedData.from,
      replyTo: validatedData.replyTo,
    }))

    // Send bulk emails
    const result = await sendBulkEmails(emailTemplates)

    return NextResponse.json({
      success: true,
      results: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      },
    })
  } catch (error) {
    console.error('Bulk notification API error:', error)
    
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