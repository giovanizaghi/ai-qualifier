"use client"

import { User, Settings, LogOut, Home, Menu, X } from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-14 sm:h-16 items-center justify-between py-2 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 focus-enhanced">
              <span className="text-lg sm:text-xl font-bold">AI Qualifier</span>
              <span className="sr-only">Go to dashboard home</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium" role="navigation" aria-label="Main navigation">
              <Link 
                href="/dashboard" 
                className="transition-colors hover:text-foreground/80 focus-enhanced"
                aria-current={typeof window !== 'undefined' && window.location.pathname === '/dashboard' ? 'page' : undefined}
              >
                Dashboard
              </Link>
              <Link 
                href="/qualifications" 
                className="transition-colors hover:text-foreground/80 focus-enhanced"
                aria-current={typeof window !== 'undefined' && window.location.pathname === '/qualifications' ? 'page' : undefined}
              >
                Qualifications
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden focus-enhanced"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>

            {/* User Menu */}
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full focus-enhanced" 
                    aria-label={`User menu for ${session.user.name || 'user'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={session.user.image || ""} 
                        alt={`Profile picture of ${session.user.name || 'user'}`} 
                      />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount role="menu">
                  <DropdownMenuLabel className="font-normal" role="none">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild role="menuitem">
                    <Link href="/dashboard" className="flex items-center focus-enhanced">
                      <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild role="menuitem">
                    <Link href="/profile" className="flex items-center focus-enhanced">
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild role="menuitem">
                    <Link href="/settings" className="flex items-center focus-enhanced">
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="flex items-center focus-enhanced" 
                    role="menuitem"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background" id="mobile-navigation">
            <nav className="container py-4 space-y-2" role="navigation" aria-label="Mobile navigation">
              <Link 
                href="/dashboard" 
                className="block px-2 py-2 text-sm font-medium transition-colors hover:text-foreground/80 rounded-md hover:bg-accent focus-enhanced"
                onClick={closeMobileMenu}
                aria-current={typeof window !== 'undefined' && window.location.pathname === '/dashboard' ? 'page' : undefined}
              >
                Dashboard
              </Link>
              <Link 
                href="/qualifications" 
                className="block px-2 py-2 text-sm font-medium transition-colors hover:text-foreground/80 rounded-md hover:bg-accent focus-enhanced"
                onClick={closeMobileMenu}
                aria-current={typeof window !== 'undefined' && window.location.pathname === '/qualifications' ? 'page' : undefined}
              >
                Qualifications
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}