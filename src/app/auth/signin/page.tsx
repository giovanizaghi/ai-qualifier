import { Metadata } from "next"

import { SignInForm } from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign In | AI Qualifier",
  description: "Sign in to your AI Qualifier account",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Creative Text (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="flex flex-col justify-center px-12 py-12 relative z-10">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Welcome back to your AI journey
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Continue mastering artificial intelligence with personalized assessments and expert-designed qualifications.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Adaptive AI-powered assessments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Industry-recognized certifications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Expert community support</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements placeholder */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-32 h-32 bg-primary rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-primary/50 rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/30 rounded-full"></div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 bg-background">
        <div className="w-full max-w-md mx-auto lg:mx-0 space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  )
}