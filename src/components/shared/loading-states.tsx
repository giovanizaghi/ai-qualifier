"use client";

import { Loader2, Brain, Search, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({ message, fullScreen, className }: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          {message && <p className="text-muted-foreground">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  message?: string;
}

export function LoadingCard({ title, message }: LoadingCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          {title && <h3 className="font-semibold">{title}</h3>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
}

interface AnalysisLoadingProps {
  domain?: string;
  stage?: 'fetching' | 'analyzing' | 'generating' | 'complete';
  className?: string;
}

export function AnalysisLoading({ domain, stage = 'fetching', className }: AnalysisLoadingProps) {
  const stages = [
    { key: 'fetching', label: 'Fetching website data', icon: Search, active: stage === 'fetching' },
    { key: 'analyzing', label: 'Analyzing content', icon: Brain, active: stage === 'analyzing' },
    { key: 'generating', label: 'Generating ICP', icon: Brain, active: stage === 'generating' },
  ];

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            {domain && (
              <p className="text-sm font-medium mb-1">Analyzing {domain}</p>
            )}
            <p className="text-xs text-muted-foreground">This may take a few moments...</p>
          </div>

          <div className="space-y-3">
            {stages.map((s) => {
              const Icon = s.icon;
              const isComplete = stages.findIndex(st => st.key === stage) > stages.findIndex(st => st.key === s.key);
              
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    isComplete && "border-green-500 bg-green-50",
                    s.active && "border-primary bg-primary/10",
                    !s.active && !isComplete && "border-muted bg-muted/50"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className={cn(
                        "h-4 w-4",
                        s.active && "animate-pulse text-primary",
                        !s.active && "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    s.active && "font-medium text-foreground",
                    isComplete && "text-green-600",
                    !s.active && !isComplete && "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QualificationProgressProps {
  total: number;
  completed: number;
  current?: string;
  className?: string;
}

export function QualificationProgress({ total, completed, current, className }: QualificationProgressProps) {
  const progress = (completed / total) * 100;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Qualifying Prospects</h3>
              <p className="text-sm text-muted-foreground">
                {completed} of {total} complete
              </p>
            </div>
            <LoadingSpinner size="lg" />
          </div>

          <Progress value={progress} className="h-2" />

          {current && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingDots />
              <span>Currently analyzing: {current}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = "Loading", className }: InlineLoadingProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
