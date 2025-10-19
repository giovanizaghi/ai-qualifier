import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for validating web vitals data
const webVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number(),
  navigationType: z.string(),
  id: z.string(),
  timestamp: z.number(),
  url: z.string(),
  userAgent: z.string(),
})

// In-memory storage for demo (use database in production)
const webVitalsData: Array<z.infer<typeof webVitalSchema> & { sessionId: string }> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the incoming data
    const validatedData = webVitalSchema.parse(body)
    
    // Generate a session ID based on user agent and timestamp
    const sessionId = Buffer.from(`${validatedData.userAgent}-${Math.floor(validatedData.timestamp / 60000)}`).toString('base64')
    
    // Store the data (in production, save to database)
    webVitalsData.push({
      ...validatedData,
      sessionId,
    })
    
    // Keep only the last 1000 entries to prevent memory issues
    if (webVitalsData.length > 1000) {
      webVitalsData.splice(0, webVitalsData.length - 1000)
    }
    
    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      if (validatedData.rating === 'poor') {
        console.warn(`🚨 Poor ${validatedData.name} performance: ${validatedData.value}ms`)
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Web Vitals API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return aggregated web vitals data
    const summary = webVitalsData.reduce((acc, vital) => {
      if (!acc[vital.name]) {
        acc[vital.name] = {
          count: 0,
          totalValue: 0,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
          latest: null,
        }
      }
      
      acc[vital.name].count++
      acc[vital.name].totalValue += vital.value
      acc[vital.name].ratings[vital.rating]++
      
      if (!acc[vital.name].latest || vital.timestamp > acc[vital.name].latest.timestamp) {
        acc[vital.name].latest = vital
      }
      
      return acc
    }, {} as Record<string, any>)
    
    // Calculate averages and percentages
    Object.keys(summary).forEach(metricName => {
      const metric = summary[metricName]
      metric.average = metric.totalValue / metric.count
      metric.goodPercent = (metric.ratings.good / metric.count) * 100
      metric.needsImprovementPercent = (metric.ratings['needs-improvement'] / metric.count) * 100
      metric.poorPercent = (metric.ratings.poor / metric.count) * 100
    })
    
    return NextResponse.json({
      summary,
      totalSessions: new Set(webVitalsData.map(v => v.sessionId)).size,
      totalMeasurements: webVitalsData.length,
      lastUpdated: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Web Vitals GET API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}