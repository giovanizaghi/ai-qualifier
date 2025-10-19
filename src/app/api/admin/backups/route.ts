import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { backupService, defaultBackupConfigs, type BackupConfig } from '@/lib/integrations/backup'
import { z } from 'zod'

// Validation schema for backup creation
const createBackupSchema = z.object({
  name: z.string().min(1, 'Backup name is required'),
  includeTables: z.array(z.string()).optional().default([]),
  excludeTables: z.array(z.string()).optional(),
  compress: z.boolean().optional().default(true),
  encrypt: z.boolean().optional().default(true),
  notifications: z.object({
    onSuccess: z.boolean().optional().default(false),
    onFailure: z.boolean().optional().default(true),
    emails: z.array(z.string().email()).optional().default([]),
  }).optional().default(() => ({
    onSuccess: false,
    onFailure: true,
    emails: [],
  })),
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
    const validatedData = createBackupSchema.parse(body)

    // Create backup configuration
    const config: BackupConfig = {
      name: validatedData.name,
      schedule: '', // Manual backup, no schedule
      includeTables: validatedData.includeTables,
      excludeTables: validatedData.excludeTables,
      compress: validatedData.compress,
      encrypt: validatedData.encrypt,
      retentionDays: 30, // Default retention
      notifications: {
        onSuccess: validatedData.notifications.onSuccess,
        onFailure: validatedData.notifications.onFailure,
        emails: validatedData.notifications.emails.length > 0 
          ? validatedData.notifications.emails 
          : [process.env.ADMIN_EMAIL || 'admin@ai-qualifier.com'],
      },
    }

    // Create backup
    const metadata = await backupService.createBackup(config)

    return NextResponse.json({
      success: true,
      backup: metadata,
    })
  } catch (error) {
    console.error('Create backup API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup creation failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    // List all backups
    const backups = await backupService.listBackups()

    return NextResponse.json({
      backups,
      defaultConfigs: defaultBackupConfigs,
    })
  } catch (error) {
    console.error('List backups API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    )
  }
}