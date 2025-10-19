import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Award, Users, TrendingUp, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" aria-hidden="true" />
            <Link href="/" className="text-xl sm:text-2xl font-bold text-foreground focus-enhanced">
              <span className="sr-only">AI Qualifier - </span>
              AI Qualifier
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4" role="menubar">
              <Button variant="ghost" asChild className="focus-enhanced">
                <Link href="#features" role="menuitem">Features</Link>
              </Button>
              <Button variant="ghost" asChild className="focus-enhanced">
                <Link href="#about" role="menuitem">About</Link>
              </Button>
            </div>
            
            {/* Auth Buttons */}
            {session?.user ? (
              <Button asChild className="text-sm sm:text-base focus-enhanced">
                <Link href="/dashboard" aria-label="Go to your dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden sm:flex text-sm focus-enhanced">
                  <Link href="/auth/signin" aria-label="Sign in to your account">Sign In</Link>
                </Button>
                <Button asChild className="text-sm sm:text-base focus-enhanced">
                  <Link href="/auth/signup" aria-label="Create a new account">
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
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 text-center" role="main" aria-labelledby="hero-heading">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 text-xs sm:text-sm" role="status" aria-label="Platform status">
            🚀 Advanced AI Assessment Platform
          </Badge>
          <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent leading-tight">
            Master AI Skills with
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Intelligent Assessments
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Elevate your AI expertise through personalized qualifications, adaptive testing, 
            and real-time feedback designed for the modern AI practitioner.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4" role="group" aria-label="Get started actions">
            {session?.user ? (
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced" asChild>
                <Link href="/dashboard" aria-label="Access your AI Qualifier dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced" asChild>
                  <Link href="/auth/signup" aria-label="Sign up for AI Qualifier">Start Your Journey</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-enhanced" aria-label="Watch platform demonstration video">
                  Watch Demo
                </Button>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16" role="region" aria-label="Platform statistics">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="50,000 plus certified professionals">50k+</div>
              <div className="text-sm sm:text-base text-muted-foreground">Certified Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="200 plus AI qualifications available">200+</div>
              <div className="text-sm sm:text-base text-muted-foreground">AI Qualifications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2" aria-label="95 percent success rate">95%</div>
              <div className="text-sm sm:text-base text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20" role="region" aria-labelledby="features-heading">
        <div className="text-center mb-12 sm:mb-16">
          <h2 id="features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Why Choose AI Qualifier?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Experience the future of AI education with our comprehensive platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" role="list" aria-label="Platform features">
          <Card className="border-2 hover:border-primary/50 transition-colors md:col-span-2 lg:col-span-1 focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Adaptive Assessments</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                AI-powered testing that adapts to your skill level for personalized learning paths
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Adaptive assessment features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Dynamic difficulty adjustment</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Real-time performance tracking</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Personalized recommendations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Expert Community</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Connect with AI professionals and learn from industry experts worldwide
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Community features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Peer learning networks</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Mentor matching</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Industry insights</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors md:col-span-2 lg:col-span-1 focus-within:ring-2 focus-within:ring-ring" role="listitem">
            <CardHeader className="pb-4">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4" aria-hidden="true" />
              <CardTitle className="text-lg sm:text-xl">Career Growth</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Accelerate your career with industry-recognized certifications and skills
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2" role="list" aria-label="Career growth features">
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Industry recognition</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Career pathway guidance</span>
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">Job placement assistance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Transform Your AI Career?</h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4">
            Join thousands of professionals who have advanced their careers with AI Qualifier
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            {session?.user ? (
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6" asChild>
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  View Pricing
                </Button>
              </>
            )}
          </div>
          
          {/* Testimonial */}
          <div className="mt-12 sm:mt-16 max-w-2xl mx-auto px-4">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-base sm:text-lg italic opacity-90 mb-3 sm:mb-4">
              "AI Qualifier transformed my understanding of machine learning. The adaptive assessments 
              helped me identify knowledge gaps and provided a clear path to mastery."
            </blockquote>
            <cite className="text-xs sm:text-sm opacity-75">
              - Sarah Chen, Senior AI Engineer at TechCorp
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
                Empowering the next generation of AI professionals through intelligent assessments and personalized learning.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Qualifications</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Assessments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Certifications</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Learning Paths</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; 2025 AI Qualifier. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
