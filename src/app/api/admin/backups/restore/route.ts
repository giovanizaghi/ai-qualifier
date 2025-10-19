import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { backupService } from '@/lib/integrations/backup'

// Validation schema for restore requests
const restoreBackupSchema = z.object({
  backupId: z.string().min(1, 'Backup ID is required'),
  tables: z.array(z.string()).optional(),
  dryRun: z.boolean().optional().default(false),
  targetDatabase: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = restoreBackupSchema.parse(body)

    // Perform restore
    const result = await backupService.restoreBackup(validatedData.backupId, {
      tables: validatedData.tables,
      dryRun: validatedData.dryRun,
      targetDatabase: validatedData.targetDatabase,
    })

    return NextResponse.json({
      success: result.success,
      restoredTables: result.restoredTables,
      errors: result.errors,
      dryRun: validatedData.dryRun,
    })
  } catch (error) {
    console.error('Restore backup API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Restore failed' },
      { status: 500 }
    )
  }
}