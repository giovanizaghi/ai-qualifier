'use client'

import { Database, Download, Upload, Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


interface BackupMetadata {
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

interface BackupConfig {
  name: string
  schedule: string
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

const availableTables = [
  'users', 'accounts', 'sessions', 'verification_tokens',
  'assessments', 'questions', 'question_options', 'assessment_results',
  'qualifications', 'qualification_progress', 'achievements',
  'bookmarks', 'feedback', 'user_analytics',
]

export function BackupManager() {
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [defaultConfigs, setDefaultConfigs] = useState<BackupConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Create backup form state
  const [createForm, setCreateForm] = useState({
    name: '',
    includeTables: [] as string[],
    excludeTables: [] as string[],
    compress: true,
    encrypt: true,
    notifications: {
      onSuccess: false,
      onFailure: true,
      emails: [] as string[],
    },
  })

  // Restore backup form state
  const [restoreForm, setRestoreForm] = useState({
    backupId: '',
    tables: [] as string[],
    dryRun: true,
  })

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/backups')
      const result = await response.json()

      if (response.ok) {
        setBackups(result.backups)
        setDefaultConfigs(result.defaultConfigs)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast.error('Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setCreating(true)
      
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Backup created successfully')
        setBackups(prev => [result.backup, ...prev])
        
        // Reset form
        setCreateForm({
          name: '',
          includeTables: [],
          excludeTables: [],
          compress: true,
          encrypt: true,
          notifications: {
            onSuccess: false,
            onFailure: true,
            emails: [],
          },
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error('Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const restoreBackup = async () => {
    try {
      setRestoring(true)
      
      const response = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restoreForm),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.dryRun) {
          toast.success(`Dry run completed. Would restore ${result.restoredTables.length} tables`)
        } else {
          toast.success(`Restore completed. Restored ${result.restoredTables.length} tables`)
        }
        
        if (result.errors.length > 0) {
          console.warn('Restore errors:', result.errors)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast.error('Failed to restore backup')
    } finally {
      setRestoring(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 Bytes'}
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Manager
          </CardTitle>
          <CardDescription>
            Create, manage, and restore database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Backup</DialogTitle>
                  <DialogDescription>
                    Configure and create a new database backup
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backup-name">Backup Name</Label>
                    <Input
                      id="backup-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., manual-backup-2025-10-19"
                    />
                  </div>

                  <div>
                    <Label>Tables to Include</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {availableTables.map(table => (
                        <div key={table} className="flex items-center space-x-2">
                          <Checkbox
                            id={`table-${table}`}
                            checked={createForm.includeTables.includes(table)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCreateForm(prev => ({
                                  ...prev,
                                  includeTables: [...prev.includeTables, table]
                                }))
                              } else {
                                setCreateForm(prev => ({
                                  ...prev,
                                  includeTables: prev.includeTables.filter(t => t !== table)
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`table-${table}`} className="text-sm">
                            {table}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Leave empty to include all tables
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compress Backup</Label>
                      <p className="text-xs text-gray-500">Reduce backup file size</p>
                    </div>
                    <Checkbox
                      checked={createForm.compress}
                      onCheckedChange={(checked: boolean) => 
                        setCreateForm(prev => ({ ...prev, compress: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Encrypt Backup</Label>
                      <p className="text-xs text-gray-500">Encrypt backup for security</p>
                    </div>
                    <Checkbox
                      checked={createForm.encrypt}
                      onCheckedChange={(checked: boolean) => 
                        setCreateForm(prev => ({ ...prev, encrypt: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notify on Success</Label>
                      <p className="text-xs text-gray-500">Send email notification on success</p>
                    </div>
                    <Checkbox
                      checked={createForm.notifications.onSuccess}
                      onCheckedChange={(checked: boolean) => 
                        setCreateForm(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, onSuccess: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notify on Failure</Label>
                      <p className="text-xs text-gray-500">Send email notification on failure</p>
                    </div>
                    <Checkbox
                      checked={createForm.notifications.onFailure}
                      onCheckedChange={(checked: boolean) => 
                        setCreateForm(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, onFailure: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" disabled={creating}>
                      Cancel
                    </Button>
                    <Button onClick={createBackup} disabled={creating || !createForm.name}>
                      {creating ? 'Creating...' : 'Create Backup'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restore Backup</DialogTitle>
                  <DialogDescription>
                    Restore data from a previous backup
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backup-select">Select Backup</Label>
                    <Select
                      value={restoreForm.backupId}
                      onValueChange={(value) => 
                        setRestoreForm(prev => ({ ...prev, backupId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a backup to restore" />
                      </SelectTrigger>
                      <SelectContent>
                        {backups.map(backup => (
                          <SelectItem key={backup.id} value={backup.id}>
                            {backup.name} - {new Date(backup.createdAt).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dry Run</Label>
                      <p className="text-xs text-gray-500">Test restore without making changes</p>
                    </div>
                    <Checkbox
                      checked={restoreForm.dryRun}
                      onCheckedChange={(checked: boolean) => 
                        setRestoreForm(prev => ({ ...prev, dryRun: checked }))
                      }
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" disabled={restoring}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={restoreBackup} 
                      disabled={restoring || !restoreForm.backupId}
                      variant={restoreForm.dryRun ? "outline" : "destructive"}
                    >
                      {restoring ? 'Restoring...' : restoreForm.dryRun ? 'Test Restore' : 'Restore Backup'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage your database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading backups...</p>
          ) : backups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No backups found
            </p>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(backup.size)}</span>
                        <Badge variant="secondary" className={getStatusColor(backup.status)}>
                          {backup.status}
                        </Badge>
                        {backup.compressed && (
                          <Badge variant="outline">
                            <Database className="h-3 w-3 mr-1" />
                            Compressed
                          </Badge>
                        )}
                        {backup.encrypted && (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                        <span>{new Date(backup.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Tables: {backup.tables.join(', ')}
                      </p>
                      {backup.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {backup.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreForm(prev => ({ ...prev, backupId: backup.id }))}
                      disabled={backup.status !== 'success'}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Configurations */}
      {defaultConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Backups</CardTitle>
            <CardDescription>
              Automated backup configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultConfigs.map((config, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Schedule: {config.schedule}</span>
                        <span>Retention: {config.retentionDays} days</span>
                        {config.compress && (
                          <Badge variant="outline">Compressed</Badge>
                        )}
                        {config.encrypt && (
                          <Badge variant="outline">Encrypted</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="secondary">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}