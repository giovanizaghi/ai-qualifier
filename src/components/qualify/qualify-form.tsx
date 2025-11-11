"use client";

import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

import { startNavigationProgress } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ICP {
  id: string;
  title: string;
  description: string;
  companyId?: string;
  companyName: string;
}

interface QualifyFormProps {
  icps: ICP[];
  defaultIcpId?: string;
}

export function QualifyForm({ icps, defaultIcpId }: QualifyFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIcpId, setSelectedIcpId] = useState(defaultIcpId || icps[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  // Auto-select ICP for companyId from query string
  useEffect(() => {
    const companyId = searchParams.get("companyId");
    if (companyId) {
      // Match by companyId field
      const icpForCompany = icps.find(icp => icp.companyId === companyId);
      if (icpForCompany) {
        setSelectedIcpId(icpForCompany.id);
      }
    }
  }, [searchParams, icps]);
  const [domains, setDomains] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Parse and validate domains
    const domainList = domains
      .split("\n")
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0);

    if (domainList.length === 0) {
      setError("Please enter at least one domain");
      return;
    }

    if (domainList.length > 50) {
      setError("Maximum 50 domains per batch");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icpId: selectedIcpId,
          domains: domainList,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start qualification");
      }

      // Show progress bar and redirect to results page
      startNavigationProgress();
      startTransition(() => {
        router.push(`/qualify/${data.run.id}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const selectedIcp = icps.find((icp) => icp.id === selectedIcpId);
  const domainCount = domains.split("\n").filter((d) => d.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link 
            href={searchParams.get("companyId") ? `/companies/${searchParams.get("companyId")}` : "/dashboard"}
            prefetch={true}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Company
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Qualify Prospects</h1>
        <p className="text-muted-foreground">Score prospects against your Ideal Customer Profile</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Select Your ICP</CardTitle>
            <CardDescription>Choose which profile to qualify prospects against</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icp">Ideal Customer Profile</Label>
              <Select value={selectedIcpId} onValueChange={setSelectedIcpId}>
                <SelectTrigger id="icp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {icps.map((icp) => (
                    <SelectItem key={icp.id} value={icp.id}>
                      {icp.title} ({icp.companyName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIcp && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedIcp.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Enter Prospect Domains</CardTitle>
            <CardDescription>One domain per line (max 50)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="domains">Prospect Domains</Label>
              <Textarea
                id="domains"
                placeholder="shopify.com&#10;woocommerce.com&#10;bigcommerce.com"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                rows={10}
                disabled={loading}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {domainCount} domain{domainCount !== 1 ? "s" : ""} entered (max 50)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" size="lg" className="flex-1" disabled={loading || isPending || domainCount === 0}>
                {loading || isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {loading ? "Starting Qualification..." : "Navigating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Qualify {domainCount} Prospect{domainCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. We'll analyze each prospect's website using AI</p>
          <p>2. Compare their profile against your ICP criteria</p>
          <p>3. Generate a fit score (0-100) with detailed reasoning</p>
          <p>4. Show which criteria match and which gaps exist</p>
          <p className="pt-2 text-xs">
            ⏱️ Processing typically takes 30-60 seconds per prospect
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
