"use client"

import { 
  CalendarIcon, 
  ClockIcon, 
  BookOpenIcon, 
  TrendingUpIcon, 
  DownloadIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  BarChartIcon,
  PieChartIcon
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { NoAssessmentHistoryEmptyState } from "@/components/assessment/empty-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for study history
const mockActivityData = [
  {
    id: "1",
    date: new Date("2024-03-20"),
    type: "assessment",
    title: "Machine Learning Fundamentals Quiz",
    duration: 45,
    score: 85,
    status: "completed",
    category: "Machine Learning",
    difficulty: "Intermediate",
    points: 150,
  },
  {
    id: "2", 
    date: new Date("2024-03-19"),
    type: "study",
    title: "Neural Networks Deep Dive",
    duration: 120,
    status: "completed",
    category: "Deep Learning",
    difficulty: "Advanced",
    points: 100,
  },
  {
    id: "3",
    date: new Date("2024-03-18"),
    type: "practice",
    title: "Python for Data Science Exercises",
    duration: 90,
    score: 92,
    status: "completed",
    category: "Programming",
    difficulty: "Beginner",
    points: 75,
  },
  {
    id: "4",
    date: new Date("2024-03-17"),
    type: "assessment",
    title: "Data Structures and Algorithms",
    duration: 30,
    score: 78,
    status: "completed",
    category: "Computer Science",
    difficulty: "Intermediate",
    points: 120,
  },
  {
    id: "5",
    date: new Date("2024-03-16"),
    type: "study",
    title: "Statistics for Machine Learning",
    duration: 75,
    status: "paused",
    category: "Statistics",
    difficulty: "Intermediate",
    points: 0,
  },
]

const mockTimeSpentData = [
  { category: "Machine Learning", hours: 24.5, sessions: 12 },
  { category: "Data Science", hours: 18.2, sessions: 9 },
  { category: "Programming", hours: 15.8, sessions: 15 },
  { category: "Statistics", hours: 12.3, sessions: 8 },
  { category: "Deep Learning", hours: 10.7, sessions: 6 },
]

const mockPerformanceData = [
  { month: "Jan", averageScore: 72, studyHours: 35, assessments: 8 },
  { month: "Feb", averageScore: 78, studyHours: 42, assessments: 12 },
  { month: "Mar", averageScore: 84, studyHours: 48, assessments: 15 },
]

interface StudyHistoryProps {
  userId: string
}

export function StudyHistory({ userId }: StudyHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)

  const filteredActivities = mockActivityData
    .filter((activity) => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "all" || activity.type === filterType
      const matchesCategory = filterCategory === "all" || activity.category === filterCategory
      const matchesStatus = filterStatus === "all" || activity.status === filterStatus
      
      return matchesSearch && matchesType && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.date.getTime() - a.date.getTime()
        case "date-asc":
          return a.date.getTime() - b.date.getTime()
        case "duration-desc":
          return b.duration - a.duration
        case "score-desc":
          return (b.score || 0) - (a.score || 0)
        default:
          return 0
      }
    })

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case "assessment":
        return status === "completed" ? 
          <CheckCircleIcon className="h-5 w-5 text-green-600" /> : 
          <XCircleIcon className="h-5 w-5 text-red-600" />
      case "study":
        return status === "paused" ? 
          <PauseIcon className="h-5 w-5 text-yellow-600" /> : 
          <BookOpenIcon className="h-5 w-5 text-blue-600" />
      case "practice":
        return <PlayIcon className="h-5 w-5 text-purple-600" />
      default:
        return <BookOpenIcon className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Paused</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Beginner</Badge>
      case "Intermediate":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Intermediate</Badge>
      case "Advanced":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Advanced</Badge>
      default:
        return <Badge variant="outline">{difficulty}</Badge>
    }
  }

  const handleExportData = () => {
    // Mock export functionality
    const csvData = mockActivityData.map(activity => ({
      Date: activity.date.toISOString().split('T')[0],
      Type: activity.type,
      Title: activity.title,
      Duration: activity.duration,
      Score: activity.score || 'N/A',
      Status: activity.status,
      Category: activity.category,
      Points: activity.points
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'study-history.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success("Study history exported successfully!")
  }

  const totalStudyTime = mockActivityData.reduce((sum, activity) => sum + activity.duration, 0)
  const totalSessions = mockActivityData.length
  const averageScore = mockActivityData
    .filter(a => a.score)
    .reduce((sum, a, _, arr) => sum + (a.score! / arr.length), 0)
  const totalPoints = mockActivityData.reduce((sum, activity) => sum + activity.points, 0)

  // Show empty state if no activity data exists
  if (mockActivityData.length === 0) {
    return <NoAssessmentHistoryEmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
                <p className="text-2xl font-bold">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{Math.round(averageScore)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChartIcon className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" onClick={handleExportData}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <TabsContent value="activity" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FilterIcon className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="assessment">Assessments</SelectItem>
                      <SelectItem value="study">Study Sessions</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Statistics">Statistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Newest)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                      <SelectItem value="duration-desc">Duration (Longest)</SelectItem>
                      <SelectItem value="score-desc">Score (Highest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity List */}
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getActivityIcon(activity.type, activity.status)}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{activity.title}</h3>
                          {getStatusBadge(activity.status)}
                          {getDifficultyBadge(activity.difficulty)}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{activity.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{activity.duration} min</span>
                          </div>
                          <span className="capitalize">{activity.type}</span>
                          <span>{activity.category}</span>
                          {activity.score && (
                            <span className="font-medium text-green-600">
                              Score: {activity.score}%
                            </span>
                          )}
                          <span className="text-yellow-600">+{activity.points} pts</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedActivity(
                        expandedActivity === activity.id ? null : activity.id
                      )}
                    >
                      {expandedActivity === activity.id ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {expandedActivity === activity.id && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Start Time</p>
                            <p>{activity.date.toLocaleTimeString()}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Duration</p>
                            <p>{Math.floor(activity.duration / 60)}h {activity.duration % 60}m</p>
                          </div>
                          {activity.score && (
                            <div>
                              <p className="font-medium text-muted-foreground">Score</p>
                              <p className="text-green-600 font-medium">{activity.score}%</p>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-muted-foreground">Points Earned</p>
                            <p className="text-yellow-600 font-medium">+{activity.points}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {activity.type === "assessment" && (
                            <Button variant="outline" size="sm">
                              Review Answers
                            </Button>
                          )}
                          {activity.status === "paused" && (
                            <Button size="sm">
                              Continue Learning
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or start a new learning session!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Your learning progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceData.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{month.month} 2024</p>
                        <p className="text-sm text-muted-foreground">
                          {month.studyHours}h study • {month.assessments} assessments
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{month.averageScore}%</p>
                        <p className="text-xs text-muted-foreground">avg score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Pattern</CardTitle>
                <CardDescription>Your most active study days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                    const hours = [2.5, 3.2, 1.8, 4.1, 2.9, 1.2, 0.8][index]
                    const maxHours = 4.1
                    const percentage = (hours / maxHours) * 100
                    
                    return (
                      <div key={day} className="flex items-center space-x-3">
                        <div className="w-12 text-sm font-medium">{day}</div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-muted-foreground text-right">
                          {hours}h
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Spent by Category</CardTitle>
              <CardDescription>Breakdown of your learning time across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeSpentData.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.category}</span>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{item.sessions} sessions</span>
                        <span className="font-medium">{item.hours}h</span>
                      </div>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(item.hours / 24.5) * 100}%` }}
                      />
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