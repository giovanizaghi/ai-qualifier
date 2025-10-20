"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  variant?: "error" | "warning" | "info";
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  title,
  message,
  variant = "error",
  onRetry,
  className,
}: ErrorDisplayProps) {
  const variantConfig = {
    error: {
      icon: XCircle,
      title: title || "Error",
      variant: "destructive" as const,
    },
    warning: {
      icon: AlertTriangle,
      title: title || "Warning",
      variant: "default" as const,
    },
    info: {
      icon: Info,
      title: title || "Information",
      variant: "default" as const,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <div>{message}</div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorCard({ title, message, onRetry, onBack }: ErrorCardProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {title || "Something went wrong"}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              Try Again
            </Button>
          )}
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Application Error
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message}
            </p>
          </div>
          <Button onClick={resetErrorBoundary} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
