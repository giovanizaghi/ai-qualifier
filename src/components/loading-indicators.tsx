"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  message?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  className?: string
}

export function LoadingIndicator({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className,
}: LoadingIndicatorProps) {
  const spinnerSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-12 h-12" : "w-8 h-8"

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Spinner className={spinnerSize} />
      {message && (
        <p className={cn(
          "text-gray-600 dark:text-gray-400",
          size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
        )}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {content}
      </div>
    )
  }

  return content
}

interface SavingIndicatorProps {
  message?: string
  variant?: "inline" | "toast"
}

export function SavingIndicator({ 
  message = "Saving...", 
  variant = "inline" 
}: SavingIndicatorProps) {
  if (variant === "toast") {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Spinner className="w-5 h-5" />
            <span className="text-sm font-medium">{message}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Spinner className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

interface ProgressSavingIndicatorProps {
  show: boolean
  message?: string
}

export function ProgressSavingIndicator({ 
  show, 
  message = "Progress saved" 
}: ProgressSavingIndicatorProps) {
  if (!show) {return null}

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {message}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

interface SubmissionProcessingProps {
  message?: string
}

export function SubmissionProcessing({ 
  message = "Processing your submission..." 
}: SubmissionProcessingProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6">
            <Spinner className="w-16 h-16" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">{message}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we process your assessment...
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '75%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PaginationLoadingProps {
  message?: string
}

export function PaginationLoading({ 
  message = "Loading more..." 
}: PaginationLoadingProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3">
        <Spinner className="w-5 h-5" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner className="w-4 h-4" />
      {text && <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  )
}
