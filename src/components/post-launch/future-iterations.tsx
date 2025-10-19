"use client"

import { 
  Calendar,
  CheckCircle,
  Clock,
  Flag,
  GitBranch,
  Lightbulb,
  MapPin,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
  Vote,
  Zap,
  ArrowRight,
  BarChart3,
  Settings
} from "lucide-react"
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface FeatureRequest {
  id: string
  title: string
  description: string
  category: 'enhancement' | 'new_feature' | 'integration' | 'ui_ux' | 'performance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'submitted' | 'under_review' | 'planned' | 'in_development' | 'completed' | 'rejected'
  votes: number
  impact: 'low' | 'medium' | 'high'
  effort: 'small' | 'medium' | 'large'
  requestedBy: string
  createdAt: Date
  targetRelease?: string
  assignedTo?: string
  tags: string[]
}

interface RoadmapItem {
  id: string
  title: string
  description: string
  phase: 'current' | 'next' | 'future'
  status: 'planning' | 'in_progress' | 'completed'
  startDate: Date
  endDate?: Date
  progress: number
  features: string[]
  goals: string[]
  success_metrics: string[]
  dependencies: string[]
}

interface IterationPlan {
  id: string
  version: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  status: 'planning' | 'active' | 'completed'
  goals: string[]
  features: FeatureRequest[]
  risks: string[]
  success_criteria: string[]
}

interface FutureIterationsData {
  featureRequests: FeatureRequest[]
  roadmap: RoadmapItem[]
  iterations: IterationPlan[]
  stats: {
    totalRequests: number
    completedFeatures: number
    upcomingFeatures: number
    userVotes: number
  }
}

interface FutureIterationsProps {
  className?: string
}

export function FutureIterations({ className }: FutureIterationsProps) {
  const [data, setData] = useState<FutureIterationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('requests')
  
  // Form states
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'enhancement' as const,
    priority: 'medium' as const
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/iterations/planning')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch iterations data: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      return
    }

    try {
      const response = await fetch('/api/iterations/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest)
      })

      if (response.ok) {
        setNewRequest({
          title: '',
          description: '',
          category: 'enhancement',
          priority: 'medium'
        })
        setShowNewRequestForm(false)
        fetchData() // Refresh data
      }
    } catch (err) {
      console.error('Failed to submit feature request:', err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_development': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-purple-100 text-purple-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'enhancement': return <TrendingUp className="h-4 w-4" />
      case 'new_feature': return <Plus className="h-4 w-4" />
      case 'integration': return <GitBranch className="h-4 w-4" />
      case 'ui_ux': return <Settings className="h-4 w-4" />
      case 'performance': return <Zap className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Future Iterations...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {return null}

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Future Iterations</h1>
          <p className="text-muted-foreground">
            Plan roadmap, manage feature requests, and track development progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowNewRequestForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Feature requests submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Features</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.completedFeatures}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Features</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.stats.upcomingFeatures}</div>
            <p className="text-xs text-muted-foreground">
              In development pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.stats.userVotes}</div>
            <p className="text-xs text-muted-foreground">
              User engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Request Form Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit Feature Request</CardTitle>
              <CardDescription>
                Help us improve the platform by sharing your ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the feature"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed explanation of what you'd like to see..."
                    className="min-h-[100px]"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newRequest.category} 
                    onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enhancement">Enhancement</SelectItem>
                      <SelectItem value="new_feature">New Feature</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="ui_ux">UI/UX</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newRequest.priority} 
                    onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Submit Request
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewRequestForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Feature Requests</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="iterations">Iterations</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Requests</CardTitle>
              <CardDescription>
                Community-driven feature requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.featureRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {getCategoryIcon(request.category)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{request.title}</h4>
                            <span className="text-xs text-muted-foreground">#{request.id.slice(-8)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Vote className="h-3 w-3" />
                              <span>{request.votes} votes</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Impact: {request.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Vote className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <div className="space-y-6">
            {data.roadmap.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.phase === 'current' ? 'default' : 'secondary'}>
                        {item.phase}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {item.goals.map((goal, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Features
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {item.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Success Metrics
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {item.success_metrics.map((metric, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-3 w-3 mt-1 flex-shrink-0" />
                            {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {item.status === 'in_progress' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="iterations" className="space-y-6">
          <div className="space-y-6">
            {data.iterations.map((iteration) => (
              <Card key={iteration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {iteration.title} (v{iteration.version})
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {iteration.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(iteration.status)}>
                      {iteration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Start: {iteration.startDate.toLocaleDateString()}</p>
                        <p>End: {iteration.endDate.toLocaleDateString()}</p>
                      </div>
                      
                      <h4 className="font-medium mb-2 mt-4 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {iteration.goals.map((goal, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Success Criteria
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {iteration.success_criteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-3 w-3 mt-1 flex-shrink-0" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                      
                      {iteration.risks.length > 0 && (
                        <>
                          <h4 className="font-medium mb-2 mt-4 flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Risks
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {iteration.risks.map((risk, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Planned Features</h4>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {iteration.features.map((feature) => (
                        <div key={feature.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{feature.title}</span>
                            <Badge className={getPriorityColor(feature.priority)}>
                              {feature.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}