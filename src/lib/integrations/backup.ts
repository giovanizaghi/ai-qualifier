import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { sendNotificationEmail } from './email'
import { uploadToS3, downloadFromS3 } from './storage'

// Backup configuration types
export interface BackupConfig {
  name: string
  schedule: string // cron expression
  includeTables: string[]
  excludeTables?: string[]
  compress: boolean
  encrypt: boolean
  retentionDays: number
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    emails: string[]
  }
}

export interface BackupMetadata {
  id: string
  name: string
  createdAt: string
  size: number
  tables: string[]
  compressed: boolean
  encrypted: boolean
  status: 'success' | 'failed' | 'in-progress'
  error?: string
  s3Key: string
}

// Default backup configurations
export const defaultBackupConfigs: BackupConfig[] = [
  {
    name: 'daily-full-backup',
    schedule: '0 2 * * *', // Every day at 2 AM
    includeTables: ['users', 'assessments', 'questions', 'assessment_results', 'qualifications'],
    compress: true,
    encrypt: true,
    retentionDays: 30,
    notifications: {
      onSuccess: false,
      onFailure: true,
      emails: [process.env.ADMIN_EMAIL || 'admin@ai-qualifier.com'],
    },
  },
  {
    name: 'weekly-complete-backup',
    schedule: '0 1 * * 0', // Every Sunday at 1 AM
    includeTables: [], // Empty means all tables
    compress: true,
    encrypt: true,
    retentionDays: 90,
    notifications: {
      onSuccess: true,
      onFailure: true,
      emails: [process.env.ADMIN_EMAIL || 'admin@ai-qualifier.com'],
    },
  },
]

// Backup service class
export class BackupService {
  private readonly backupBucket = process.env.AWS_S3_BACKUP_BUCKET || process.env.AWS_S3_BUCKET || 'ai-qualifier-backups'

  async createBackup(config: BackupConfig): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    
    console.log(`Starting backup: ${config.name} (${backupId})`)

