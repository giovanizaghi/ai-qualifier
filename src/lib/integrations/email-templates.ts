// Email template management system
export interface EmailTemplateData {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
  category: 'auth' | 'assessment' | 'notification' | 'marketing'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Predefined email templates
export const emailTemplates: Record<string, EmailTemplateData> = {
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to AI Qualifier - {{name}}!',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to AI Qualifier</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome to AI Qualifier!</h1>
        
        <p>Hi {{name}},</p>
        
        <p>Welcome to AI Qualifier! We're excited to have you join our platform for AI skill assessment and qualification.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{loginUrl}}" 
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
      </body>
      </html>
    `,
    textContent: `
      Welcome to AI Qualifier!
      
      Hi {{name}},
      
      Welcome to AI Qualifier! We're excited to have you join our platform for AI skill assessment and qualification.
      
      Get started: {{loginUrl}}
      
      Here's what you can do next:
      - Complete your profile setup
      - Take your first AI qualification assessment
      - Explore learning paths tailored to your goals
      - Track your progress on the dashboard
      
      If you have any questions, feel free to reply to this email or contact our support team.
      
      Best regards,
      The AI Qualifier Team
    `,
    variables: ['name', 'loginUrl'],
    category: 'auth',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  assessmentComplete: {
    id: 'assessmentComplete',
    name: 'Assessment Completion',
    subject: 'Assessment Completed: {{assessmentName}} - Score: {{score}}%',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Assessment Completed</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Assessment Completed!</h1>
        
        <p>Hi {{name}},</p>
        
        <p>Congratulations! You have successfully completed the <strong>{{assessmentName}}</strong> assessment.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h2 style="color: #28a745; margin: 0;">Your Score: {{score}}%</h2>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <p>Based on your performance, we'll provide personalized recommendations for your next steps in your AI learning journey.</p>
        
        <p>Keep up the great work!</p>
        
        <p>Best regards,<br>The AI Qualifier Team</p>
      </body>
      </html>
    `,
    variables: ['name', 'assessmentName', 'score', 'dashboardUrl'],
    category: 'assessment',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  passwordReset: {
    id: 'passwordReset',
    name: 'Password Reset',
    subject: 'Password Reset Request - AI Qualifier',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
        
        <p>Hi {{name}},</p>
        
        <p>We received a request to reset your password for your AI Qualifier account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p>Best regards,<br>The AI Qualifier Team</p>
      </body>
      </html>
    `,
    variables: ['name', 'resetUrl'],
    category: 'auth',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  weeklyProgress: {
    id: 'weeklyProgress',
    name: 'Weekly Progress Report',
    subject: 'Your Weekly AI Learning Progress - {{name}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Progress Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Your Weekly Progress Report</h1>
        
        <p>Hi {{name}},</p>
        
        <p>Here's a summary of your AI learning progress this week:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>This Week's Achievements:</h3>
          <ul>
            <li>Assessments completed: {{assessmentsCompleted}}</li>
            <li>Total study time: {{studyTime}} hours</li>
            <li>New skills acquired: {{newSkills}}</li>
            <li>Current streak: {{streak}} days</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Report
          </a>
        </div>
        
        <p>Keep up the great work! Consistency is key to mastering AI skills.</p>
        
        <p>Best regards,<br>The AI Qualifier Team</p>
      </body>
      </html>
    `,
    variables: ['name', 'assessmentsCompleted', 'studyTime', 'newSkills', 'streak', 'dashboardUrl'],
    category: 'notification',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

// Template utility functions
export function getTemplate(templateId: string): EmailTemplateData | null {
  return emailTemplates[templateId] || null
}

export function renderTemplate(
  template: EmailTemplateData,
  variables: Record<string, string>
): { subject: string; htmlContent: string; textContent?: string } {
  let subject = template.subject
  let htmlContent = template.htmlContent
  let textContent = template.textContent

  // Replace variables in all content
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value)
    if (textContent) {
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value)
    }
  }

  return {
    subject,
    htmlContent,
    textContent,
  }
}

export function validateTemplateVariables(
  template: EmailTemplateData,
  variables: Record<string, string>
): { isValid: boolean; missingVariables: string[] } {
  const missingVariables = template.variables.filter(
    variable => !(variable in variables)
  )

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  }
}

export function getTemplatesByCategory(category: EmailTemplateData['category']): EmailTemplateData[] {
  return Object.values(emailTemplates).filter(
    template => template.category === category && template.isActive
  )
}

export function getAllTemplates(): EmailTemplateData[] {
  return Object.values(emailTemplates).filter(template => template.isActive)
}