import { Brain, Award, Users, TrendingUp, CheckCircle, Star, FileText, Github, Mail, MapPin, Calendar, Code2, ExternalLink, Coffee } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* SVG Filters for Liquid Glass Effect */}
      <svg className="glass-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence baseFrequency="0.02 0.1" numOctaves="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
            <feGaussianBlur stdDeviation="0.5"/>
          </filter>
          <filter id="button-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence baseFrequency="0.01 0.05" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
            <feGaussianBlur stdDeviation="0.3"/>
          </filter>
        </defs>
      </svg>
      
      {/* Navigation */}
      <nav className="glass-nav" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-slate-900 drop-shadow-sm" aria-hidden="true" />
            <Link href="/" className="text-xl sm:text-2xl font-bold glass-text focus-enhanced">
              <span className="sr-only">AI Qualifier - </span>
              AI Qualifier
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4" role="menubar">
              <Button variant="ghost" asChild className="focus-enhanced glass-button">
                <Link href="#features" role="menuitem" className="glass-text relative z-10">Features</Link>
              </Button>
              <Button variant="ghost" asChild className="focus-enhanced glass-button">
                <Link href="#about" role="menuitem" className="glass-text relative z-10">About</Link>
              </Button>
            </div>
            
            {/* Auth Buttons */}
            {session?.user ? (
              <Button asChild className="text-sm sm:text-base focus-enhanced glass-button-solid">
                <Link href="/dashboard" aria-label="Go to your dashboard" className="glass-text relative z-10">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden sm:flex text-sm focus-enhanced glass-button-outline">
                  <Link href="/auth/signin" aria-label="Sign in to your account" className="glass-text relative z-10">Sign In</Link>
                </Button>
                <Button asChild className="text-sm sm:text-base focus-enhanced glass-button-solid">
                  <Link href="/auth/signup" aria-label="Create a new account" className="glass-text relative z-10">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero relative flex items-center justify-center min-h-screen overflow-hidden" role="main" aria-labelledby="hero-heading">
        {/* Animated Gradient Wave Background */}
        <div className="hero-bg pointer-events-none absolute inset-0 w-full h-full z-0" aria-hidden="true">
          <div className="wave3" />
        </div>
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center pt-20">
          <Badge variant="secondary" className="mb-4 text-xs sm:text-sm bg-white/90 text-slate-800 border-white/20" role="status" aria-label="Platform status">
            🚀 AI-Powered Lead Qualification Platform
          </Badge>
          <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg leading-tight">
            Intelligent Lead Qualification
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Powered by AI
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 drop-shadow-md mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Analyze your business, generate AI-powered Ideal Customer Profiles, and automatically 
            qualify prospects with precision scoring and detailed insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4" role="group" aria-label="Get started actions">
            {session?.user ? (
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced glass-button-solid" asChild>
                <Link href="/dashboard" aria-label="Access your AI Qualifier dashboard" className="glass-text relative z-10">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced glass-button-solid" asChild>
                  <Link href="/auth/signup" aria-label="Sign up for AI Qualifier" className="glass-text relative z-10">Start Your Journey</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced glass-button-outline" asChild>
                  <Link href="https://www.youtube.com/watch?v=hUkq3k-VAvU" target="_blank" rel="noopener noreferrer" aria-label="Watch platform demonstration video">
                    <span className="glass-text-light relative z-10">Watch Demo</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16" role="region" aria-label="Platform statistics">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2" aria-label="GPT-4 powered analysis">GPT-4</div>
              <div className="text-sm sm:text-base text-white/80">AI-Powered Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2" aria-label="Real-time prospect scoring">0-100</div>
              <div className="text-sm sm:text-base text-white/80">Precision Scoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2" aria-label="Instant qualification">Instant</div>
              <div className="text-sm sm:text-base text-white/80">Qualification Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20" role="region" aria-labelledby="features-heading">
        <div className="text-center mb-12 sm:mb-16">
          <h2 id="features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Enterprise-Grade Architecture</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Built with production-ready patterns, comprehensive error handling, and scalable design
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" role="list" aria-label="Platform features">
          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">AI-Powered ICP Generation</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                OpenAI GPT-4o-mini analyzes your business to create detailed Ideal Customer Profiles with structured personas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="AI generation features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Domain scraping with Cheerio</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Structured persona generation</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Target criteria identification</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Intelligent Prospect Scoring</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Batch analyze prospects with 0-100 precision scores, fit levels, and detailed reasoning
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Scoring features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Batch prospect processing</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Match & gap analysis</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">AI-generated insights</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Real-Time Progress Tracking</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Live notifications, background processing, and automatic stuck run recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Tracking features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Floating progress notifiers</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">3-second polling updates</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Automatic recovery system</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Production-Ready Security</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comprehensive validation, rate limiting, error handling, and security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Security features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">NextAuth.js authentication</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Zod schema validation</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">XSS prevention & rate limiting</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Modern Tech Stack</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Next.js 15, TypeScript, Prisma ORM, and PostgreSQL with full type safety
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Tech stack features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">App Router architecture</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Server & client components</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Shadcn/ui + Tailwind CSS</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Developer Experience</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comprehensive documentation, error boundaries, and toast notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="DX features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">11+ documentation files</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">4,300+ lines production code</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Sonner toast system</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technical Highlights Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900" role="region" aria-labelledby="tech-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="tech-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Technical Excellence</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Built following best practices with production-ready patterns and comprehensive documentation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Architecture Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Architecture Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Server Components:</strong> Optimized data fetching with Next.js 15 App Router</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Background Processing:</strong> Async qualification runs with progress tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Error Boundaries:</strong> Graceful error handling with custom fallbacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Type Safety:</strong> Full TypeScript coverage with Prisma-generated types</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Advanced Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Automatic Recovery:</strong> Stuck run detection and cleanup on startup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Real-time Polling:</strong> 3-second updates with floating notifiers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Recent Activity:</strong> Dashboard with qualification run history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Company Details:</strong> Comprehensive view with ICP and run data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Security & Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Security & Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Rate Limiting:</strong> 5/min analysis, 3/min qualification, 100/min API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Input Validation:</strong> Zod schemas with XSS prevention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Auth Protection:</strong> NextAuth.js v5 with session management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Error Handling:</strong> Standardized responses with proper HTTP codes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Developer Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Developer Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Documentation:</strong> 11+ markdown files covering all phases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Code Quality:</strong> 4,300+ lines with consistent patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Toast System:</strong> Sonner with pre-defined messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Loading States:</strong> Stage-based progress indicators</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <div className="text-2xl font-bold text-primary mb-1">6</div>
              <div className="text-xs text-muted-foreground">Phases Complete</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <div className="text-2xl font-bold text-primary mb-1">15+</div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <div className="text-2xl font-bold text-primary mb-1">6</div>
              <div className="text-xs text-muted-foreground">API Routes</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <div className="text-2xl font-bold text-primary mb-1">4</div>
              <div className="text-xs text-muted-foreground">Core Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20" role="region" aria-labelledby="docs-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="docs-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Comprehensive Documentation</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Detailed documentation covering every aspect of development, implementation, and deployment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Implementation Phases */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Implementation Phases (6 Complete)
                </CardTitle>
                <CardDescription>
                  Detailed documentation for each development phase with summaries and completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 1: Database Schema</div>
                      <div className="text-xs text-muted-foreground">Models, migrations, Prisma setup</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 2: Core Services</div>
                      <div className="text-xs text-muted-foreground">AI integration, domain analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 3: API Routes</div>
                      <div className="text-xs text-muted-foreground">REST endpoints, validation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 4: Frontend Pages</div>
                      <div className="text-xs text-muted-foreground">Dashboard, onboarding, auth</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 5: UI Components</div>
                      <div className="text-xs text-muted-foreground">Reusable components, forms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Phase 6: Production Polish</div>
                      <div className="text-xs text-muted-foreground">Error handling, security</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" asChild className="w-full glass-button">
                    <Link href="https://github.com/giovanizaghi/ai-qualifier/tree/main/docs" target="_blank" className="flex items-center gap-2 glass-text relative z-10">
                      <ExternalLink className="w-4 h-4" />
                      View All Documentation on GitHub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  Documentation Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Total Files</span>
                      <span className="text-lg font-bold text-primary">42+</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Comprehensive project documentation</div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Implementation Docs</span>
                      <span className="text-lg font-bold text-primary">15+</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Phase completion summaries</div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Bug Fixes & Features</span>
                      <span className="text-lg font-bold text-primary">10+</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Detailed fix documentation</div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Deployment Guides</span>
                      <span className="text-lg font-bold text-primary">5+</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Setup and deployment instructions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Documentation Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Technical Architecture</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Implementation plan & status</li>
                  <li>• Architecture decisions</li>
                  <li>• Phase completion summaries</li>
                  <li>• Performance optimizations</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Feature Development</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Active run notifier system</li>
                  <li>• Recent activity features</li>
                  <li>• Company details pages</li>
                  <li>• Background task persistence</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Bug Fixes & Solutions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• React child object fixes</li>
                  <li>• Webpack module issues</li>
                  <li>• Navigation menu improvements</li>
                  <li>• Business logic corrections</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900" role="region" aria-labelledby="developer-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="developer-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Meet the Developer</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by Giovani Zaghi - Full Stack Developer & AI Enthusiast
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Developer Profile */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                  <img 
                    src="/the_best_dev.JPG" 
                    alt="Giovani Zaghi - Full Stack Developer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-xl">Giovani Zaghi</CardTitle>
                <CardDescription>Full Stack Developer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>São Paulo, Brazil</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href="mailto:giovanizaghinogueira@gmail.com" className="hover:text-primary transition-colors">
                      giovanizaghinogueira@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Available for opportunities</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button asChild className="flex-1 glass-button-solid">
                    <Link href="https://github.com/giovanizaghi" target="_blank" className="flex items-center gap-2 glass-text relative z-10">
                      <Github className="w-4 h-4" />
                      GitHub
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1 glass-button">
                    <Link href="https://www.linkedin.com/in/giovanizaghi/" target="_blank" className="flex items-center gap-2 glass-text relative z-10">
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn
                    </Link>
                  </Button>
                </div>
                
                {/* Buy Me a Coffee Button */}
                <div className="mt-3">
                  <Button asChild variant="secondary" className="w-full glass-button bg-orange-500/90 hover:bg-orange-600/90 text-white border-0">
                    <Link href="https://buymeacoffee.com/giovanizagu" target="_blank" className="flex items-center gap-2 text-white relative z-10">
                      <Coffee className="w-4 h-4" />
                      Buy Me a Coffee
                    </Link>
                  </Button>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Support open source development ☕
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Experience */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  Technical Expertise
                </CardTitle>
                <CardDescription>
                  Specialized in modern web technologies and AI integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Frontend Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Shadcn/ui'].map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Backend & Database</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Node.js', 'PostgreSQL', 'Prisma ORM', 'NextAuth.js', 'API Design'].map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">AI & Integration</h4>
                    <div className="flex flex-wrap gap-2">
                      {['OpenAI GPT-4', 'Web Scraping', 'Prompt Engineering', 'AI Workflows'].map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">DevOps & Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Git', 'Vercel', 'Docker', 'CI/CD', 'Testing'].map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Project Highlights</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>AI Qualifier:</strong> Complete production-ready app in 72 hours with 4,300+ lines of code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Architecture:</strong> Designed scalable Next.js 15 App Router architecture with server components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Documentation:</strong> Created 42+ documentation files covering all development phases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>AI Integration:</strong> Implemented GPT-4 for ICP generation and prospect qualification</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CV Download & GitHub */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileText className="w-5 h-5" />
                  Download CV
                </CardTitle>
                <CardDescription>
                  Complete resume with experience, projects, and technical skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full glass-button-solid">
                  <a href="/cv/Giovani_Zaghi_CV_v2.pdf" download="Giovani_Zaghi_CV.pdf" className="flex items-center gap-2 glass-text relative z-10">
                    <FileText className="w-4 h-4" />
                    Download PDF Resume
                  </a>
                </Button>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Includes detailed work experience, education, and project portfolio
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Github className="w-5 h-5" />
                  GitHub Portfolio
                </CardTitle>
                <CardDescription>
                  Explore the complete AI Qualifier source code and other projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full glass-button">
                  <Link href="https://github.com/giovanizaghi/ai-qualifier" target="_blank" className="flex items-center gap-2 glass-text relative z-10">
                    <Github className="w-4 h-4" />
                    View Project Repository
                  </Link>
                </Button>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Full source code, documentation, and commit history available
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Qualify Leads with AI?</h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4">
            Experience intelligent lead qualification with automated ICP generation, prospect scoring, and real-time insights
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            {session?.user ? (
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 glass-button-solid" asChild>
                <Link href="/dashboard" className="glass-text relative z-10">View Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 glass-button-solid" asChild>
                  <Link href="/auth/signup" className="glass-text relative z-10">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 glass-button-outline" asChild>
                  <Link href="https://www.youtube.com/watch?v=hUkq3k-VAvU" target="_blank" rel="noopener noreferrer">
                    <span className="glass-text-light relative z-10">View Demo</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Architecture Highlights */}
          <div className="mt-12 sm:mt-16 max-w-3xl mx-auto px-4">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-base sm:text-lg italic opacity-90 mb-3 sm:mb-4">
              "Built with Next.js 15 App Router, TypeScript, Prisma ORM, and OpenAI GPT-4. 
              Features comprehensive error handling, automatic recovery systems, real-time progress tracking, 
              and production-ready security with 4,300+ lines of clean, documented code."
            </blockquote>
            <cite className="text-xs sm:text-sm opacity-75">
              - Technical Implementation: 6 Phases Complete, 11+ Documentation Files
            </cite>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-white">AI Qualifier</span>
              </div>
              <p className="text-sm text-slate-400">
                AI-powered lead qualification platform using OpenAI GPT-4 for ICP generation and intelligent prospect scoring.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Features</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">ICP Generation</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Prospect Scoring</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Progress Tracking</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Background Jobs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Technology</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><span className="hover:text-white transition-colors">Next.js 15</span></li>
                <li><span className="hover:text-white transition-colors">TypeScript</span></li>
                <li><span className="hover:text-white transition-colors">Prisma + PostgreSQL</span></li>
                <li><span className="hover:text-white transition-colors">OpenAI GPT-4</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="https://github.com/giovanizaghi/ai-qualifier" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
                <li><a href="https://github.com/giovanizaghi/ai-qualifier/tree/main/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://github.com/giovanizaghi/ai-qualifier#readme" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">README</a></li>
                <li><a href="https://github.com/giovanizaghi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Developer Profile</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Developer</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="https://github.com/giovanizaghi" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Profile</a></li>
                <li><a href="https://www.linkedin.com/in/giovanizaghi/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><span className="hover:text-white transition-colors">zaghi.giovani@gmail.com</span></li>
                <li><span className="hover:text-white transition-colors">São Paulo, Brazil</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; 2025 AI Qualifier. Built by <a href="https://github.com/giovanizaghi" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">Giovani Zaghi</a> for Cloud Employee technical assessment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
