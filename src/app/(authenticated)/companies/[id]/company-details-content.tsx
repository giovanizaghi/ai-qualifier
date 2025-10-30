"use client"

import {
  Building2,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  Calendar,
  Globe,
  Briefcase,
  Users,
  MapPin,
  Target,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User } from "next-auth"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"

interface ICP {
  id: string
  title: string
  description: string
  buyerPersonas: any
  companySize: any
  industries: string[]
  geographicRegions: string[]
  fundingStages: string[]
  generatedBy: string | null
  createdAt: string
  qualificationRuns: Array<{
    id: string
    status: string
    totalProspects: number
    completed: number
    createdAt: string
  }>
}

interface Company {
  id: string
  domain: string
  name: string | null
  description: string | null
  industry: string | null
  size: string | null
  websiteData: any
  aiAnalysis: any
  createdAt: string
  updatedAt: string
  icps: ICP[]
}

interface CompanyDetailsContentProps {
  company: Company
  user: User
}

export default function CompanyDetailsContent({ company, user }: CompanyDetailsContentProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const primaryIcp = company.icps[0]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete company')
      }

      toast.success('Company deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Failed to delete company')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                <Building2 className="w-10 h-10 text-primary" />
                {company.name || company.domain}
              </h1>
              <p className="text-muted-foreground">
                {company.description || 'Company profile and ICP details'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/qualify">
                <Sparkles className="w-4 h-4 mr-2" />
                Qualify Prospects
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the company profile,
                    all ICPs, and all qualification runs associated with it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Company
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Company Overview Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Company Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Domain</p>
                    <a 
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline flex items-center gap-1"
                    >
                      {company.domain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {company.industry && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium">{company.industry}</p>
                    </div>
                  </div>
                )}

                {company.size && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company Size</p>
                      <p className="font-medium">{company.size}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(company.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">ICPs Generated</p>
                    <p className="font-medium">{company.icps.length}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Qualification Runs</p>
                    <p className="font-medium">
                      {company.icps.reduce((total, icp) => total + icp.qualificationRuns.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {company.aiAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {typeof company.aiAnalysis === 'string' ? (
                  <p>{company.aiAnalysis}</p>
                ) : (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(company.aiAnalysis, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ICP Details */}
        {primaryIcp && (
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Ideal Customer Profile
                  </CardTitle>
                  <CardDescription className="mt-2">{primaryIcp.title}</CardDescription>
                </div>
                {primaryIcp.generatedBy && (
                  <Badge variant="outline">Generated by {primaryIcp.generatedBy}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{primaryIcp.description}</p>
              </div>

              <Separator />

              {/* Buyer Personas */}
              {primaryIcp.buyerPersonas && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Buyer Personas
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.isArray(primaryIcp.buyerPersonas) ? (
                      primaryIcp.buyerPersonas.map((persona: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <h4 className="font-medium mb-2">{persona.role || persona.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {persona.description || persona.painPoints}
                            </p>
                            {persona.painPoints && Array.isArray(persona.painPoints) && (
                              <ul className="text-sm space-y-1">
                                {persona.painPoints.map((pain: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <AlertCircle className="w-3 h-3 mt-0.5 text-orange-500" />
                                    <span>{pain}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto col-span-2">
                        {JSON.stringify(primaryIcp.buyerPersonas, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Company Size */}
              {primaryIcp.companySize && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Company Size
                  </h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(primaryIcp.companySize, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Industries */}
              {primaryIcp.industries && primaryIcp.industries.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Target Industries
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {primaryIcp.industries.map((industry, index) => (
                      <Badge key={index} variant="secondary">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Regions */}
              {primaryIcp.geographicRegions && primaryIcp.geographicRegions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Geographic Regions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {primaryIcp.geographicRegions.map((region, index) => (
                      <Badge key={index} variant="outline">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Funding Stages */}
              {primaryIcp.fundingStages && primaryIcp.fundingStages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Funding Stages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {primaryIcp.fundingStages.map((stage, index) => (
                      <Badge key={index} variant="secondary">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Qualification Runs */}
        {primaryIcp && primaryIcp.qualificationRuns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Qualification Runs</CardTitle>
              <CardDescription>Latest prospect qualification results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {primaryIcp.qualificationRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Qualification Run</p>
                        {run.status === 'COMPLETED' ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : run.status === 'PROCESSING' ? (
                          <Badge variant="default" className="bg-blue-500">Processing</Badge>
                        ) : run.status === 'FAILED' ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{run.totalProspects} prospects</span>
                        <span>•</span>
                        <span>{run.completed} completed</span>
                        <span>•</span>
                        <span>{formatDate(run.createdAt)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/qualify/${run.id}`}>
                        View Results
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {primaryIcp.qualificationRuns.length >= 5 && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" asChild>
                    <Link href="/qualify/history">View All Runs</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No qualification runs yet */}
        {primaryIcp && primaryIcp.qualificationRuns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">No Qualification Runs Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start qualifying prospects against your ICP to see results here
              </p>
              <Button asChild size="lg">
                <Link href="/qualify">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Qualify Prospects
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Website Data */}
        {company.websiteData && (
          <Card>
            <CardHeader>
              <CardTitle>Website Data</CardTitle>
              <CardDescription>Scraped information from company website</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(company.websiteData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
