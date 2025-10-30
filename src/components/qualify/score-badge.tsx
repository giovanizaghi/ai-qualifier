"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  fitLevel: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, fitLevel, size = "md" }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const fitLevelConfig = {
    EXCELLENT: {
      label: "Excellent Fit",
      className: "bg-green-100 text-green-800 border-green-300",
    },
    GOOD: {
      label: "Good Fit",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    FAIR: {
      label: "Fair Fit",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    POOR: {
      label: "Poor Fit",
      className: "bg-red-100 text-red-800 border-red-300",
    },
  };

  const config = fitLevelConfig[fitLevel];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn("font-bold text-2xl", getScoreColor(score))}>
        {Math.round(score)}
      </div>
      <Badge
        variant="outline"
        className={cn(sizeClasses[size], config.className, "border font-semibold")}
      >
        {config.label}
      </Badge>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) {return "text-green-600";}
  if (score >= 60) {return "text-blue-600";}
  if (score >= 40) {return "text-yellow-600";}
  return "text-red-600";
}
