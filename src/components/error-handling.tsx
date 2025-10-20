"use client"

import { AlertTriangle, RefreshCw, WifiOff, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NetworkErrorProps {
  onRetry?: () => void | Promise<void>
  message?: string
  className?: string
}

export function NetworkError({ 
  onRetry, 
  message = "Unable to connect to the server",
  className 
}: NetworkErrorProps) {
  const [retrying, setRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    if (!onRetry) {return}
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Alert variant="destructive" className={cn("border-red-500", className)}>
      <WifiOff className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Network Error
        {!isOnline && (
          <span className="text-xs font-normal">Offline</span>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        {!isOnline ? (
          <p className="text-sm">Please check your internet connection and try again.</p>
        ) : (
          <p className="text-sm">The server may be temporarily unavailable. Please try again.</p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={retrying || !isOnline}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
            {retrying ? "Retrying..." : "Try Again"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface RetryableErrorProps {
  error: Error | string
  onRetry?: () => void | Promise<void>
  maxRetries?: number
  autoRetry?: boolean
  retryDelay?: number
  className?: string
}

export function RetryableError({
  error,
  onRetry,
  maxRetries = 3,
  autoRetry = false,
  retryDelay = 2000,
  className,
}: RetryableErrorProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null)

  const errorMessage = typeof error === 'string' ? error : error.message

  useEffect(() => {
    if (autoRetry && retryCount < maxRetries && autoRetryCountdown === null) {
      setAutoRetryCountdown(retryDelay / 1000)
    }
  }, [autoRetry, retryCount, maxRetries, autoRetryCountdown, retryDelay])

  useEffect(() => {
    if (autoRetryCountdown !== null && autoRetryCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoRetryCountdown(autoRetryCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (autoRetryCountdown === 0) {
      handleRetry()
    }
    return undefined
  }, [autoRetryCountdown])

  const handleRetry = async () => {
    if (!onRetry || retryCount >= maxRetries) {return}
    
    setRetrying(true)
    setAutoRetryCountdown(null)
    
    try {
      await onRetry()
      setRetryCount(0) // Reset on success
    } catch (err) {
      setRetryCount(prev => prev + 1)
    } finally {
      setRetrying(false)
    }
  }

  const canRetry = retryCount < maxRetries && onRetry

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{errorMessage}</p>
        
        {retryCount > 0 && (
          <p className="text-sm">
            Retry attempt {retryCount} of {maxRetries}
          </p>
        )}

        {autoRetryCountdown !== null && autoRetryCountdown > 0 && (
          <p className="text-sm">
            Auto-retrying in {autoRetryCountdown} second{autoRetryCountdown !== 1 ? 's' : ''}...
          </p>
        )}

        {canRetry && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
              {retrying ? "Retrying..." : "Try Again"}
            </Button>
            {retryCount >= maxRetries && (
              <span className="text-xs">Maximum retries reached</span>
            )}
          </div>
        )}

        {!canRetry && retryCount >= maxRetries && (
          <p className="text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface FormErrorProps {
  error: string | string[]
  field?: string
  onDismiss?: () => void
  className?: string
}

export function FormError({ error, field, onDismiss, className }: FormErrorProps) {
  const errors = Array.isArray(error) ? error : [error]

  return (
    <Alert variant="destructive" className={cn("animate-in slide-in-from-top-2", className)}>
      <XCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {field ? `${field} Error` : "Validation Error"}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-0 hover:bg-transparent"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        {errors.length === 1 ? (
          <p>{errors[0]}</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface OfflineIndicatorProps {
  message?: string
}

export function OfflineIndicator({ 
  message = "You are currently offline. Some features may be unavailable." 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {return null}

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </Alert>
    </div>
  )
}

interface DataSyncStatusProps {
  syncing: boolean
  lastSynced?: Date
  error?: string
  onRetry?: () => void
}

export function DataSyncStatus({ syncing, lastSynced, error, onRetry }: DataSyncStatusProps) {
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    if (syncing || error) {
      setShowStatus(true)
    } else if (lastSynced) {
      setShowStatus(true)
      const timer = setTimeout(() => setShowStatus(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [syncing, error, lastSynced])

  if (!showStatus) {return null}

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Card className={cn(
        "border",
        error ? "border-red-500 bg-red-50 dark:bg-red-950" : 
        syncing ? "border-blue-500 bg-blue-50 dark:bg-blue-950" :
        "border-green-500 bg-green-50 dark:bg-green-950"
      )}>
        <CardContent className="p-3 flex items-center gap-3">
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Syncing...
              </span>
            </>
          ) : error ? (
            <>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Sync failed
              </span>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-auto p-1 text-red-700 dark:text-red-300"
                >
                  Retry
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Synced {lastSynced && formatSyncTime(lastSynced)}
              </span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatSyncTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) {return 'just now'}
  if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ago`}
  return `${Math.floor(seconds / 3600)}h ago`
}
