import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ErrorBoundary } from "@/components/error-boundary"

import CompanyDetailsContent from "./company-details-content"

export const metadata: Metadata = {
  title: "Company Details | AI Qualifier",
  description: "View detailed company information and ICP data",
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CompanyDetailsPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const resolvedParams = await params

  const company = await prisma.company.findUnique({
    where: {
      id: resolvedParams.id,
    },
    include: {
      icps: {
        orderBy: { createdAt: 'desc' },
        include: {
          qualificationRuns: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
              totalProspects: true,
              completed: true,
              createdAt: true,
              completedAt: true,
            },
          },
        },
      },
    },
  })

  if (!company) {
    notFound()
  }

  if (company.userId !== session.user.id) {
    redirect("/dashboard")
  }

  const serializedCompany = {
    ...company,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    websiteData: company.websiteData ? JSON.parse(JSON.stringify(company.websiteData)) : null,
    aiAnalysis: company.aiAnalysis ? JSON.parse(JSON.stringify(company.aiAnalysis)) : null,
    icps: company.icps?.map((icp: any) => ({
      ...icp,
      createdAt: icp.createdAt.toISOString(),
      updatedAt: icp.updatedAt.toISOString(),
      buyerPersonas: icp.buyerPersonas ? JSON.parse(JSON.stringify(icp.buyerPersonas)) : null,
      companySize: icp.companySize ? JSON.parse(JSON.stringify(icp.companySize)) : null,
      industries: Array.isArray(icp.industries) ? icp.industries : [],
      geographicRegions: Array.isArray(icp.geographicRegions) ? icp.geographicRegions : [],
      fundingStages: Array.isArray(icp.fundingStages) ? icp.fundingStages : [],
      qualificationRuns: icp.qualificationRuns?.map((run: any) => ({
        ...run,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() || null,
      })) || [],
    })) || [],
  }

  return (
    <ErrorBoundary>
      <CompanyDetailsContent 
        company={serializedCompany} 
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }} 
      />
    </ErrorBoundary>
  )
}