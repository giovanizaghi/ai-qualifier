import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email template types
export interface EmailTemplate {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export interface BulkEmailTemplate {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface WelcomeEmailData {
  name: string
  email: string
  loginUrl: string
}

export interface AssessmentCompletionData {
  name: string
  email: string
  assessmentName: string
  score: number
  dashboardUrl: string
}

export interface PasswordResetData {
  name: string
  email: string
  resetToken: string
  resetUrl: string
}

export interface NotificationEmailData {
  name: string
  email: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}

// Default email configuration
const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ai-qualifier.com'

// Email sending functions
export async function sendEmail(template: EmailTemplate) {
  try {
    // Ensure we have either html or text content
    if (!template.html && !template.text) {
      throw new Error('Email must have either html or text content')
    }

    const emailData: any = {
      from: template.from || DEFAULT_FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      replyTo: template.replyTo,
    }

    // Add content based on what's available
    if (template.html) {
      emailData.html = template.html
    }
    if (template.text) {
      emailData.text = template.text
    }

    const result = await resend.emails.send(emailData)

    return { success: true, data: result }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendBulkEmail(template: BulkEmailTemplate) {
  try {
    // Ensure we have either html or text content
    if (!template.html && !template.text) {
      throw new Error('Email must have either html or text content')
    }

    const emailData: any = {
      from: template.from || DEFAULT_FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      replyTo: template.replyTo,
      cc: template.cc,
      bcc: template.bcc,
    }

    // Add content based on what's available
    if (template.html) {
      emailData.html = template.html
    }
    if (template.text) {
      emailData.text = template.text
    }

    const result = await resend.emails.send(emailData)

    return { success: true, data: result }
  } catch (error) {
    console.error('Bulk email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to AI Qualifier</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">Welcome to AI Qualifier!</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>Welcome to AI Qualifier! We're excited to have you join our platform for AI skill assessment and qualification.</p>
      
      <p>Your account has been successfully created with the email: <strong>${data.email}</strong></p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.loginUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Get Started
        </a>
      </div>
      
      <p>Here's what you can do next:</p>
      <ul>
        <li>Complete your profile setup</li>
        <li>Take your first AI qualification assessment</li>
        <li>Explore learning paths tailored to your goals</li>
        <li>Track your progress on the dashboard</li>
      </ul>
      
      <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
      
      <p>Best regards,<br>The AI Qualifier Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        If you didn't create this account, please ignore this email or contact us at support@ai-qualifier.com
      </p>
    </body>
    </html>
  `

  const text = `
    Welcome to AI Qualifier!
    
    Hi ${data.name},
    
    Welcome to AI Qualifier! We're excited to have you join our platform for AI skill assessment and qualification.
    
    Your account has been successfully created with the email: ${data.email}
    
    Get started: ${data.loginUrl}
    
    Here's what you can do next:
    - Complete your profile setup
    - Take your first AI qualification assessment
    - Explore learning paths tailored to your goals
    - Track your progress on the dashboard
    
    If you have any questions, feel free to reply to this email or contact our support team.
    
    Best regards,
    The AI Qualifier Team
  `

  return await sendEmail({
    to: data.email,
    subject: 'Welcome to AI Qualifier - Get Started Today!',
    html,
    text,
  })
}

export async function sendAssessmentCompletionEmail(data: AssessmentCompletionData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Assessment Completed</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">Assessment Completed!</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>Congratulations! You have successfully completed the <strong>${data.assessmentName}</strong> assessment.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h2 style="color: #28a745; margin: 0;">Your Score: ${data.score}%</h2>
      </div>
      
      <p>Your results have been recorded and you can view detailed analytics on your dashboard.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Dashboard
        </a>
      </div>
      
      <p>Based on your performance, we'll provide personalized recommendations for your next steps in your AI learning journey.</p>
      
      <p>Keep up the great work!</p>
      
      <p>Best regards,<br>The AI Qualifier Team</p>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.email,
    subject: `Assessment Completed: ${data.assessmentName} - Score: ${data.score}%`,
    html,
  })
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>We received a request to reset your password for your AI Qualifier account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>This link will expire in 1 hour for security reasons.</p>
      
      <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      
      <p>Best regards,<br>The AI Qualifier Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        For security, this link will expire in 1 hour. If you need help, contact support@ai-qualifier.com
      </p>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.email,
    subject: 'Password Reset Request - AI Qualifier',
    html,
  })
}

export async function sendNotificationEmail(data: NotificationEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">${data.title}</h1>
      
      <p>Hi ${data.name},</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${data.message}
      </div>
      
      ${data.actionUrl && data.actionText ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.actionUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${data.actionText}
          </a>
        </div>
      ` : ''}
      
      <p>Best regards,<br>The AI Qualifier Team</p>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.email,
    subject: data.title,
    html,
  })
}

// Batch email sending
export async function sendBulkEmails(emails: EmailTemplate[]) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length

  const failed = results.length - successful

  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}