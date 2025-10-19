import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { 
  successResponse,
  handleApiError,
  unauthorizedResponse,
  badRequestResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Issue {
  id: string
  title: string
  description: string
  type: 'bug' | 'error' | 'performance' | 'security' | 'user_report'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed'
  priority: number
  assignedTo?: string
  reportedBy?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  affectedUsers?: number
  reproduction?: string
  resolution?: string
  tags: string[]
  metadata: Record<string, any>
}

const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['bug', 'error', 'performance', 'security', 'user_report']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  priority: z.number().min(1).max(10).optional(),
  reproduction: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

// GET /api/issues - Get issues with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Only allow admin users to access issue tracking
    if (session.user.role !== 'admin') {
      return unauthorizedResponse("Admin access required")
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const severity = searchParams.get('severity') || 'all'
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (severity !== 'all') {
      where.severity = severity
    }
    
    if (type !== 'all') {
      where.type = type
    }

    // Get issues and generate mock data for demonstration
    const issues = await generateMockIssues(where, skip, limit)
    const stats = await getIssueStats()

    return successResponse({
      issues,
      stats,
      pagination: {
        page,
        limit,
        total: issues.length,
        pages: Math.ceil(issues.length / limit)
      }
    }, "Issues retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/issues - Create a new issue
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = createIssueSchema.safeParse(body)
    if (!validationResult.success) {
      return badRequestResponse("Invalid issue data")
    }

    const { title, description, type, severity, priority, reproduction, tags, metadata } = validationResult.data

    // Create issue record (using mock data structure for now)
    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const issue: Issue = {
      id: issueId,
      title,
      description,
      type,
      severity,
      status: 'open',
      priority: priority || (severity === 'critical' ? 10 : severity === 'high' ? 7 : severity === 'medium' ? 5 : 3),
      reportedBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      reproduction,
      tags: tags || [],
      metadata: {
        ...metadata,
        reportedBy: session.user.name || session.user.email,
        userAgent: req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      }
    }

    // In production, you would save this to a proper issues database table
    // For now, we'll just return the created issue

    // Send notifications for high severity issues
    if (severity === 'critical' || severity === 'high') {
      await sendIssueNotification(issue)
    }

    return successResponse(issue, "Issue created successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/issues/:id - Update issue status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return unauthorizedResponse("Admin access required")
    }

    const { pathname } = new URL(req.url)
    const issueId = pathname.split('/').pop()
    
    if (!issueId) {
      return badRequestResponse("Issue ID is required")
    }

    const body = await req.json()
    const { status, assignedTo, resolution, priority } = body

    // In production, you would update the actual database record
    // For now, we'll simulate the update
    
    const updatedIssue = {
      id: issueId,
      status,
      assignedTo,
      resolution,
      priority,
      updatedAt: new Date(),
      resolvedAt: status === 'resolved' ? new Date() : undefined
    }

    return successResponse(updatedIssue, "Issue updated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper function to generate mock issues data
async function generateMockIssues(where: any, skip: number, limit: number): Promise<Issue[]> {
  const mockIssues: Issue[] = [
    {
      id: 'issue_1',
      title: 'Assessment page loading slowly',
      description: 'Users report that the assessment page takes 5-10 seconds to load, particularly for assessments with many questions.',
      type: 'performance',
      severity: 'high',
      status: 'open',
      priority: 8,
      reportedBy: 'user_123',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      affectedUsers: 45,
      tags: ['performance', 'frontend', 'database'],
      metadata: {
        page: '/assessment/start',
        loadTime: '8.5s',
        userAgent: 'Mozilla/5.0...'
      }
    },
    {
      id: 'issue_2',
      title: 'Email verification not working',
      description: 'New users are not receiving email verification links after registration.',
      type: 'bug',
      severity: 'critical',
      status: 'investigating',
      priority: 10,
      assignedTo: 'admin_1',
      reportedBy: 'user_456',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      affectedUsers: 23,
      tags: ['email', 'authentication', 'critical'],
      metadata: {
        emailProvider: 'sendgrid',
        errorCode: 'SMTP_ERROR_421'
      }
    },
    {
      id: 'issue_3',
      title: 'Dashboard analytics not updating',
      description: 'User dashboard shows outdated analytics data. Last update appears to be from 6 hours ago.',
      type: 'bug',
      severity: 'medium',
      status: 'in_progress',
      priority: 6,
      assignedTo: 'admin_2',
      reportedBy: 'user_789',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      updatedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      affectedUsers: 12,
      tags: ['analytics', 'dashboard', 'data'],
      metadata: {
        lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        cachingIssue: true
      }
    },
    {
      id: 'issue_4',
      title: 'Mobile layout broken on iOS Safari',
      description: 'The assessment interface is not responsive on iOS Safari. Buttons are cut off and text overlaps.',
      type: 'bug',
      severity: 'medium',
      status: 'open',
      priority: 5,
      reportedBy: 'user_101',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      affectedUsers: 34,
      tags: ['mobile', 'ios', 'safari', 'responsive'],
      metadata: {
        device: 'iPhone 12',
        browser: 'Safari 14.0',
        viewportWidth: '375px'
      }
    },
    {
      id: 'issue_5',
      title: 'Feature request: Dark mode support',
      description: 'Multiple users have requested dark mode support for better user experience during night time usage.',
      type: 'user_report',
      severity: 'low',
      status: 'open',
      priority: 3,
      reportedBy: 'user_202',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      affectedUsers: 78,
      tags: ['feature-request', 'ui', 'accessibility'],
      metadata: {
        requestCount: 15,
        priority: 'enhancement'
      }
    }
  ]

  // Apply filters (simplified filtering for mock data)
  let filteredIssues = mockIssues

  if (where.status && where.status !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.status === where.status)
  }

  if (where.severity && where.severity !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.severity === where.severity)
  }

  if (where.type && where.type !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.type === where.type)
  }

  if (where.OR) {
    const searchTerm = where.OR[0]?.title?.contains?.toLowerCase() || ''
    filteredIssues = filteredIssues.filter(issue => 
      issue.title.toLowerCase().includes(searchTerm) || 
      issue.description.toLowerCase().includes(searchTerm)
    )
  }

  // Apply pagination
  return filteredIssues.slice(skip, skip + limit)
}

async function getIssueStats() {
  // Mock stats - in production, these would come from your issues database
  return {
    total: 45,
    open: 18,
    critical: 3,
    resolved: 22,
    averageResolutionTime: 18.5,
    issuesByType: [
      { type: 'bug', count: 20 },
      { type: 'performance', count: 8 },
      { type: 'user_report', count: 10 },
      { type: 'security', count: 2 },
      { type: 'error', count: 5 }
    ],
    issuesBySeverity: [
      { severity: 'critical', count: 3 },
      { severity: 'high', count: 8 },
      { severity: 'medium', count: 20 },
      { severity: 'low', count: 14 }
    ],
    recentTrends: [
      { date: '2024-10-19', count: 5 },
      { date: '2024-10-18', count: 3 },
      { date: '2024-10-17', count: 7 },
      { date: '2024-10-16', count: 2 },
      { date: '2024-10-15', count: 4 }
    ]
  }
}

async function sendIssueNotification(issue: Issue) {
  // In production, send notifications via:
  // - Email to dev team
  // - Slack webhook
  // - PagerDuty for critical issues
  // - Discord webhook
  // - SMS for critical security issues
  
  console.log(`High priority ${issue.severity} issue reported:`, {
    id: issue.id,
    title: issue.title,
    type: issue.type,
    severity: issue.severity,
    affectedUsers: issue.affectedUsers
  })
  
  // Example notification implementation:
  // if (issue.severity === 'critical') {
  //   await sendPagerDutyAlert(issue)
  //   await sendSlackAlert(issue)
  //   await sendEmailToDevTeam(issue)
  // } else if (issue.severity === 'high') {
  //   await sendSlackAlert(issue)
  //   await sendEmailToDevTeam(issue)
  // }
}