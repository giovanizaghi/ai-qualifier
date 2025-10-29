import { Metadata } from "next"

import { SignUpForm } from "@/components/auth/signup-form"
import { LottieAnimation } from "@/components/lottie-animation"

export const metadata: Metadata = {
  title: "Sign Up | AI Qualifier",
  description: "Create your AI Qualifier account",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Creative Text (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="flex flex-col items-center justify-center px-12 py-12 text-center space-y-8">
          <h1 className="text-4xl font-bold text-foreground">
            AI-Powered Customer Qualification
          </h1>
          
          <div className="w-80 h-80">
            <LottieAnimation
              animationPath="/animations/BrainAnimation.json"
              className="w-full h-full"
              loop={true}
              autoplay={true}
            />
          </div>
          
          <p className="text-lg text-muted-foreground max-w-md">
            Generate Ideal Customer Profiles for your company and automatically qualify prospects using advanced AI analysis.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 bg-background">
        <div className="w-full max-w-md mx-auto lg:mx-0 space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to get started with AI Qualifier
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}