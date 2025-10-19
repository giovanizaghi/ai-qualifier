"use client"

import dynamic from 'next/dynamic'
import { Spinner } from '@/components/ui/spinner'

// Dynamically import heavy components with loading states
const AssessmentInterface = dynamic(
  () => import('./assessment-interface').then(mod => ({ default: mod.AssessmentInterface })),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-muted-foreground">Loading assessment interface...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

const AssessmentResults = dynamic(
  () => import('./assessment-results').then(mod => ({ default: mod.AssessmentResults })),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export { AssessmentInterface, AssessmentResults }