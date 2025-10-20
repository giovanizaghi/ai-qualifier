import { GridCardSkeleton } from "@/components/skeletons"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function QualificationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-full max-w-3xl" />
        </div>

        {/* Search and Filters Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Qualification Cards Skeleton */}
        <GridCardSkeleton count={6} />
      </div>
    </div>
  )
}
