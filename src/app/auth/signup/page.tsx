import { Metadata } from "next"
import { SignUpForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign Up | AI Qualifier",
  description: "Create your AI Qualifier account",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Creative Text (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="flex flex-col justify-center px-12 py-12 relative z-10">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Start your AI mastery journey
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals advancing their careers with AI qualifications designed by industry experts.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Personalized learning paths</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Real-time progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">Career advancement opportunities</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground italic">
                "AI Qualifier transformed my understanding of machine learning. The adaptive assessments helped me identify knowledge gaps."
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                - Sarah Chen, Senior AI Engineer
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements placeholder */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-16 right-16 w-28 h-28 bg-primary rounded-full"></div>
          <div className="absolute bottom-24 left-16 w-20 h-20 bg-primary/50 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-primary/30 rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/2 w-8 h-8 bg-primary/20 rounded-full"></div>
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