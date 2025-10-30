"use client"

import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { startNavigationProgress } from "./navigation-progress"
import { MouseEvent, AnchorHTMLAttributes } from "react"

interface ProgressLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
}

/**
 * Enhanced Link component that shows navigation progress
 * Use this for programmatic navigation or when you need the progress bar
 */
export function ProgressLink({ 
  href, 
  onClick, 
  prefetch = true,
  replace = false,
  scroll = true,
  children, 
  ...props 
}: ProgressLinkProps) {
  const router = useRouter()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the default behavior happen for external links or new tabs
    if (
      e.ctrlKey || 
      e.shiftKey || 
      e.altKey || 
      e.metaKey ||
      props.target === '_blank' ||
      href.startsWith('http')
    ) {
      onClick?.(e)
      return
    }

    // Prevent default and show progress for internal navigation
    e.preventDefault()
    startNavigationProgress()
    
    // Call custom onClick if provided
    onClick?.(e)
    
    // Navigate
    if (replace) {
      router.replace(href, { scroll })
    } else {
      router.push(href, { scroll })
    }
  }

  return (
    <NextLink 
      href={href} 
      onClick={handleClick}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </NextLink>
  )
}
