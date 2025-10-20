"use client"

import { User } from "next-auth"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, Sparkles, TrendingUp, Plus, Loader2 } from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch companies
        const companyRes = await fetch("/api/companies")
        if (companyRes.ok) {
          const data = await companyRes.json()
          setCompanies(data.companies || [])
        }

        // Fetch recent qualification runs (we'll need to add this endpoint or get from company data)
        // For now, we'll just show companies
        
        setLoading(false)
      } catch (err) {
        setError("Failed to load dashboard data")
        setLoading(false)
      }
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

  const primaryCompany = companies[0]
  const primaryIcp = primaryCompany.icps[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your ICP and qualify prospects</p>
          </div>
          <Button asChild>
            <Link href="/qualify">
              <Sparkles className="w-4 h-4 mr-2" />
              Qualify Prospects
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Company Overview */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  {primaryCompany.name || primaryCompany.domain}
                </CardTitle>
                <CardDescription className="mt-2">
                  {primaryCompany.description || `Company domain: ${primaryCompany.domain}`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/companies/${primaryCompany.id}`}>View Details</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {primaryCompany.industry && (
                <Badge variant="secondary">{primaryCompany.industry}</Badge>
              )}
              <Badge variant="outline">{primaryCompany.icps.length} ICP{primaryCompany.icps.length !== 1 ? 's' : ''}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ICP Summary */}
        {primaryIcp && (
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Ideal Customer Profile
              </CardTitle>
              <CardDescription>{primaryIcp.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{primaryIcp.description}</p>
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
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{run.icp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.completed}/{run.totalProspects} prospects processed
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/qualify/${run.id}`}>View Results</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}