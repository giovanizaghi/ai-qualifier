import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteFromS3, deleteMultipleFiles } from '@/lib/integrations/storage'
import { z } from 'zod'

// Validation schema for file deletion requests
const fileDeletionSchema = z.object({
  keys: z.array(z.string().min(1, 'File key cannot be empty')).min(1, 'At least one file key is required'),
})

export async function DELETE(request: NextRequest) {
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
    const validatedData = fileDeletionSchema.parse(body)

    // Check if user owns the files or is admin
    const userId = session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const unauthorizedFiles = validatedData.keys.filter(key => !key.includes(userId))
      if (unauthorizedFiles.length > 0) {
        return NextResponse.json(
          { 
            error: 'Access denied', 
            unauthorizedFiles,
          },
          { status: 403 }
        )
      }
    }

    // Delete files
    let results
    if (validatedData.keys.length === 1) {
      const success = await deleteFromS3(validatedData.keys[0])
      results = [success]
    } else {
      results = await deleteMultipleFiles(validatedData.keys)
    }

    // Count successful and failed deletions
    const successful = results.filter(result => result).length
    const failed = results.length - successful

    return NextResponse.json({
      success: failed === 0,
      results: {
        total: results.length,
        successful,
        failed,
        deletedKeys: validatedData.keys.filter((_, index) => results[index]),
        failedKeys: validatedData.keys.filter((_, index) => !results[index]),
      },
    })
  } catch (error) {
    console.error('File deletion API error:', error)
    
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