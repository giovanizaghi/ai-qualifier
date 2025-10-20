"use client"

import { BadgeIcon, CalendarIcon, ShareIcon, DownloadIcon, TrophyIcon, AwardIcon, StarIcon, TargetIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for achievements
const mockAchievements = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first assessment",
    type: "badge",
    category: "milestone",
    earnedAt: new Date("2024-01-15"),
    icon: "🚀",
    rarity: "common",
    points: 100,
  },
  {
    id: "2", 
    title: "Machine Learning Fundamentals",
    description: "Pass the ML Fundamentals certification",
    type: "certificate",
    category: "certification",
    earnedAt: new Date("2024-02-20"),
    icon: "🤖",
    rarity: "rare",
    points: 500,
    certificateUrl: "/certificates/ml-fundamentals.pdf",
  },
  {
    id: "3",
    title: "Streak Master",
    description: "Maintain a 30-day learning streak",
    type: "badge",
    category: "engagement",
    earnedAt: new Date("2024-03-10"),
    icon: "🔥",
    rarity: "epic",
    points: 300,
  },
  {
    id: "4",
    title: "Data Science Expert",
    description: "Complete all Data Science qualifications",
    type: "certificate",
    category: "certification",
    earnedAt: new Date("2024-03-25"),
    icon: "📊",
    rarity: "legendary",
    points: 1000,
    certificateUrl: "/certificates/data-science-expert.pdf",
  },
]

const mockUpcomingAchievements = [
  {
    id: "5",
    title: "AI Pioneer",
    description: "Complete 10 AI assessments",
    type: "badge",
    category: "skill",
    progress: 7,
    total: 10,
    icon: "🧠",
    rarity: "rare",
    estimatedPoints: 750,
  },
  {
    id: "6",
    title: "Community Contributor",
    description: "Help 5 other learners",
    type: "badge", 
    category: "community",
    progress: 2,
    total: 5,
    icon: "🤝",
    rarity: "uncommon",
    estimatedPoints: 250,
  },
  {
    id: "7",
    title: "Speed Demon",
    description: "Complete an assessment in under 10 minutes",
    type: "badge",
    category: "performance",
    progress: 0,
    total: 1,
    icon: "⚡",
    rarity: "epic",
    estimatedPoints: 400,
  },
]

interface AchievementGalleryProps {
  userId: string
}

export function AchievementGallery({ userId }: AchievementGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const filteredAchievements = mockAchievements.filter((achievement) => {
    const matchesSearch = achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || achievement.category === filterCategory
    const matchesType = filterType === "all" || achievement.type === filterType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const handleShare = (achievement: typeof mockAchievements[0]) => {
    if (navigator.share) {
      navigator.share({
        title: `I earned: ${achievement.title}`,
        text: achievement.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(`I earned: ${achievement.title} - ${achievement.description}`)
      toast.success("Achievement details copied to clipboard!")
    }
  }

  const handleDownload = (certificateUrl: string, title: string) => {
    // In a real app, this would download the actual certificate
    toast.success(`Certificate "${title}" download started`)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-800 border-gray-200"
      case "uncommon": return "bg-green-100 text-green-800 border-green-200"
      case "rare": return "bg-blue-100 text-blue-800 border-blue-200"
      case "epic": return "bg-purple-100 text-purple-800 border-purple-200"
      case "legendary": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "milestone": return <TargetIcon className="h-4 w-4" />
      case "certification": return <AwardIcon className="h-4 w-4" />
      case "engagement": return <StarIcon className="h-4 w-4" />
      case "skill": return <TrophyIcon className="h-4 w-4" />
      case "community": return <BadgeIcon className="h-4 w-4" />
      case "performance": return <StarIcon className="h-4 w-4" />
      default: return <BadgeIcon className="h-4 w-4" />
    }
  }

  const totalPoints = mockAchievements.reduce((sum, achievement) => sum + achievement.points, 0)
  const totalAchievements = mockAchievements.length
  const certificates = mockAchievements.filter(a => a.type === "certificate").length
  const badges = mockAchievements.filter(a => a.type === "badge").length

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrophyIcon className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AwardIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{totalAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BadgeIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">{certificates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <StarIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Badges</p>
                <p className="text-2xl font-bold">{badges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned">Earned Achievements</TabsTrigger>
          <TabsTrigger value="upcoming">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="milestone">Milestones</SelectItem>
                <SelectItem value="certification">Certifications</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="skill">Skills</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="badge">Badges</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getCategoryIcon(achievement.category)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {achievement.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                      {achievement.rarity}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{achievement.earnedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <TrophyIcon className="h-4 w-4" />
                      <span>{achievement.points} pts</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(achievement)}
                      className="flex-1"
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    
                    {achievement.type === "certificate" && achievement.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(achievement.certificateUrl!, achievement.title)}
                        className="flex-1"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterCategory !== "all" || filterType !== "all" 
                    ? "Try adjusting your filters to see more achievements."
                    : "Start learning to earn your first achievement!"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockUpcomingAchievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl opacity-60">{achievement.icon}</div>
                      <div>
                        <CardTitle className="text-lg text-muted-foreground">
                          {achievement.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getCategoryIcon(achievement.category)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {achievement.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                      {achievement.rarity}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {achievement.progress} / {achievement.total}
                      </span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.total) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <TrophyIcon className="h-4 w-4" />
                      <span>{achievement.estimatedPoints} pts</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {achievement.total - achievement.progress} remaining
                    </Badge>
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