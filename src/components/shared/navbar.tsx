"use client"

import { Brain } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"

import { UserNav } from "./user-nav"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" aria-hidden="true" />
          <Link href={session?.user ? "/dashboard" : "/"} className="text-xl sm:text-2xl font-bold text-foreground focus-enhanced">
            <span className="sr-only">AI Qualifier - </span>
            AI Qualifier
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {session?.user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4" role="menubar">
                <Button variant="ghost" asChild className="focus-enhanced">
                  <Link href="/dashboard" role="menuitem">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild className="focus-enhanced">
                  <Link href="/qualify" role="menuitem">Qualify</Link>
                </Button>
                <Button variant="ghost" asChild className="focus-enhanced">
                  <Link href="/companies" role="menuitem">Companies</Link>
                </Button>
              </div>
              
              {/* User Menu */}
              <UserNav user={session.user} />
            </>
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
  )
}
