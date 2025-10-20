import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  // Await params in Next.js 15
  const resolvedParams = await params

  // Fetch company data directly from database
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
            take: 5, // Get last 5 qualification runs
          },
        },
      },
    },
  })

  if (!company) {
    notFound()
  }

  // Verify ownership
  if (company.userId !== session.user.id) {
    redirect("/dashboard")
  }

  // Serialize dates for client component
  const serializedCompany = {
    ...company,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    icps: company.icps.map((icp: typeof company.icps[number]) => ({
      ...icp,
      createdAt: icp.createdAt.toISOString(),
      qualificationRuns: icp.qualificationRuns.map((run: typeof icp.qualificationRuns[number]) => ({
        ...run,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() || null,
      })),
    })),
  }

  return <CompanyDetailsContent company={serializedCompany} user={session.user} />
}
