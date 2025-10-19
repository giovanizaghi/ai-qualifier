import { NextRequest, NextResponse } from "next/server"
import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { UserAnalyticsService } from "@/lib/user-analytics"
import { DashboardService } from "@/lib/dashboard-service"

interface ExportRequest {
  type: 'progress-report' | 'performance-dashboard' | 'admin-analytics' | 'user-data'
  format: 'pdf' | 'csv' | 'json' | 'excel'
  timeframe?: string
  filters?: Record<string, any>
  includePersonalData?: boolean
}

// POST /api/analytics/export - Export analytics data
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return badRequestResponse("Authentication required")
    }

    const body: ExportRequest = await req.json()
    const { type, format, timeframe = '30d', filters = {}, includePersonalData = false } = body

    if (!type || !format) {
      return badRequestResponse("Export type and format are required")
    }

    // Validate format
    const validFormats = ['pdf', 'csv', 'json', 'excel']
    if (!validFormats.includes(format)) {
      return badRequestResponse("Invalid export format")
    }

    let exportData: any
    let filename: string

    switch (type) {
      case 'progress-report':
        exportData = await generateProgressReportData(session.user.id, timeframe, includePersonalData)
        filename = `progress-report-${session.user.id}-${timeframe}`
        break
      
      case 'performance-dashboard':
        exportData = await generatePerformanceDashboardData(session.user.id, timeframe)
        filename = `performance-dashboard-${timeframe}`
        break
      
      case 'admin-analytics':
        // TODO: Check admin permissions
        exportData = await generateAdminAnalyticsData(timeframe, filters)
        filename = `admin-analytics-${timeframe}`
        break
      
      case 'user-data':
        exportData = await generateUserData(session.user.id, includePersonalData)
        filename = `user-data-${session.user.id}`
        break
      
      default:
        return badRequestResponse("Invalid export type")
    }

    // Generate the export file based on format
    const fileBuffer = await generateExportFile(exportData, format, filename)
    
    // Set appropriate headers
    const mimeTypes = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': mimeTypes[format],
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for data generation

async function generateProgressReportData(userId: string, timeframe: string, includePersonalData: boolean) {
  // Fetch progress report data
  const progressData = await fetch(`/api/analytics/progress-report?timeframe=${timeframe}&includeAnalytics=true&userId=${userId}`)
  const report = await progressData.json()

  // Remove personal data if not requested
  if (!includePersonalData) {
    delete report.user.email
    delete report.user.name
    report.user.id = 'USER_' + report.user.id.slice(-8)
  }

  return {
    generatedAt: new Date().toISOString(),
    timeframe,
    report: report.data
  }
}

async function generatePerformanceDashboardData(userId: string, timeframe: string) {
  // Fetch performance dashboard data
  const dashboardData = await DashboardService.getUserDashboardStats(userId)
  const categoryPerformance = await DashboardService.getCategoryPerformance(userId)
  const qualificationProgress = await DashboardService.getUserQualificationProgress(userId)

  return {
    generatedAt: new Date().toISOString(),
    timeframe,
    userId: 'USER_' + userId.slice(-8), // Anonymized
    dashboard: dashboardData,
    categoryPerformance,
    qualificationProgress
  }
}

async function generateAdminAnalyticsData(timeframe: string, filters: Record<string, any>) {
  // This would fetch admin analytics data
  // For now, return mock structure
  return {
    generatedAt: new Date().toISOString(),
    timeframe,
    filters,
    systemMetrics: {
      totalUsers: 0,
      activeUsers: 0,
      platformHealth: 'good'
    },
    userMetrics: {
      retention: {},
      segmentation: []
    },
    contentMetrics: {
      questionPerformance: [],
      categoryInsights: []
    }
  }
}

async function generateUserData(userId: string, includePersonalData: boolean) {
  // Fetch all user data for export (GDPR compliance)
  const patterns = await UserAnalyticsService.analyzeLearningPatterns(userId)
  const insights = await UserAnalyticsService.generatePerformanceInsights(userId)
  const dashboardStats = await DashboardService.getUserDashboardStats(userId)

  const userData = {
    generatedAt: new Date().toISOString(),
    userId: includePersonalData ? userId : 'USER_' + userId.slice(-8),
    learningPatterns: patterns,
    performanceInsights: insights,
    dashboardStats
  }

  if (!includePersonalData) {
    // Remove any personally identifiable information
    // This is a simplified approach - in production, you'd need more thorough anonymization
    userData.learningPatterns = anonymizeData(userData.learningPatterns)
    userData.performanceInsights = anonymizeData(userData.performanceInsights)
  }

  return userData
}

async function generateExportFile(data: any, format: string, filename: string): Promise<Buffer> {
  switch (format) {
    case 'json':
      return Buffer.from(JSON.stringify(data, null, 2))
    
    case 'csv':
      return generateCSV(data)
    
    case 'pdf':
      return await generatePDF(data, filename)
    
    case 'excel':
      return await generateExcel(data, filename)
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

function generateCSV(data: any): Buffer {
  // Convert data to CSV format
  // This is a simplified implementation
  const flattenedData = flattenObject(data)
  
  const headers = Object.keys(flattenedData)
  const values = Object.values(flattenedData)
  
  const csvContent = [
    headers.join(','),
    values.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')
  ].join('\n')
  
  return Buffer.from(csvContent)
}

async function generatePDF(data: any, filename: string): Promise<Buffer> {
  // In a real implementation, you'd use a library like puppeteer or PDFKit
  // For now, return a simple text-based PDF placeholder
  const pdfContent = `
PDF Export: ${filename}
Generated: ${new Date().toISOString()}

Data Summary:
${JSON.stringify(data, null, 2)}
`
  
  return Buffer.from(pdfContent)
}

async function generateExcel(data: any, filename: string): Promise<Buffer> {
  // In a real implementation, you'd use a library like exceljs
  // For now, return CSV format as placeholder
  return generateCSV(data)
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey))
      } else {
        flattened[newKey] = obj[key]
      }
    }
  }
  
  return flattened
}

function anonymizeData(data: any): any {
  // Simple anonymization - in production, use proper anonymization techniques
  const anonymized = JSON.parse(JSON.stringify(data))
  
  // Remove or hash identifiable fields
  const identifiableFields = ['userId', 'email', 'name', 'ipAddress']
  
  function anonymizeObject(obj: any) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (identifiableFields.includes(key)) {
          obj[key] = `ANONYMIZED_${key.toUpperCase()}`
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          anonymizeObject(obj[key])
        }
      }
    }
  }
  
  anonymizeObject(anonymized)
  return anonymized
}