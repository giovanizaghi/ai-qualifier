import { Metadata } from "next"

import { SignInForm } from "@/components/auth/signin-form"
import { LottieAnimation } from "@/components/lottie-animation"

export const metadata: Metadata = {
  title: "Sign In | AI Qualifier",
  description: "Sign in to your AI Qualifier account",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* SVG Filters for Liquid Glass Effect */}
      <svg className="glass-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence baseFrequency="0.02 0.1" numOctaves="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
            <feGaussianBlur stdDeviation="0.5"/>
          </filter>
          <filter id="auth-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence baseFrequency="0.01 0.05" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
            <feGaussianBlur stdDeviation="0.3"/>
          </filter>
        </defs>
      </svg>

      {/* Animated Gradient Wave Background */}
      <div className="hero-bg pointer-events-none absolute inset-0 w-full h-full z-0" aria-hidden="true">
        <div className="wave3" />
      </div>

      {/* Main Layout - Two Column */}
      <div className="min-h-screen flex relative z-10">
        {/* Left Column - Welcome Content (Hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 py-12 relative">
          <div className="max-w-lg mx-auto text-center">
            <div className="glass-nav bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-6">
                Welcome Back to AI Qualifier
              </h1>
              
              <div className="w-64 h-64 mx-auto mb-6">
                <LottieAnimation
                  animationPath="/animations/AIModel.json"
                  className="w-full h-full drop-shadow-lg"
                  loop={true}
                  autoplay={true}
                />
              </div>
              
              <p className="text-lg text-white/90 drop-shadow-md mb-8">
                Continue qualifying leads with AI-powered ICP generation and intelligent prospect scoring.
              </p>

              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 flex-shrink-0"></div>
                  <span className="text-sm text-white/90 drop-shadow-sm">Access your qualification dashboard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50 flex-shrink-0"></div>
                  <span className="text-sm text-white/90 drop-shadow-sm">Continue your AI-powered analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50 flex-shrink-0"></div>
                  <span className="text-sm text-white/90 drop-shadow-sm">View qualification results & insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50 flex-shrink-0"></div>
                  <span className="text-sm text-white/90 drop-shadow-sm">Manage your prospect pipeline</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sign In Form */}
        <div className="flex-1 lg:flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12 relative">
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="glass-nav bg-white/20 dark:bg-slate-800/20 backdrop-blur-md rounded-3xl p-8 border border-white/30 shadow-2xl relative z-20">
              <div className="flex flex-col space-y-2 text-center lg:text-left mb-6">
                <h1 className="text-2xl font-semibold tracking-tight glass-text">
                  Welcome back
                </h1>
                <p className="text-sm glass-text-light">
                  Sign in to continue your AI qualification journey
                </p>
              </div>
              <div className="relative z-30">
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}