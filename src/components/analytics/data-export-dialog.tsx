"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Database, Shield, Calendar, Clock } from "lucide-react"

interface DataExportDialogProps {
  trigger?: React.ReactNode
  defaultType?: 'progress-report' | 'performance-dashboard' | 'admin-analytics' | 'user-data'
  isAdmin?: boolean
}

export function DataExportDialog({ 
  trigger, 
  defaultType = 'progress-report',
  isAdmin = false 
}: DataExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState(defaultType)
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json' | 'excel'>('pdf')
  const [timeframe, setTimeframe] = useState('30d')
  const [includePersonalData, setIncludePersonalData] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])

  const exportTypes = [
    {
      id: 'progress-report',
      name: 'Progress Report',
      description: 'Detailed learning progress and performance analysis',
      icon: FileText,
      adminOnly: false,
      dataTypes: ['Learning progress', 'Assessment scores', 'Study time', 'Achievements']
    },
    {
      id: 'performance-dashboard',
      name: 'Performance Dashboard',
      description: 'Real-time metrics and analytics dashboard data',
      icon: Database,
      adminOnly: false,
      dataTypes: ['Performance metrics', 'Category analysis', 'Trends', 'Insights']
    },
    {
      id: 'admin-analytics',
      name: 'Admin Analytics',
      description: 'System-wide analytics and administrative insights',
      icon: Shield,
      adminOnly: true,
      dataTypes: ['User metrics', 'System health', 'Content analytics', 'Business metrics']
    },
    {
      id: 'user-data',
      name: 'Complete User Data',
      description: 'All user data for GDPR compliance and portability',
      icon: Database,
      adminOnly: false,
      dataTypes: ['Profile data', 'Learning patterns', 'Analytics', 'Preferences']
    }
  ]

  const formats = [
    { id: 'pdf', name: 'PDF', description: 'Formatted report document' },
    { id: 'csv', name: 'CSV', description: 'Spreadsheet-compatible data' },
    { id: 'json', name: 'JSON', description: 'Structured data format' },
    { id: 'excel', name: 'Excel', description: 'Microsoft Excel workbook' }
  ]

  const timeframes = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: '1y', name: 'Last year' },
    { id: 'all', name: 'All time' }
  ]

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: exportType,
          format,
          timeframe,
          includePersonalData
        })
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Handle file download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportType}-${timeframe}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Add to export history
      const newExport = {
        id: Date.now(),
        type: exportType,
        format,
        timeframe,
        timestamp: new Date(),
        size: blob.size
      }
      setExportHistory(prev => [newExport, ...prev.slice(0, 4)])

      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error toast
    } finally {
      setLoading(false)
    }
  }

  const selectedExportType = exportTypes.find(t => t.id === exportType)
  const formatSize = format === 'pdf' ? 'Large' : format === 'excel' ? 'Medium' : 'Small'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Data
          </DialogTitle>
          <DialogDescription>
            Choose the type of data you want to export and the desired format.
            All exports comply with data protection regulations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Type</Label>
            <RadioGroup value={exportType} onValueChange={setExportType}>
              <div className="grid gap-3">
                {exportTypes
                  .filter(type => !type.adminOnly || isAdmin)
                  .map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={type.id} id={type.id} />
                        <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                          <Card className="p-3 hover:bg-accent transition-colors">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 mt-1 text-primary" />
                              <div className="flex-1">
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {type.dataTypes.map((dataType, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {dataType}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {type.adminOnly && (
                                <Badge variant="outline" className="text-xs">
                                  Admin Only
                                </Badge>
                              )}
                            </div>
                          </Card>
                        </Label>
                      </div>
                    )
                  })}
              </div>
            </RadioGroup>
          </div>

          {/* Format and Options */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label>File Format</Label>
              <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((fmt) => (
                    <SelectItem key={fmt.id} value={fmt.id}>
                      <div>
                        <div className="font-medium">{fmt.name}</div>
                        <div className="text-xs text-muted-foreground">{fmt.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Expected file size: {formatSize}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Time Range</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.id} value={tf.id}>
                      {tf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Privacy Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy & Data Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="personal-data" 
                  checked={includePersonalData}
                  onCheckedChange={setIncludePersonalData}
                />
                <Label htmlFor="personal-data" className="text-sm">
                  Include personally identifiable information
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                When unchecked, data will be anonymized to protect privacy.
                Personal data includes names, emails, and other identifiable information.
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          {selectedExportType && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{selectedExportType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium">{format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time range:</span>
                    <span className="font-medium">
                      {timeframes.find(t => t.id === timeframe)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Privacy:</span>
                    <span className="font-medium">
                      {includePersonalData ? 'Full data' : 'Anonymized'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Exports */}
          {exportHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Exports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exportHistory.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium">{exp.type}</span>
                        <span className="text-muted-foreground ml-2">
                          {exp.format.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(exp.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}