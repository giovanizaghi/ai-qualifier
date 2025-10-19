import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { processFileUpload, uploadMultipleFiles } from '@/lib/integrations/storage'

// Validation schema for file upload requests
const fileUploadSchema = z.object({
  folder: z.string().optional().default('uploads'),
  maxSizeMB: z.number().positive().optional().default(10),
  allowedTypes: z.array(z.string()).optional().default(['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']),
  metadata: z.record(z.string(), z.string()).optional().default({}),
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

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const optionsJson = formData.get('options') as string
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Parse and validate options
    let options = {}
    if (optionsJson) {
      try {
        options = JSON.parse(optionsJson)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid options JSON' },
          { status: 400 }
        )
      }
    }

    const validatedOptions = fileUploadSchema.parse(options)

    // Process file uploads
    let results
    if (files.length === 1) {
      results = [await processFileUpload(files[0], session.user.id, validatedOptions)]
    } else {
      results = await uploadMultipleFiles(files, session.user.id, validatedOptions)
    }

    // Check for any failures
    const successful = results.filter(result => result.success)
    const failed = results.filter(result => !result.success)

    return NextResponse.json({
      success: failed.length === 0,
      results: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        uploads: successful.map(result => ({
          key: result.key,
          url: result.url,
        })),
        errors: failed.map(result => result.error),
      },
    })
  } catch (error) {
    console.error('File upload API error:', error)
    
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