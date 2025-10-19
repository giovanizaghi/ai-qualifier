"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Clock, AlertTriangle, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AssessmentTimerProps {
  totalTimeMinutes: number
  onTimeUp: () => void
  onTimeUpdate?: (remainingSeconds: number) => void
  isActive?: boolean
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  className?: string
  showControls?: boolean
  warningThresholdMinutes?: number
  criticalThresholdMinutes?: number
}

export function AssessmentTimer({
  totalTimeMinutes,
  onTimeUp,
  onTimeUpdate,
  isActive = true,
  isPaused = false,
  onPause,
  onResume,
  className = "",
  showControls = false,
  warningThresholdMinutes = 10,
  criticalThresholdMinutes = 5
}: AssessmentTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalTimeMinutes * 60)
  const [isRunning, setIsRunning] = useState(isActive && !isPaused)

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getTimerStatus = useCallback(() => {
    const remainingMinutes = remainingSeconds / 60
    
    if (remainingMinutes <= criticalThresholdMinutes) {
      return { status: 'critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950' }
    } else if (remainingMinutes <= warningThresholdMinutes) {
      return { status: 'warning', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950' }
    }
    return { status: 'normal', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-50 dark:bg-gray-950' }
  }, [remainingSeconds, criticalThresholdMinutes, warningThresholdMinutes])

  const getProgressPercentage = useCallback(() => {
    return ((totalTimeMinutes * 60 - remainingSeconds) / (totalTimeMinutes * 60)) * 100
  }, [remainingSeconds, totalTimeMinutes])

  useEffect(() => {
    setIsRunning(isActive && !isPaused)
  }, [isActive, isPaused])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newTime = prev - 1
          onTimeUpdate?.(newTime)
          
          if (newTime <= 0) {
            setIsRunning(false)
            onTimeUp()
            return 0
          }
          
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, remainingSeconds, onTimeUp, onTimeUpdate])

  // Audio warning for critical time
  useEffect(() => {
    const remainingMinutes = remainingSeconds / 60
    
    if (remainingMinutes === criticalThresholdMinutes && remainingSeconds % 60 === 0) {
      // Play warning sound if browser supports it
      try {
        const audio = new Audio('/sounds/warning.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {
          // Ignore audio play errors (user hasn't interacted with page yet)
        })
      } catch (error) {
        // Audio not available
      }
    }
  }, [remainingSeconds, criticalThresholdMinutes])

  const handlePauseResume = () => {
    if (isRunning) {
      onPause?.()
    } else {
      onResume?.()
    }
  }

  const timerStatus = getTimerStatus()
  const progressPercentage = getProgressPercentage()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Progress Bar */}
      <div className="hidden sm:block w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            timerStatus.status === 'critical' 
              ? 'bg-red-500' 
              : timerStatus.status === 'warning' 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Timer Display */}
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border
        ${timerStatus.bgColor} border-current/20
      `}>
        <Clock className={`w-4 h-4 ${timerStatus.color}`} />
        <span className={`font-mono text-sm font-medium ${timerStatus.color}`}>
          {formatTime(remainingSeconds)}
        </span>
        
        {timerStatus.status === 'critical' && (
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        )}
        
        {isPaused && (
          <Badge variant="secondary" className="text-xs py-0 px-1">
            PAUSED
          </Badge>
        )}
      </div>

      {/* Control Buttons */}
      {showControls && (onPause || onResume) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePauseResume}
          className="p-2"
          aria-label={isRunning ? "Pause timer" : "Resume timer"}
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Time Remaining Text for Screen Readers */}
      <span className="sr-only">
        {remainingSeconds > 60 
          ? `${Math.floor(remainingSeconds / 60)} minutes and ${remainingSeconds % 60} seconds remaining`
          : `${remainingSeconds} seconds remaining`
        }
        {timerStatus.status === 'critical' && " - Time is running out!"}
      </span>
    </div>
  )
}

// Component for time-based warnings
export function TimeWarning({ 
  remainingMinutes, 
  onDismiss,
  className = ""
}: { 
  remainingMinutes: number
  onDismiss?: () => void
  className?: string 
}) {
  if (remainingMinutes > 10) return null

  const isCritical = remainingMinutes <= 5
  
  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg
      ${isCritical 
        ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' 
        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      }
      ${className}
    `} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`
          w-5 h-5 mt-0.5 
          ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}
        `} />
        <div className="flex-1">
          <h4 className={`
            font-medium text-sm
            ${isCritical ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}
          `}>
            {isCritical ? 'Time Almost Up!' : 'Time Warning'}
          </h4>
          <p className={`
            text-sm mt-1
            ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}
          `}>
            Only {Math.floor(remainingMinutes)} minute{Math.floor(remainingMinutes) !== 1 ? 's' : ''} remaining. 
            {isCritical ? ' Please submit your answers soon.' : ' Consider reviewing your answers.'}
          </p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="p-1 h-auto"
            aria-label="Dismiss warning"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  )
}