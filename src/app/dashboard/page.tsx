import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Dashboard | AI Qualifier",
  description: "Your AI qualification dashboard",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back to your AI qualification journey"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Intermediate</div>
            <p className="text-xs text-muted-foreground">
              Progress: 67%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Points Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">
              +180 this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Qualifications</CardTitle>
            <CardDescription>
              Your latest qualification attempts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">AI Fundamentals</Badge>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Machine Learning Basics
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed 2 hours ago
                </p>
              </div>
              <Badge variant="default">Passed</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">AI Ethics</Badge>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Responsible AI Development
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed 1 day ago
                </p>
              </div>
              <Badge variant="default">Passed</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Neural Networks</Badge>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Deep Learning Fundamentals
                </p>
                <p className="text-sm text-muted-foreground">
                  In progress
                </p>
              </div>
              <Badge variant="outline">70%</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Next Qualification</CardTitle>
            <CardDescription>
              Continue your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Computer Vision Basics</h4>
              <p className="text-sm text-muted-foreground">
                Learn the fundamentals of computer vision and image processing
              </p>
              <Progress value={0} className="w-full" />
              <p className="text-xs text-muted-foreground">
                0% complete
              </p>
            </div>
            <Button className="w-full">Start Qualification</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}