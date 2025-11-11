"use client"

import { Brain, Sparkles, Zap } from "lucide-react"
import { useEffect, useState } from "react"

function LottieLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
      <div className="relative">
        <Brain className="w-16 h-16 text-primary/70 animate-pulse" />
        <Sparkles className="w-6 h-6 text-primary/50 absolute -top-1 -right-1 animate-ping" />
      </div>
    </div>
  )
}

function LottieErrorFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/20">
      <div className="text-center">
        <div className="relative mb-4">
          <Brain className="w-16 h-16 text-white/80 mx-auto animate-bounce" />
          <Zap className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <p className="text-white/70 text-sm font-medium">AI Animation</p>
        <p className="text-white/50 text-xs">Ready to Process</p>
      </div>
    </div>
  )
}

interface LottieAnimationProps {
  animationPath?: string
  className?: string
  loop?: boolean
  autoplay?: boolean
  width?: number
  height?: number
}

export function LottieAnimation({
  animationPath,
  className = "",
  loop = true,
  autoplay = true,
  width,
  height,
}: LottieAnimationProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [LottiePlayer, setLottiePlayer] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Dynamic import with error handling
    const loadLottie = async () => {
      try {
        const module = await import("@lottiefiles/react-lottie-player")
        setLottiePlayer(() => module.Player)
      } catch (error) {
        console.warn("Failed to load Lottie Player:", error)
        setHasError(true)
      }
    }
    
    loadLottie()
  }, [])

  const style = {
    width: width || "100%",
    height: height || "100%",
  }

  // Don't render on server side
  if (!isMounted) {
    return <LottieLoadingFallback />
  }

  // Show error fallback if there was an error loading or no animation path
  if (hasError || !animationPath || !LottiePlayer) {
    return <LottieErrorFallback />
  }

  return (
    <div className={className} style={style}>
      <div className="w-full h-full">
        <LottiePlayer
          src={animationPath}
          background="transparent"
          speed={1}
          style={{ width: "100%", height: "100%" }}
          loop={loop}
          autoplay={autoplay}
          controls={false}
        />
      </div>
    </div>
  )
}