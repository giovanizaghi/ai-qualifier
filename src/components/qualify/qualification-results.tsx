"use client";

import { ArrowLeft, Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface ProspectResult {
  id: string;
  domain: string;
  companyName: string | null;
  score: number;
  fitLevel: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  reasoning: string;
  matchedCriteria: any;
  gaps: any;
  status: string;
  error: string | null;
  analyzedAt: Date | null;
}

interface QualificationRun {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalProspects: number;
  completed: number;
  createdAt: Date;
  completedAt: Date | null;
  icp: {
    title: string;
    description: string;
    company: {
      name: string | null;
      domain: string;
    };
  };
  results: ProspectResult[];
}

interface QualificationResultsProps {
  run: QualificationRun;
}

export function QualificationResults({ run: initialRun }: QualificationResultsProps) {
  const [run, setRun] = useState(initialRun);
  const [selectedFit, setSelectedFit] = useState<string>("all");
  const [polling, setPolling] = useState(initialRun.status === "PROCESSING" || initialRun.status === "PENDING");

  // Enhanced real-time polling with better error handling
  useEffect(() => {
    if (run.status !== "PROCESSING" && run.status !== "PENDING") {return;}

    const pollInterval = setInterval(async () => {
      try {
        console.log(`Polling run ${run.id} - Current status: ${run.status}, Completed: ${run.completed}/${run.totalProspects}`);
        
        // Fetch updated run data with results
        const response = await fetch(`/api/qualify/${run.id}`, {
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const updatedRun = data.run;
        
        console.log(`Poll response - Status: ${updatedRun.status}, Completed: ${updatedRun.completed}/${updatedRun.totalProspects}`);
        
        // Always update the run state with fresh data
        setRun(updatedRun);
        
        // Stop polling when done
        if (updatedRun.status === "COMPLETED" || updatedRun.status === "FAILED") {
          console.log(`Stopping polling - Final status: ${updatedRun.status}`);
          setPolling(false);
        }
        
      } catch (error) {
        console.error("Polling error:", error);
        // Continue polling even on error, but reduce frequency
        setTimeout(() => {}, 1000);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      console.log(`Cleaning up polling for run ${run.id}`);
      clearInterval(pollInterval);
    };
  }, [run.id, polling]); // Remove run.completed and run.status from deps

  // Add real-time progress notifications
  useEffect(() => {
    if (run.status === "PROCESSING" && run.completed > 0) {
      const progress = Math.round((run.completed / run.totalProspects) * 100);
      toast.info(`Progress: ${run.completed}/${run.totalProspects} prospects analyzed (${progress}%)`, {
        id: `progress-${run.id}`, // Prevent duplicate toasts
        duration: 2000,
      });
    }
    
    if (run.status === "COMPLETED") {
      toast.success(`Qualification completed! ${run.totalProspects} prospects analyzed`);
    }
    
    if (run.status === "FAILED") {
      toast.error("Qualification failed. Please try again.");
    }
  }, [run.status, run.completed, run.totalProspects, run.id]);

  const getFitBadgeVariant = (fitLevel: string) => {
    switch (fitLevel) {
      case "EXCELLENT":
        return "default";
      case "GOOD":
        return "secondary";
      case "FAIR":
        return "outline";
      case "POOR":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getFitColor = (fitLevel: string) => {
    switch (fitLevel) {
      case "EXCELLENT":
        return "text-green-600";
      case "GOOD":
        return "text-blue-600";
      case "FAIR":
        return "text-yellow-600";
      case "POOR":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Filter results
  const filteredResults =
    selectedFit === "all"
      ? run.results
      : run.results.filter((r) => r.fitLevel === selectedFit);

  // Calculate stats
  const stats = {
    total: run.totalProspects,
    completed: run.completed,
    excellent: run.results.filter((r) => r.fitLevel === "EXCELLENT").length,
    good: run.results.filter((r) => r.fitLevel === "GOOD").length,
    fair: run.results.filter((r) => r.fitLevel === "FAIR").length,
    poor: run.results.filter((r) => r.fitLevel === "POOR").length,
    averageScore:
      run.results.length > 0
        ? Math.round(run.results.reduce((acc, r) => acc + r.score, 0) / run.results.length)
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" prefetch={true}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        {run.status === "COMPLETED" && (
          <Button variant="outline" asChild>
            <Link href="/qualify" prefetch={true}>Qualify More Prospects</Link>
          </Button>
        )}
      </div>

      {/* Status Banner */}
      {run.status === "PROCESSING" && (
        <Alert>
          <Loader2 className="w-4 h-4 animate-spin" />
          <AlertDescription>
            Processing... {run.completed} of {run.totalProspects} prospects analyzed
          </AlertDescription>
        </Alert>
      )}

      {run.status === "FAILED" && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Qualification run failed. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Run Info */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">{run.icp.title}</CardTitle>
          <CardDescription>
            Qualification run for {run.icp.company.name || run.icp.company.domain}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {run.completed} / {run.totalProspects}
                </span>
              </div>
              <Progress value={(run.completed / run.totalProspects) * 100} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Excellent</p>
                <p className="text-2xl font-bold text-green-600">{stats.excellent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Good</p>
                <p className="text-2xl font-bold text-blue-600">{stats.good}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fair</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.fair}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Poor</p>
                <p className="text-2xl font-bold text-red-600">{stats.poor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Prospect Results</CardTitle>
          <CardDescription>
            {filteredResults.length} prospect{filteredResults.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedFit} onValueChange={setSelectedFit}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({run.results.length})</TabsTrigger>
              <TabsTrigger value="EXCELLENT">Excellent ({stats.excellent})</TabsTrigger>
              <TabsTrigger value="GOOD">Good ({stats.good})</TabsTrigger>
              <TabsTrigger value="FAIR">Fair ({stats.fair})</TabsTrigger>
              <TabsTrigger value="POOR">Poor ({stats.poor})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedFit} className="space-y-4 mt-6">
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No prospects in this category</p>
                </div>
              ) : (
                filteredResults.map((result) => (
                  <Card key={result.id} className="border-l-4" style={{ borderLeftColor: result.fitLevel === "EXCELLENT" ? "#16a34a" : result.fitLevel === "GOOD" ? "#2563eb" : result.fitLevel === "FAIR" ? "#ca8a04" : "#dc2626" }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {result.companyName || result.domain}
                          </CardTitle>
                          <CardDescription>{result.domain}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getFitColor(result.fitLevel)}`}>
                            {result.score}%
                          </div>
                          <Badge variant={getFitBadgeVariant(result.fitLevel)}>
                            {result.fitLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.status === "FAILED" && result.error && (
                        <Alert variant="destructive">
                          <XCircle className="w-4 h-4" />
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      )}

                      {result.status === "COMPLETED" && (
                        <>
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Reasoning
                            </h4>
                            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                          </div>

                          {result.matchedCriteria && Array.isArray(result.matchedCriteria) && result.matchedCriteria.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                Matched Criteria
                              </h4>
                              <div className="space-y-2">
                                {result.matchedCriteria.map((criterion: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="font-medium">
                                        {criterion.criteria || criterion.criterion || (typeof criterion === "string" ? criterion : "Criterion")}
                                      </span>
                                      {criterion.evidence && (
                                        <span className="text-muted-foreground">: {criterion.evidence}</span>
                                      )}
                                      {criterion.confidence && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {criterion.confidence}% confident
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {result.gaps && Array.isArray(result.gaps) && result.gaps.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                Gaps
                              </h4>
                              <div className="space-y-2">
                                {result.gaps.map((gap: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{typeof gap === "string" ? gap : gap.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
