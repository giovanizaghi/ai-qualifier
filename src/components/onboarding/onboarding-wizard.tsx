"use client";

import { Loader2, Building2, Sparkles, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

import { LottieAnimation } from "@/components/lottie-animation";
import { startNavigationProgress } from "@/components/shared";
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
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const analyzingMessages = [
    "Scraping website content",
    "Analyzing business model",
    "Generating ICP with AI"
  ];

  useEffect(() => {
    if (step === "analyzing") {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % analyzingMessages.length);
      }, 2000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [step, analyzingMessages.length]);

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
    startNavigationProgress();
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[
            { key: "welcome", label: "Welcome" },
            { key: "domain", label: "Company Info" },
            { key: "analyzing", label: "Analyzing" },
            { key: "review", label: "Review" }
          ].map((stepInfo, i) => {
            const stepKeys = ["welcome", "domain", "analyzing", "review"];
            const currentIndex = stepKeys.indexOf(step);
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            
            return (
              <div key={stepInfo.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? "border-green-600 bg-green-600 text-white"
                        : isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                        ? "text-primary"
                        : "text-gray-400"
                    }`}
                  >
                    {stepInfo.label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`h-0.5 w-12 md:w-24 mx-2 mb-6 ${
                      isCompleted ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Welcome Step */}
      {step === "welcome" && (
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <LottieAnimation
                animationPath="/animations/AIModel.json"
                width={120}
                height={120}
                loop={true}
                autoplay={true}
              />
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
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Analyzing Your Company</CardTitle>
            <CardDescription className="text-lg">
              Our AI is analyzing your website and generating your ICP
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-8">
              <LottieAnimation
                animationPath="/animations/loading.json"
                width={280}
                height={280}
                loop={true}
                autoplay={true}
              />
            </div>
            <div className="flex items-center justify-center gap-2 min-h-[24px]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span 
                key={currentMessageIndex}
                className="text-sm animate-in fade-in-0 duration-500"
              >
                {analyzingMessages[currentMessageIndex]}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && company && icp && (
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Your Company Profile
              </CardTitle>
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
            <Button 
              variant="outline" 
              onClick={() => {
                startNavigationProgress();
                startTransition(() => {
                  router.push("/dashboard");
                });
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Skip to Dashboard
            </Button>
            <Button onClick={handleComplete} className="flex-1" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Complete Setup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
