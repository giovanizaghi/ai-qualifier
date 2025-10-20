"use client"

import { User } from "next-auth"
import { useState, useEffect } from "react"

import { 
  DashboardHeader, 
  DashboardShell,
  QualificationProgressWidget,
  PerformanceAnalytics,
  AchievementSystem,
  NewUserDashboardEmptyState,
  NoActiveProgressEmptyState,
  NoAchievementsEmptyState
} from "@/components/dashboard"
import { DashboardEmptyStateTest } from "@/components/dashboard/empty-state-test"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
// Use dynamic import for Prisma client in server context
let prisma: any = null;
if (typeof window === "undefined") {
  prisma = require("@prisma/client").PrismaClient instanceof Function
    ? new (require("@prisma/client").PrismaClient)()
    : require("@prisma/client").prisma;
}

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {

  // Types
  type QualificationProgressType = {
    id: string;
    status: string;
    completionPercentage: number;
    studyTimeMinutes?: number;
    qualification?: { title?: string; category?: string; difficulty?: string };
    // ...other fields as needed
  };
  type AchievementType = {
    id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    value?: number;
    earnedAt?: string;
    // ...other fields as needed
  };
  type PerformanceType = {
    averageScore: number;
    bestScore: number;
    totalAssessments: number;
    passedAssessments: number;
    totalStudyTime: number;
    currentStreak: number;
    longestStreak: number;
  };
  const [qualificationProgress, setQualificationProgress] = useState<QualificationProgressType[]>([])
  const [achievements, setAchievements] = useState<AchievementType[]>([])
  const [performance, setPerformance] = useState<PerformanceType>({
    averageScore: 0,
    bestScore: 0,
    totalAssessments: 0,
    passedAssessments: 0,
    totalStudyTime: 0,
    currentStreak: 0,
    longestStreak: 0
  })

  useEffect(() => {
    async function fetchData() {
      // Fetch qualification progress
      if (!prisma) {return;}
      // Fetch qualification progress
      const qp: QualificationProgressType[] = await prisma.qualificationProgress.findMany({
        where: { userId: user.id },
        include: { qualification: true }
      })
      setQualificationProgress(qp)

      // Fetch achievements
      const ach: AchievementType[] = await prisma.achievement.findMany({
        where: { userId: user.id }
      })
      setAchievements(ach)

      // Fetch assessment results for performance
      const results: any[] = await prisma.assessmentResult.findMany({
        where: { userId: user.id }
      })
      const totalAssessments = results.length
      const passedAssessments = results.filter((r: any) => r.passed).length
      const averageScore = results.length > 0 ? Math.round(results.reduce((acc: number, r: any) => acc + r.score, 0) / results.length) : 0
      const bestScore = results.length > 0 ? Math.max(...results.map((r: any) => r.score)) : 0
      const totalStudyTime = qp.reduce((acc: number, q: QualificationProgressType) => acc + (q.studyTimeMinutes || 0), 0)
      setPerformance({
        averageScore,
        bestScore,
        totalAssessments,
        passedAssessments,
        totalStudyTime,
        currentStreak: 0, // Implement streak logic if needed
        longestStreak: 0  // Implement streak logic if needed
      })
    }
    fetchData()
  }, [user.id])

  // Empty state logic
  const isNewUser = qualificationProgress.length === 0 && achievements.length === 0 && performance.totalAssessments === 0
  const hasNoActiveProgress = qualificationProgress.filter((q: QualificationProgressType) => q.status === 'IN_PROGRESS').length === 0 && qualificationProgress.length === 0
  const hasNoAchievements = achievements.length === 0

  if (isNewUser) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Dashboard"
          text={`Welcome to AI Qualifier, ${user.name || 'Learner'}!`}
        />
        <NewUserDashboardEmptyState userName={user.name || undefined} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={`Welcome back, ${user.name || 'Learner'}! Ready to continue your AI journey?`}
      />
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ...existing code for Card, CardHeader, CardTitle, CardContent... */}
        {/* Make sure these components are imported from your UI library */}
        {/* If not, import them: */}
        {/* import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualificationProgress.length}</div>
            <p className="text-xs text-muted-foreground">
              {qualificationProgress.filter((q: QualificationProgressType) => q.status === 'COMPLETED').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Best: {performance.bestScore}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(performance.totalStudyTime / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              {/* ...existing code... */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Best: {performance.longestStreak} days
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Main Dashboard Widgets */}
      <div className="grid gap-6 md:grid-cols-2">
        {hasNoActiveProgress ? (
          <NoActiveProgressEmptyState />
        ) : (
          <QualificationProgressWidget qualifications={qualificationProgress.map(q => ({
            id: q.id,
            title: q.qualification?.title || '',
            category: q.qualification?.category || '',
            difficulty: q.qualification?.difficulty || '',
            completionPercentage: q.completionPercentage,
            status: q.status,
            studyTimeMinutes: q.studyTimeMinutes || 0,
            attempts: (q as any).attempts || 0,
            bestScore: (q as any).bestScore || 0,
            lastAttemptScore: (q as any).lastAttemptScore || 0,
            estimatedDuration: (q.qualification as any)?.estimatedDuration || 0,
            currentTopic: (q as any).currentTopic || '',
            completedTopics: (q as any).completedTopics || []
          }))} />
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <PerformanceAnalytics data={{
          overallScore: performance.averageScore,
          averageScore: performance.averageScore,
          bestScore: performance.bestScore,
          totalAssessments: performance.totalAssessments,
          passedAssessments: performance.passedAssessments,
          totalStudyTime: performance.totalStudyTime,
          currentStreak: performance.currentStreak,
          longestStreak: performance.longestStreak,
          categoryScores: [],
          recentTrends: [],
          strengths: [],
          improvementAreas: []
        }} className="lg:col-span-2" />
        {hasNoAchievements ? (
          <NoAchievementsEmptyState />
        ) : (
          <AchievementSystem earnedAchievements={achievements.map(a => ({
            ...a,
            earnedAt: a.earnedAt || ''
          }))} progressAchievements={[]} totalPoints={0} currentLevel={1} nextLevelPoints={100} />
        )}
      </div>
    </DashboardShell>
  )
}