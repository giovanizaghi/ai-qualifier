import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DashboardWidgetSkeletonProps {
  className?: string
  type?: 'stat' | 'chart' | 'list' | 'progress'
}

export function DashboardWidgetSkeleton({ 
  className, 
  type = 'stat' 
}: DashboardWidgetSkeletonProps) {
  if (type === 'stat') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'chart') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'list') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'progress') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

export function DashboardGridSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardWidgetSkeleton key={i} type="stat" />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetSkeleton type="chart" />
        <DashboardWidgetSkeleton type="chart" />
      </div>

      {/* Activity and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidgetSkeleton type="list" />
        <DashboardWidgetSkeleton type="progress" />
      </div>
    </div>
  )
}
