import { Metadata } from "next"
import { redirect } from "next/navigation"

import { 
  DashboardHeader, 
  DashboardShell,
  QualificationProgressWidget,
  PerformanceAnalytics,
  AchievementSystem,
  LearningPathVisualization,
  PersonalizedRecommendations
} from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Dashboard | AI Qualifier",
  description: "Your comprehensive AI qualification dashboard",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Mock data for demonstration - in a real app, this would come from your database
  const qualificationProgressData = [
    {
      id: "1",
      title: "Machine Learning Fundamentals",
      category: "Machine Learning",
      difficulty: "Intermediate",
      completionPercentage: 75,
      status: "IN_PROGRESS",
      studyTimeMinutes: 240,
      bestScore: 85,
      attempts: 2,
      estimatedDuration: 120,
      currentTopic: "Neural Networks",
      completedTopics: ["Linear Regression", "Decision Trees", "Random Forest"]
    },
    {
      id: "2",
      title: "AI Ethics & Responsible AI",
      category: "AI Ethics",
      difficulty: "Beginner",
      completionPercentage: 100,
      status: "COMPLETED",
      studyTimeMinutes: 180,
      bestScore: 92,
      attempts: 1,
      estimatedDuration: 90,
      completedTopics: ["Bias in AI", "Privacy", "Transparency", "Accountability"]
    }
  ]

  const performanceData = {
    overallScore: 78,
    averageScore: 78,
    bestScore: 95,
    totalAssessments: 8,
    passedAssessments: 6,
    totalStudyTime: 1200,
    currentStreak: 5,
    longestStreak: 12,
    categoryScores: [
      { category: "Machine Learning", score: 85, assessments: 3, trend: 'up' as const },
      { category: "AI Ethics", score: 92, assessments: 2, trend: 'stable' as const },
      { category: "Neural Networks", score: 72, assessments: 2, trend: 'up' as const },
      { category: "Computer Vision", score: 68, assessments: 1, trend: 'down' as const }
    ],
    recentTrends: [
      { period: "This Week", score: 82, change: 5 },
      { period: "Last Week", score: 77, change: -2 },
      { period: "This Month", score: 78, change: 8 }
    ],
    strengths: ["Theoretical Understanding", "Problem-Solving", "Mathematical Concepts"],
    improvementAreas: ["Practical Implementation", "Time Management", "Code Optimization"]
  }

  const achievements = [
    {
      id: "1",
      type: "FIRST_QUALIFICATION",
      title: "First Steps",
      description: "Completed your first AI qualification",
      category: "completion",
      earnedAt: "2024-10-15T10:00:00Z",
      isNew: true
    },
    {
      id: "2",
      type: "PERFECT_SCORE",
      title: "Perfect Score",
      description: "Achieved 100% on AI Ethics assessment",
      category: "performance",
      value: 100,
      earnedAt: "2024-10-14T15:30:00Z"
    }
  ]

  const achievementProgress = [
    {
      id: "3",
      title: "Speed Learner",
      description: "Complete 5 qualifications in under 2 hours each",
      category: "speed",
      currentValue: 2,
      targetValue: 5,
      progress: 40,
      icon: "QUICK_LEARNER"
    }
  ]

  const learningPaths = [
    {
      id: "1",
      title: "AI Fundamentals to Expert",
      description: "Complete journey from basics to advanced AI concepts",
      totalNodes: 8,
      completedNodes: 3,
      estimatedTotalTime: 480,
      nodes: [
        {
          id: "node1",
          title: "Introduction to AI",
          description: "Basic concepts and history of artificial intelligence",
          category: "Fundamentals",
          difficulty: "Beginner",
          estimatedDuration: 60,
          status: "completed" as const,
          prerequisites: [],
          unlocks: ["node2"],
          completionScore: 95
        },
        {
          id: "node2",
          title: "Machine Learning Basics",
          description: "Core ML algorithms and concepts",
          category: "Machine Learning",
          difficulty: "Intermediate",
          estimatedDuration: 90,
          status: "in_progress" as const,
          progress: 75,
          prerequisites: ["node1"],
          unlocks: ["node3"],
          isRecommended: true
        }
      ]
    }
  ]

  const recommendations = [
    {
      id: "rec1",
      type: "skill_gap" as const,
      title: "Deep Learning Fundamentals",
      description: "Strengthen your neural network knowledge",
      reason: "Your recent performance shows room for improvement in neural network concepts",
      confidence: 85,
      priority: "high" as const,
      category: "Neural Networks",
      difficulty: "Intermediate",
      estimatedTime: 120,
      metadata: {
        currentScore: 68,
        averageScore: 78
      }
    }
  ]

  const studyInsights = [
    {
      type: "strength" as const,
      title: "Strong Theoretical Foundation",
      description: "You excel at understanding AI concepts and theory",
      actionItems: ["Continue building on theoretical knowledge", "Apply theory to practical projects"],
      impact: "high" as const
    }
  ]

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome back, ${session.user.name || 'Learner'}! Ready to continue your AI journey?`}
      />
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualificationProgressData.length}</div>
            <p className="text-xs text-muted-foreground">
              {qualificationProgressData.filter(q => q.status === 'COMPLETED').length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Best: {performanceData.bestScore}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(performanceData.totalStudyTime / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Best: {performanceData.longestStreak} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Widgets */}
      <div className="grid gap-6 md:grid-cols-2">
        <QualificationProgressWidget 
          qualifications={qualificationProgressData}
        />
        <PersonalizedRecommendations
          recommendations={recommendations}
          studyInsights={studyInsights}
          learningStyle="Visual"
          preferredDifficulty="Intermediate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PerformanceAnalytics 
          data={performanceData}
          className="lg:col-span-2"
        />
        <AchievementSystem
          earnedAchievements={achievements}
          progressAchievements={achievementProgress}
          totalPoints={1250}
          currentLevel={3}
          nextLevelPoints={2000}
        />
      </div>

      <LearningPathVisualization
        learningPaths={learningPaths}
        currentPath={learningPaths[0]}
        recommendations={[
          {
            id: "node3",
            title: "Computer Vision Basics",
            description: "Introduction to image processing and computer vision",
            category: "Computer Vision",
            difficulty: "Intermediate",
            estimatedDuration: 90,
            status: "available",
            prerequisites: ["node2"],
            unlocks: ["node4"]
          }
        ]}
      />
    </DashboardShell>
  )
}