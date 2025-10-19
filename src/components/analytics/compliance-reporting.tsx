"use client"

import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Eye,
  Search,
  Calendar,
  Users,
  Database,
  Lock,
  Activity
} from "lucide-react"
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ComplianceReportingProps {
  className?: string
}

interface ComplianceReport {
  type: string
  name: string
  description: string
  lastGenerated: Date
  frequency: string
  status?: 'current' | 'outdated' | 'pending'
}

interface ComplianceMetrics {
  gdprCompliance: {
    dataSubjectRequests: number
    averageResponseTime: number
    breachNotifications: number
    consentRate: number
  }
  dataGovernance: {
    dataInventoryCompleteness: number
    policyAdherence: number
    trainingCompletion: number
    auditFindings: number
  }
  securityPosture: {
    vulnerabilities: number
    incidentResponseTime: number
    accessReviews: number
    securityTraining: number
  }
}

export function ComplianceReporting({ className }: ComplianceReportingProps) {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  useEffect(() => {
    fetchComplianceData()
  }, [selectedTimeframe])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      
      // Fetch available reports
      const reportsResponse = await fetch('/api/compliance/reports')
      const reportsData = await reportsResponse.json()
      
      if (reportsData.success) {
        setReports(reportsData.data.map((report: any) => ({
          ...report,
          status: getReportStatus(report.lastGenerated, report.frequency)
        })))
      }

      // Fetch compliance metrics
      const metricsResponse = await fetch(`/api/compliance/reports?type=gdpr&timeframe=${selectedTimeframe}`)
      const metricsData = await metricsResponse.json()
      
      if (metricsData.success) {
        setMetrics(metricsData.data.data.complianceMetrics)
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          timeframe: selectedTimeframe,
          scope: 'system',
          justification: `Compliance review for ${reportType} requested by administrator`
        })
      })

      if (response.ok) {
        fetchComplianceData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const downloadReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/compliance/reports?type=${reportType}&timeframe=${selectedTimeframe}`)
      
      if (response.ok) {
        const reportData = await response.json()
        const blob = new Blob([JSON.stringify(reportData.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-compliance-report-${selectedTimeframe}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download report:', error)
    }
  }

  const getReportStatus = (lastGenerated: Date, frequency: string): 'current' | 'outdated' | 'pending' => {
    const now = new Date()
    const lastGen = new Date(lastGenerated)
    const hoursSince = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60)
    
    const thresholds = {
      'Daily': 24,
      'Weekly': 168,
      'Bi-weekly': 336,
      'Monthly': 720
    }
    
    const threshold = thresholds[frequency as keyof typeof thresholds] || 720
    
    if (hoursSince > threshold * 1.5) {return 'outdated'}
    if (hoursSince > threshold) {return 'pending'}
    return 'current'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'outdated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'outdated': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getComplianceScore = () => {
    if (!metrics) {return 0}
    
    const scores = [
      metrics.gdprCompliance.consentRate,
      metrics.dataGovernance.dataInventoryCompleteness,
      metrics.dataGovernance.policyAdherence,
      metrics.dataGovernance.trainingCompletion,
      metrics.securityPosture.securityTraining
    ]
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle>Loading Compliance Data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance Reporting
          </h2>
          <p className="text-muted-foreground">
            Monitor regulatory compliance and generate audit reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compliance Overview */}
      {metrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Compliance Overview
            </CardTitle>
            <CardDescription>Current compliance status and key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - getComplianceScore() / 100)}`}
                      className="text-green-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{getComplianceScore().toFixed(0)}%</span>
                  </div>
                </div>
                <div className="font-medium">Overall Compliance Score</div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GDPR Consent Rate</span>
                    <span>{metrics.gdprCompliance.consentRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.gdprCompliance.consentRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Policy Adherence</span>
                    <span>{metrics.dataGovernance.policyAdherence.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.dataGovernance.policyAdherence} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Security Training</span>
                    <span>{metrics.securityPosture.securityTraining.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.securityPosture.securityTraining} className="h-2" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {metrics.gdprCompliance.dataSubjectRequests}
                  </div>
                  <div className="text-xs text-muted-foreground">Data Subject Requests</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {metrics.dataGovernance.auditFindings}
                  </div>
                  <div className="text-xs text-muted-foreground">Audit Findings</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {metrics.securityPosture.vulnerabilities}
                  </div>
                  <div className="text-xs text-muted-foreground">Open Vulnerabilities</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="schedule">Report Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 mt-1 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">{report.description}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                          <span>Frequency: {report.frequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(report.status || 'current')}>
                        {getStatusIcon(report.status || 'current')}
                        <span className="ml-1 capitalize">{report.status}</span>
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => downloadReport(report.type)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateReport(report.type)}>
                        <Download className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          {metrics && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">GDPR Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Data Subject Requests</span>
                    <span className="font-medium">{metrics.gdprCompliance.dataSubjectRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Response Time</span>
                    <span className="font-medium">{metrics.gdprCompliance.averageResponseTime}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Breach Notifications</span>
                    <span className="font-medium">{metrics.gdprCompliance.breachNotifications}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Consent Rate</span>
                    <span className="font-medium">{metrics.gdprCompliance.consentRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Governance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Data Inventory</span>
                    <span className="font-medium">{metrics.dataGovernance.dataInventoryCompleteness.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Policy Adherence</span>
                    <span className="font-medium">{metrics.dataGovernance.policyAdherence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Training Completion</span>
                    <span className="font-medium">{metrics.dataGovernance.trainingCompletion.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Audit Findings</span>
                    <span className="font-medium">{metrics.dataGovernance.auditFindings}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Security Posture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Open Vulnerabilities</span>
                    <span className="font-medium">{metrics.securityPosture.vulnerabilities}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Incident Response Time</span>
                    <span className="font-medium">{metrics.securityPosture.incidentResponseTime}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Access Reviews</span>
                    <span className="font-medium">{metrics.securityPosture.accessReviews}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Security Training</span>
                    <span className="font-medium">{metrics.securityPosture.securityTraining.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Automated Report Schedule</CardTitle>
              <CardDescription>Configure when compliance reports are automatically generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Generated {report.frequency.toLowerCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Next: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}