"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  Play, 
  MapPin, 
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

interface LearningPathNode {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  estimatedDuration: number // in minutes
  status: 'completed' | 'in_progress' | 'available' | 'locked'
  progress?: number
  prerequisites: string[]
  unlocks: string[]
  isRecommended?: boolean
  completionScore?: number
}

interface LearningPath {
  id: string
  title: string
  description: string
  totalNodes: number
  completedNodes: number
  estimatedTotalTime: number
  nodes: LearningPathNode[]
}

interface LearningPathVisualizationProps {
  learningPaths: LearningPath[]
  currentPath?: LearningPath
  recommendations: LearningPathNode[]
  className?: string
}

export function LearningPathVisualization({ 
  learningPaths,
  currentPath,
  recommendations,
  className 
}: LearningPathVisualizationProps) {
  const getStatusIcon = (status: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-600" />
      case 'available':
        return <Circle className="h-5 w-5 text-gray-400" />
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-300" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'available':
        return 'border-gray-200 bg-white hover:bg-gray-50'
      case 'locked':
        return 'border-gray-100 bg-gray-50 opacity-60'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-orange-100 text-orange-800'
      case 'expert':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Learning Path Visualization
        </CardTitle>
        <CardDescription>
          Navigate your AI qualification journey with guided learning paths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Path Overview */}
        {currentPath && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-lg">{currentPath.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPath.description}
                </p>
              </div>
              <Badge variant="default" className="bg-blue-600">
                Active Path
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentPath.completedNodes}/{currentPath.totalNodes}
                </div>
                <div className="text-xs text-muted-foreground">Qualifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((currentPath.completedNodes / currentPath.totalNodes) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(currentPath.estimatedTotalTime / 60)}h
                </div>
                <div className="text-xs text-muted-foreground">Est. Time</div>
              </div>
            </div>

            <Progress 
              value={(currentPath.completedNodes / currentPath.totalNodes) * 100} 
              className="h-2" 
            />
          </div>
        )}

        {/* Path Visualization */}
        {currentPath && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">CURRENT PATH PROGRESS</h4>
            <div className="relative">
              {/* Path Line */}
              <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-4">
                {currentPath.nodes.map((node, index) => (
                  <div key={node.id} className="relative flex items-start gap-4">
                    {/* Node Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      {getStatusIcon(node.status, node.progress)}
                    </div>

                    {/* Node Content */}
                    <div className={`flex-1 p-4 rounded-lg border-2 transition-all ${getStatusColor(node.status)} ${
                      node.isRecommended ? 'ring-2 ring-blue-300' : ''
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            {node.title}
                            {node.isRecommended && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Recommended Next
                              </Badge>
                            )}
                          </h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            {node.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className={`text-xs ${getDifficultyColor(node.difficulty)}`}>
                            {node.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {node.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Bar for In-Progress */}
                      {node.status === 'in_progress' && node.progress !== undefined && (
                        <div className="mb-3">
                          <Progress value={node.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{node.progress}% complete</span>
                            <span>{node.estimatedDuration} min remaining</span>
                          </div>
                        </div>
                      )}

                      {/* Node Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {node.estimatedDuration} min
                          </div>
                          {node.completionScore && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Score: {node.completionScore}%
                            </div>
                          )}
                        </div>
                        
                        {node.status === 'available' && (
                          <Link href={`/assessments/${node.id}`}>
                            <Button size="sm" variant="outline">
                              Start
                            </Button>
                          </Link>
                        )}
                        
                        {node.status === 'in_progress' && (
                          <Link href={`/assessments/${node.id}`}>
                            <Button size="sm" variant="default">
                              Continue
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommended Next Steps */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              RECOMMENDED NEXT STEPS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.slice(0, 4).map((recommendation) => (
                <div key={recommendation.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm">{recommendation.title}</h5>
                    <Badge variant="outline" className={`text-xs ${getDifficultyColor(recommendation.difficulty)}`}>
                      {recommendation.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {recommendation.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {recommendation.estimatedDuration} min
                    </div>
                    <Link href={`/assessments/${recommendation.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Start <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Learning Paths */}
        {learningPaths.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">AVAILABLE LEARNING PATHS</h4>
              <Link href="/learning-paths">
                <Button variant="ghost" size="sm" className="text-xs">
                  Browse all paths
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {learningPaths.filter(path => path.id !== currentPath?.id).slice(0, 2).map((path) => (
                <div key={path.id} className="p-3 border rounded-lg">
                  <h5 className="font-medium text-sm mb-1">{path.title}</h5>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {path.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-muted-foreground">
                      {path.totalNodes} qualifications • {Math.round(path.estimatedTotalTime / 60)}h
                    </div>
                    <Link href={`/learning-paths/${path.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Explore
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}