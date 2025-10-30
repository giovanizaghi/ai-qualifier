"use client";

import { Loader2, Building2, Sparkles, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingStep = "welcome" | "domain" | "analyzing" | "review" | "complete";

interface ICP {
  id: string;
  title: string;
  description: string;
  buyerPersonas: any;
  companySize: any;
  industries: string[];
  geographicRegions: string[];
  fundingStages: string[];
}

interface Company {
  id: string;
  domain: string;
  name: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
}

export function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [icp, setIcp] = useState<ICP | null>(null);

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStep("analyzing");

    try {
      const response = await fetch("/api/companies/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze company");
      }

      setCompany(data.company);
      setIcp(data.icp);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("domain");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {["welcome", "domain", "analyzing", "review"].map((s, i) => (
            <div
              key={s}
              className={`flex items-center ${
                i < ["welcome", "domain", "analyzing", "review"].indexOf(step)
                  ? "text-green-600"
                  : i === ["welcome", "domain", "analyzing", "review"].indexOf(step)
                  ? "text-primary"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  i < ["welcome", "domain", "analyzing", "review"].indexOf(step)
                    ? "border-green-600 bg-green-600 text-white"
                    : i === ["welcome", "domain", "analyzing", "review"].indexOf(step)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-gray-300 bg-white"
                }`}
              >
                {i < ["welcome", "domain", "analyzing", "review"].indexOf(step) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              {i < 3 && (
                <div
                  className={`h-0.5 w-12 md:w-24 mx-2 ${
                    i < ["welcome", "domain", "analyzing", "review"].indexOf(step)
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Welcome Step */}
      {step === "welcome" && (
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Welcome to ICP Qualifier</CardTitle>
            <CardDescription className="text-lg mt-2">
              Let's create your Ideal Customer Profile using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Analyze Your Company</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll scrape your website and analyze your business using AI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Generate ICP</h3>
                  <p className="text-sm text-muted-foreground">
                    AI will create a detailed profile of your ideal customers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Qualify Prospects</h3>
                  <p className="text-sm text-muted-foreground">
                    Score and rank potential customers against your ICP
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => setStep("domain")} className="w-full" size="lg">
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Domain Input Step */}
      {step === "domain" && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Enter Your Company Domain
            </CardTitle>
            <CardDescription>
              We'll analyze your website to understand your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDomainSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="domain">Company Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter your company's domain (e.g., stripe.com, shopify.com)
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !domain.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Company"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Analyzing Step */}
      {step === "analyzing" && (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Your Company</h2>
            <p className="text-muted-foreground mb-6">
              Our AI is analyzing your website and generating your ICP...
            </p>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Scraping website content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
                <span>Analyzing business model</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
                <span>Generating ICP with AI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && company && icp && (
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Your Company Profile</CardTitle>
              <CardDescription>Review the analyzed information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Company Name</Label>
                <p className="text-lg font-semibold">{company.name || company.domain}</p>
              </div>
              {company.industry && (
                <div>
                  <Label className="text-sm text-muted-foreground">Industry</Label>
                  <p>{company.industry}</p>
                </div>
              )}
              {company.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm">{company.description}</p>
                </div>
              )}
              {company.size && (
                <div>
                  <Label className="text-sm text-muted-foreground">Company Size</Label>
                  <p>{company.size}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Your Ideal Customer Profile
              </CardTitle>
              <CardDescription>AI-generated based on your company analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">ICP Title</Label>
                <p className="text-lg font-semibold">{icp.title}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm">{icp.description}</p>
              </div>
              {icp.industries.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Target Industries</Label>
                  <div className="flex flex-wrap gap-2">
                    {icp.industries.map((industry, i) => (
                      <Badge key={i} variant="secondary">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {icp.geographicRegions.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Geographic Regions</Label>
                  <div className="flex flex-wrap gap-2">
                    {icp.geographicRegions.map((region, i) => (
                      <Badge key={i} variant="outline">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Skip to Dashboard
            </Button>
            <Button onClick={handleComplete} className="flex-1" size="lg">
              Complete Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