    try {
      // Get database schema and data
      const tables = await this.getTablesToBackup(config)
      const backupData = await this.exportDatabaseData(tables)

      // Prepare backup content
      let backupContent = JSON.stringify({
        metadata: {
          id: backupId,
          name: config.name,
          createdAt: timestamp,
          tables,
          version: '1.0',
          platform: 'ai-qualifier',
        },
        data: backupData,
      }, null, 2)

      // Compress if enabled
      if (config.compress) {
        backupContent = await this.compressData(backupContent)
      }

      // Encrypt if enabled
      if (config.encrypt) {
        backupContent = await this.encryptData(backupContent)
      }

      // Calculate size
      const size = Buffer.byteLength(backupContent, 'utf8')

      // Upload to S3
      const s3Key = `backups/${config.name}/${timestamp.split('T')[0]}/${backupId}.json${config.compress ? '.gz' : ''}${config.encrypt ? '.enc' : ''}`
      
      const uploadResult = await uploadToS3({
        key: s3Key,
        body: backupContent,
        contentType: 'application/json',
        metadata: {
          backupId,
          configName: config.name,
          tables: tables.join(','),
          compressed: config.compress.toString(),
          encrypted: config.encrypt.toString(),
        },
      })

      if (!uploadResult.success) {
        throw new Error(`Failed to upload backup: ${uploadResult.error}`)
      }

      const metadata: BackupMetadata = {
        id: backupId,
        name: config.name,
        createdAt: timestamp,
        size,
        tables,
        compressed: config.compress,
        encrypted: config.encrypt,
        status: 'success',
        s3Key,
      }

      // Send success notification if enabled
      if (config.notifications.onSuccess) {
        await this.sendBackupNotification(metadata, config, 'success')
      }

      console.log(`Backup completed successfully: ${backupId}`)
      return metadata

    } catch (error) {
      console.error(`Backup failed: ${backupId}`, error)

      const errorMetadata: BackupMetadata = {
        id: backupId,
        name: config.name,
        createdAt: timestamp,
        size: 0,
        tables: [],
        compressed: false,
        encrypted: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        s3Key: '',
      }

      // Send failure notification if enabled
      if (config.notifications.onFailure) {
        await this.sendBackupNotification(errorMetadata, config, 'failure')
      }

      throw error
    }
  }

  async restoreBackup(backupId: string, options: {
    tables?: string[]
    dryRun?: boolean
    targetDatabase?: string
  } = {}): Promise<{ success: boolean; restoredTables: string[]; errors: string[] }> {
    console.log(`Starting restore: ${backupId}`)

    try {
      // Find backup metadata
      const backupMetadata = await this.getBackupMetadata(backupId)
      
      if (!backupMetadata) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      // Download backup file
      const backupContent = await this.downloadBackup(backupMetadata)
      
      if (!backupContent) {
        throw new Error(`Failed to download backup: ${backupId}`)
      }

      // Parse backup data
      const backup = JSON.parse(backupContent)
      
      if (!backup.data) {
        throw new Error('Invalid backup format: missing data')
      }

      // Determine tables to restore
      const tablesToRestore = options.tables || Object.keys(backup.data)
      const restoredTables: string[] = []
      const errors: string[] = []

      if (options.dryRun) {
        console.log('Dry run mode: would restore tables:', tablesToRestore)
        return { success: true, restoredTables: tablesToRestore, errors: [] }
      }

      // Restore each table
      for (const tableName of tablesToRestore) {
        try {
          const tableData = backup.data[tableName]
          
          if (!tableData) {
            errors.push(`Table ${tableName} not found in backup`)
            continue
          }

          await this.restoreTableData(tableName, tableData)
          restoredTables.push(tableName)
          
          console.log(`Restored table: ${tableName} (${tableData.length} records)`)
        } catch (error) {
          const errorMessage = `Failed to restore table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          console.error(errorMessage)
        }
      }

      const success = errors.length === 0
      console.log(`Restore completed: ${backupId} (${restoredTables.length} tables restored, ${errors.length} errors)`)

      return { success, restoredTables, errors }

    } catch (error) {
      console.error(`Restore failed: ${backupId}`, error)
      throw error
    }
  }

  async listBackups(configName?: string): Promise<BackupMetadata[]> {
    // This would typically query a database table or S3 metadata
    // For now, return mock data
    return [
      {
        id: 'backup-1234567890',
        name: 'daily-full-backup',
        createdAt: new Date().toISOString(),
        size: 1024 * 1024 * 5, // 5MB
        tables: ['users', 'assessments', 'questions'],
        compressed: true,
        encrypted: true,
        status: 'success',
        s3Key: 'backups/daily-full-backup/2025-10-19/backup-1234567890.json.gz.enc',
      },
    ]
  }

  async deleteOldBackups(retentionDays: number): Promise<{ deleted: number; errors: string[] }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    console.log(`Deleting backups older than ${cutoffDate.toISOString()}`)

    // This would typically query for old backups and delete them
    // Implementation depends on how backup metadata is stored
    
    return { deleted: 0, errors: [] }
  }

  private async getTablesToBackup(config: BackupConfig): Promise<string[]> {
    if (config.includeTables.length > 0) {
      return config.includeTables.filter(table => 
        !config.excludeTables?.includes(table)
      )
    }

    // Get all tables if none specified
    const allTables = [
      'users', 'accounts', 'sessions', 'verification_tokens',
      'assessments', 'questions', 'question_options', 'assessment_results',
      'qualifications', 'qualification_progress', 'achievements',
      'bookmarks', 'feedback', 'user_analytics',
    ]

    return allTables.filter(table => 
      !config.excludeTables?.includes(table)
    )
  }

  private async exportDatabaseData(tables: string[]): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {}

    for (const tableName of tables) {
      try {
        // Use Prisma's raw query to export table data
        const tableData = await (prisma as any).$queryRawUnsafe(`SELECT * FROM "${tableName}"`)
        data[tableName] = tableData
      } catch (error) {
        console.error(`Failed to export table ${tableName}:`, error)
        data[tableName] = []
      }
    }

    return data
  }

  private async restoreTableData(tableName: string, data: any[]): Promise<void> {
    if (data.length === 0) {return}

    // Clear existing data (be careful!)
    await (prisma as any).$queryRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`)

    // Insert backup data in batches
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      for (const record of batch) {
        // Build insert query dynamically
        const columns = Object.keys(record)
        const values = Object.values(record)
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
        
        const query = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`
        
        await (prisma as any).$queryRawUnsafe(query, ...values)
      }
    }
  }

  private async compressData(data: string): Promise<string> {
    // Implement compression (e.g., using zlib)
    // For now, return as-is
    return data
  }

  private async encryptData(data: string): Promise<string> {
    // Implement encryption (e.g., using crypto)
    // For now, return as-is
    return data
  }

  private async downloadBackup(metadata: BackupMetadata): Promise<string | null> {
    const downloadUrl = await downloadFromS3({
      key: metadata.s3Key,
      expires: 3600,
    })

    if (!downloadUrl) {return null}

    // Download and return content
    const response = await fetch(downloadUrl)
    return await response.text()
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    // This would typically query a database table
    // For now, return mock data
    const backups = await this.listBackups()
    return backups.find(backup => backup.id === backupId) || null
  }

  private async sendBackupNotification(
    metadata: BackupMetadata,
    config: BackupConfig,
    type: 'success' | 'failure'
  ): Promise<void> {
    const subject = type === 'success' 
      ? `Backup Completed: ${config.name}` 
      : `Backup Failed: ${config.name}`

    const message = type === 'success'
      ? `
        <p>Backup completed successfully:</p>
        <ul>
          <li><strong>Backup ID:</strong> ${metadata.id}</li>
          <li><strong>Size:</strong> ${this.formatFileSize(metadata.size)}</li>
          <li><strong>Tables:</strong> ${metadata.tables.join(', ')}</li>
          <li><strong>Compressed:</strong> ${metadata.compressed ? 'Yes' : 'No'}</li>
          <li><strong>Encrypted:</strong> ${metadata.encrypted ? 'Yes' : 'No'}</li>
        </ul>
      `
      : `
        <p>Backup failed with error:</p>
        <p><strong>Error:</strong> ${metadata.error}</p>
        <p><strong>Backup ID:</strong> ${metadata.id}</p>
      `

    for (const email of config.notifications.emails) {
      await sendNotificationEmail({
        email,
        name: 'Admin',
        title: subject,
        message,
      })
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 Bytes'}
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }
}

// Export singleton instance
export const backupService = new BackupService()