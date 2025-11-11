import { redirect } from "next/navigation"

import { QualificationResults } from "@/components/qualify"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"


export default async function QualificationRunPage({ params }: { params: { runId: string } }) {
  const { runId } = params


  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // const { runId } = params -- moved above

  const run = await prisma.qualificationRun.findUnique({
    where: { id: runId },
    include: {
      icp: {
        include: {
          company: true,
        },
      },
      results: {
        orderBy: { score: "desc" },
      },
    },
  })

  if (!run || run.userId !== session.user.id) {
    redirect("/qualify")
  }

  // Serialize dates and complex data for client component
  const serializedRun = {
    ...run,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString() || null,
    icp: {
      ...run.icp,
      createdAt: run.icp.createdAt.toISOString(),
      updatedAt: run.icp.updatedAt.toISOString(),
      buyerPersonas: run.icp.buyerPersonas ? structuredClone(run.icp.buyerPersonas) : null,
      companySize: run.icp.companySize ? structuredClone(run.icp.companySize) : null,
      industries: Array.isArray(run.icp.industries) ? run.icp.industries : [],
      geographicRegions: Array.isArray(run.icp.geographicRegions) ? run.icp.geographicRegions : [],
      fundingStages: Array.isArray(run.icp.fundingStages) ? run.icp.fundingStages : [],
      company: {
        ...run.icp.company,
        createdAt: run.icp.company.createdAt.toISOString(),
        updatedAt: run.icp.company.updatedAt.toISOString(),
        websiteData: run.icp.company.websiteData ? structuredClone(run.icp.company.websiteData) : null,
        aiAnalysis: run.icp.company.aiAnalysis ? structuredClone(run.icp.company.aiAnalysis) : null,
      },
    },
    results: run.results?.map((result: any) => ({
      ...result,
      createdAt: result.createdAt.toISOString(),
      analyzedAt: result.analyzedAt?.toISOString() || null,
      companyData: result.companyData ? structuredClone(result.companyData) : null,
      matchedCriteria: result.matchedCriteria ? structuredClone(result.matchedCriteria) : null,
      gaps: result.gaps ? structuredClone(result.gaps) : null,
    })) || [],
  } as any

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-7xl">
        <QualificationResults run={serializedRun} />
      </div>
    </div>
  )
}
