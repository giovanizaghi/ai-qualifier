"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Clock, 
  BookOpen, 
  Award,
  Crown,
  Flame,
  TrendingUp,
  Users,
  Lock
} from "lucide-react"
import Link from "next/link"

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  iconUrl?: string
  category: string
  value?: number
  qualificationId?: string
  earnedAt: string
  isNew?: boolean
}

interface AchievementProgress {
  id: string
  title: string
  description: string
  category: string
  currentValue: number
  targetValue: number
  progress: number
  icon: string
}

interface AchievementSystemProps {
  earnedAchievements: Achievement[]
  progressAchievements: AchievementProgress[]
  totalPoints: number
  currentLevel: number
  nextLevelPoints: number
  className?: string
}

export function AchievementSystem({ 
  earnedAchievements, 
  progressAchievements,
  totalPoints,
  currentLevel,
  nextLevelPoints,
  className 
}: AchievementSystemProps) {
  const getAchievementIcon = (type: string, category: string) => {
    switch (type) {
      case 'FIRST_QUALIFICATION':
        return <BookOpen className="h-5 w-5" />
      case 'QUALIFICATION_COMPLETED':
        return <Trophy className="h-5 w-5" />
      case 'PERFECT_SCORE':
        return <Crown className="h-5 w-5" />
      case 'QUICK_LEARNER':
        return <Zap className="h-5 w-5" />
      case 'CONSISTENT_LEARNER':
        return <Clock className="h-5 w-5" />
      case 'STREAK_ACHIEVEMENT':
        return <Flame className="h-5 w-5" />
      case 'CATEGORY_EXPERT':
        return <Star className="h-5 w-5" />
      case 'IMPROVEMENT_MILESTONE':
        return <TrendingUp className="h-5 w-5" />
      case 'COMMUNITY_CONTRIBUTOR':
        return <Users className="h-5 w-5" />
      default:
        return <Award className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'completion':
        return 'bg-green-500'
      case 'streak':
        return 'bg-orange-500'
      case 'performance':
        return 'bg-blue-500'
      case 'speed':
        return 'bg-purple-500'
      case 'community':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const levelProgress = nextLevelPoints > 0 ? (totalPoints / nextLevelPoints) * 100 : 100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements & Progress
        </CardTitle>
        <CardDescription>
          Track your milestones and unlock new achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Progress */}
        <div className="p-4 bg-gradient-to-r from-gold-50 to-yellow-50 rounded-lg border border-gold-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold-600" />
              <span className="font-medium">Level {currentLevel}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalPoints} / {nextLevelPoints} points
            </div>
          </div>
          <Progress value={levelProgress} className="h-3 mb-2" />
          <div className="text-sm text-muted-foreground">
            {nextLevelPoints - totalPoints} points until Level {currentLevel + 1}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">RECENT ACHIEVEMENTS</h4>
            <Link href="/achievements">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </div>
          
          {earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {earnedAchievements.slice(0, 4).map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-3 rounded-lg border-2 ${
                    achievement.isNew ? 'border-gold-300 bg-gold-50' : 'border-gray-200 bg-gray-50'
                  } relative`}
                >
                  {achievement.isNew && (
                    <Badge className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs">
                      NEW!
                    </Badge>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(achievement.category)} text-white`}>
                      {getAchievementIcon(achievement.type, achievement.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{achievement.title}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                        {achievement.value && (
                          <span className="text-xs text-muted-foreground">
                            +{achievement.value} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No achievements yet</p>
              <p className="text-sm">Complete qualifications to earn your first achievement</p>
            </div>
          )}
        </div>

        {/* Progress Towards New Achievements */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">IN PROGRESS</h4>
          
          {progressAchievements.length > 0 ? (
            <div className="space-y-3">
              {progressAchievements.slice(0, 3).map((progress) => (
                <div key={progress.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                      {progress.icon === 'lock' ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        getAchievementIcon(progress.icon, progress.category)
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{progress.title}</h5>
                          <p className="text-xs text-muted-foreground">
                            {progress.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {progress.category}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {progress.currentValue} / {progress.targetValue}
                          </span>
                          <span className="font-medium">
                            {Math.round(progress.progress)}%
                          </span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No achievements in progress</p>
            </div>
          )}
        </div>

        {/* Achievement Categories */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">CATEGORIES</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { name: 'Completion', count: earnedAchievements.filter(a => a.category === 'completion').length, color: 'bg-green-500' },
              { name: 'Performance', count: earnedAchievements.filter(a => a.category === 'performance').length, color: 'bg-blue-500' },
              { name: 'Streak', count: earnedAchievements.filter(a => a.category === 'streak').length, color: 'bg-orange-500' },
              { name: 'Speed', count: earnedAchievements.filter(a => a.category === 'speed').length, color: 'bg-purple-500' },
              { name: 'Community', count: earnedAchievements.filter(a => a.category === 'community').length, color: 'bg-pink-500' },
              { name: 'Special', count: earnedAchievements.filter(a => a.category === 'special').length, color: 'bg-indigo-500' },
            ].map((category) => (
              <div key={category.name} className="text-center p-2 border rounded-lg">
                <div className={`w-8 h-8 ${category.color} rounded-full mx-auto mb-1 flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{category.count}</span>
                </div>
                <div className="text-xs font-medium">{category.name}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}