"use client";

import { Loader2, X, ChevronRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ActiveRun {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalProspects: number;
  completed: number;
  icp: {
    title: string;
  };
}

interface ActiveRunNotifierProps {
  userId: string;
}

export function ActiveRunNotifier({ userId }: ActiveRunNotifierProps) {
  const router = useRouter();
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const previousRunsRef = useRef<Map<string, ActiveRun>>(new Map());

  // Poll for active runs
  useEffect(() => {
    const fetchActiveRuns = async () => {
      try {
        const response = await fetch("/api/qualify/active");
        if (response.ok) {
          const data = await response.json();
          const processing = data.runs.filter(
            (run: ActiveRun) => 
              (run.status === "PROCESSING" || run.status === "PENDING") &&
              !dismissed.has(run.id)
          );
          
          // Check for completed runs and show toast
          processing.forEach((run: ActiveRun) => {
            const previousRun = previousRunsRef.current.get(run.id);
            if (previousRun && previousRun.completed < run.completed && run.completed === run.totalProspects) {
              // Run just completed
              toast.success("Qualification Complete", {
                description: `${run.icp.title} - ${run.totalProspects} prospects analyzed`,
                action: {
                  label: "View Results",
                  onClick: () => router.push(`/qualify/${run.id}`),
                },
                duration: 10000,
              });
            }
          });

          // Update refs for next comparison
          processing.forEach((run: ActiveRun) => {
            previousRunsRef.current.set(run.id, run);
          });

          setActiveRuns(processing);
          setIsVisible(processing.length > 0);
        }
      } catch (error) {
        console.error("Failed to fetch active runs:", error);
      }
    };

    // Initial fetch
    fetchActiveRuns();

    // Poll every 3 seconds
    const interval = setInterval(fetchActiveRuns, 3000);

    return () => clearInterval(interval);
  }, [dismissed, router]);

  const handleNavigate = (runId: string) => {
    router.push(`/qualify/${runId}`);
  };

  const handleDismiss = (runId: string) => {
    setDismissed((prev) => new Set([...prev, runId]));
    setActiveRuns((prev) => prev.filter((run) => run.id !== runId));
  };

  if (!isVisible || activeRuns.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      {activeRuns.map((run) => {
        const progress = run.totalProspects > 0 
          ? (run.completed / run.totalProspects) * 100 
          : 0;

        return (
          <Card
            key={run.id}
            className={cn(
              "p-4 shadow-lg border-2 animate-in slide-in-from-bottom-5",
              "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">
                      Qualifying Prospects
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {run.icp.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismiss(run.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {run.completed} of {run.totalProspects} prospects analyzed
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => handleNavigate(run.id)}
                >
                  View Progress
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
