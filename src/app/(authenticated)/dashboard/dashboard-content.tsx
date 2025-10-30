"use client"

import { Building2, Sparkles, TrendingUp, Plus, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { User } from "next-auth"
import { useState, useEffect } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface DashboardContentProps {
  user: User
}

interface Company {
  id: string
  domain: string
  name: string | null
  description: string | null
  industry: string | null
  icps: Array<{
    id: string
    title: string
    description: string
  }>
  createdAt: string
}

interface QualificationRun {
  id: string
  status: string
  totalProspects: number
  completed: number
  createdAt: string
  completedAt?: string | null
  icp: {
    id: string
    title: string
    company: {
      name: string | null
      domain: string
    }
  }
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [recentRuns, setRecentRuns] = useState<QualificationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const ITEMS_PER_PAGE = 4

  // Helper function to get status badge variant and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { variant: 'default' as const, label: 'Completed' }
      case 'PROCESSING':
        return { variant: 'secondary' as const, label: 'Processing' }
      case 'PENDING':
        return { variant: 'outline' as const, label: 'Pending' }
      case 'FAILED':
        return { variant: 'destructive' as const, label: 'Failed' }
      default:
        return { variant: 'outline' as const, label: status }
    }
  }

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {return 'Just now'}
    if (diffMins < 60) {return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`}
    if (diffHours < 24) {return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`}
    if (diffDays < 7) {return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`}
    return date.toLocaleDateString()
  }

  useEffect(() => {
    fetchData()
  }, [user.id])

  const fetchData = async () => {
    setLoading(true);
    try {
        // Force cache bust with timestamp and user ID
        const timestamp = Date.now();
        const cacheBuster = `t=${timestamp}&u=${user.id}`;
        
        // Fetch companies
        console.log('[Dashboard] Fetching companies...');
        const companyRes = await fetch(`/api/companies?${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (companyRes.ok) {
          const data = await companyRes.json()
          console.log('[Dashboard] Companies response:', data);
          setCompanies(data.companies || [])
        } else {
          console.error('Failed to fetch companies:', companyRes.status, await companyRes.text())
        }

        // Fetch recent qualification runs
        const runsRes = await fetch(`/api/qualify/recent?${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (runsRes.ok) {
          const data = await runsRes.json()
          console.log('Recent runs data:', data)
          setRecentRuns(data.runs || [])
        } else {
          console.error('Failed to fetch recent runs:', runsRes.status, await runsRes.text())
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError("Failed to load dashboard data")
        setLoading(false)
      }
    }

  useEffect(() => {
    // Clear any potential cached data when user changes
    if (typeof window !== 'undefined') {
      // Clear relevant localStorage/sessionStorage if any exists
      Object.keys(localStorage).forEach(key => {
        if (key.includes('companies') || key.includes('dashboard') || key.includes('qualify')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('companies') || key.includes('dashboard') || key.includes('qualify')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    fetchData()
  }, [user.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  // New user - no companies yet
  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.name || 'there'}!</h1>
            <p className="text-muted-foreground">Let's get started with your ICP Qualifier journey</p>
          </div>

          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">No Company Profile Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by analyzing your company's domain to generate your Ideal Customer Profile
              </p>
              <Button asChild size="lg">
                <Link href="/onboarding">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your ICP and qualify prospects</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchData()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/qualify">
                <Sparkles className="w-4 h-4 mr-2" />
                Qualify Prospects
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Companies Carousel */}
        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {(() => {
                // Calculate total pages needed
                const totalPages = Math.ceil(companies.length / ITEMS_PER_PAGE)
                const pages = []

                // Create pages for companies
                for (let i = 0; i < totalPages; i++) {
                  const startIdx = i * ITEMS_PER_PAGE
                  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, companies.length)
                  const pageCompanies = companies.slice(startIdx, endIdx)
                  const isLastPage = i === totalPages - 1
                  const hasSpaceForAddCard = pageCompanies.length < ITEMS_PER_PAGE

                  pages.push(
                    <CarouselItem key={`page-${i}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pageCompanies.map((company) => (
                          <Card key={company.id} className="border-2 h-full">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-lg flex items-center gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-primary shrink-0" />
                                    <span className="truncate">{company.name || company.domain}</span>
                                  </CardTitle>
                                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                    {company.description || `Company domain: ${company.domain}`}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {company.industry && (
                                  <Badge variant="secondary" className="text-xs">{company.industry}</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {company.icps.length} ICP{company.icps.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/companies/${company.id}`}>View Details</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {/* Add Company Card - only if there's space on this page */}
                        {isLastPage && hasSpaceForAddCard && (
                          <Link href="/onboarding">
                            <Card className="border-2 border-dashed h-full hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[250px]">
                              <CardContent className="py-8 text-center">
                                <div className="flex justify-center mb-4">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-primary" />
                                  </div>
                                </div>
                                <h3 className="font-semibold mb-2">Add Company</h3>
                                <p className="text-sm text-muted-foreground">
                                  Analyze a new domain
                                </p>
                              </CardContent>
                            </Card>
                          </Link>
                        )}
                      </div>
                    </CarouselItem>
                  )
                }

                // If last page is full (4 companies), add a new page with only the "Add Company" card
                const lastPageCompanyCount = companies.length % ITEMS_PER_PAGE
                if (lastPageCompanyCount === 0 && companies.length > 0) {
                  pages.push(
                    <CarouselItem key="add-company-page">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <Link href="/onboarding">
                          <Card className="border-2 border-dashed h-full hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[250px]">
                            <CardContent className="py-8 text-center">
                              <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Plus className="w-6 h-6 text-primary" />
                                </div>
                              </div>
                              <h3 className="font-semibold mb-2">Add Company</h3>
                              <p className="text-sm text-muted-foreground">
                                Analyze a new domain
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    </CarouselItem>
                  )
                }

                return pages
              })()}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* ICP Summary */}
        {companies.length > 0 && companies[0].icps.length > 0 && (
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Ideal Customer Profile
              </CardTitle>
              <CardDescription>{companies[0].icps[0].title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{companies[0].icps[0].description}</p>
              <Button asChild>
                <Link href="/qualify">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Qualify New Prospects
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/onboarding">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Company
                </CardTitle>
                <CardDescription>Analyze a new company domain</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/qualify">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Qualify Prospects
                </CardTitle>
                <CardDescription>Score prospects against your ICP</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/qualify/history">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  View Results
                </CardTitle>
                <CardDescription>See past qualification runs</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest qualification runs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No qualification runs yet</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/qualify">Start Your First Run</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRuns.map((run) => {
                  const statusInfo = getStatusInfo(run.status)
                  const progressPercent = run.totalProspects > 0 
                    ? Math.round((run.completed / run.totalProspects) * 100) 
                    : 0

                  return (
                    <div 
                      key={run.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{run.icp.title}</p>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {run.icp.company.name || run.icp.company.domain}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {run.completed}/{run.totalProspects} prospects
                          </span>
                          {run.status === 'PROCESSING' && (
                            <span className="text-primary font-medium">
                              {progressPercent}% complete
                            </span>
                          )}
                          <span>
                            {formatRelativeTime(run.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="ml-4"
                      >
                        <Link href={`/qualify/${run.id}`}>View Results</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}