import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/integrations/email'
import { getTemplate, renderTemplate, validateTemplateVariables } from '@/lib/integrations/email-templates'

// Validation schema for templated email requests
const templatedEmailSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  recipientEmail: z.string().email('Invalid email address'),
  variables: z.record(z.string(), z.string()),
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = templatedEmailSchema.parse(body)

    // Get email template
    const template = getTemplate(validatedData.templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validate template variables
    const validation = validateTemplateVariables(template, validatedData.variables)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Missing required variables', 
          missingVariables: validation.missingVariables 
        },
        { status: 400 }
      )
    }

    // Render template with variables
    const renderedTemplate = renderTemplate(template, validatedData.variables)

    // Send email
    const result = await sendEmail({
      to: validatedData.recipientEmail,
      subject: renderedTemplate.subject,
      html: renderedTemplate.htmlContent,
      text: renderedTemplate.textContent,
      from: validatedData.from,
      replyTo: validatedData.replyTo,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templateId: validatedData.templateId,
      messageId: result.data?.data?.id || 'unknown',
    })
  } catch (error) {
    console.error('Templated email API error:', error)
    
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

// Get available templates
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow admin users to view templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Return all available templates (without content for security)
    const templates = Object.values(await import('@/lib/integrations/email-templates').then(m => m.emailTemplates))
      .filter(template => template.isActive)
      .map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        variables: template.variables,
        category: template.category,
      }))

    return NextResponse.json({
      templates,
    })
  } catch (error) {
    console.error('Get templates API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}