import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { downloadFromS3 } from '@/lib/integrations/storage'

// Validation schema for file download requests
const fileDownloadSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  expires: z.number().positive().optional().default(3600), // 1 hour default
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = fileDownloadSchema.parse(body)

    // Check if user owns the file or is admin
    const userId = session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin && !validatedData.key.includes(userId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate download URL
    const downloadUrl = await downloadFromS3({
      key: validatedData.key,
      expires: validatedData.expires,
    })

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresIn: validatedData.expires,
    })
  } catch (error) {
    console.error('File download API error:', error)
    
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