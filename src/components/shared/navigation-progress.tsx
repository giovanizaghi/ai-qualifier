"use client"

import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import { useEffect, Suspense } from "react"
import "nprogress/nprogress.css"

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500,
})

function NavigationProgressImpl() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Complete progress when route changes
    NProgress.done()
  }, [pathname, searchParams])

  return null
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressImpl />
    </Suspense>
  )
}

// Export this function to be called when navigation starts
export const startNavigationProgress = () => {
  NProgress.start()
}
