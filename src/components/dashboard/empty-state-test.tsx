"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardEmptyStateTestProps {
  onStateChange: (state: 'new-user' | 'no-progress' | 'no-achievements' | 'normal') => void
  currentState: string
}

export function DashboardEmptyStateTest({ 
  onStateChange, 
  currentState 
}: DashboardEmptyStateTestProps) {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm">🚧 Empty State Testing Tool</CardTitle>
        <CardDescription className="text-xs">
          This tool is only visible in development. Use it to test different dashboard states.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={currentState === 'new-user' ? 'default' : 'outline'}
            onClick={() => onStateChange('new-user')}
          >
            New User
          </Button>
          <Button
            size="sm"
            variant={currentState === 'no-progress' ? 'default' : 'outline'}
            onClick={() => onStateChange('no-progress')}
          >
            No Active Progress
          </Button>
          <Button
            size="sm"
            variant={currentState === 'no-achievements' ? 'default' : 'outline'}
            onClick={() => onStateChange('no-achievements')}
          >
            No Achievements
          </Button>
          <Button
            size="sm"
            variant={currentState === 'normal' ? 'default' : 'outline'}
            onClick={() => onStateChange('normal')}
          >
            Normal State
          </Button>
        </div>
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            Current: {currentState}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}