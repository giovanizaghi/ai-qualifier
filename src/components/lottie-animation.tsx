"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
)

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

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const style = {
    width: width || "100%",
    height: height || "100%",
  }

  // Don't render on server side
  if (!isMounted) {
    return null
  }

  // Show a placeholder if no animation path
  if (!animationPath) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-primary/40 to-primary/20 rounded-full animate-pulse`} 
        style={style}
      />
    )
  }

  return (
    <div className={className} style={style}>
      <Player
        src={animationPath}
        background="transparent"
        speed={1}
        style={{ width: "100%", height: "100%" }}
        loop={loop}
        autoplay={autoplay}
        controls={false}
      />
    </div>
  )
}