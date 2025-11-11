import { headers as nextHeaders } from "next/headers"
import { redirect } from "next/navigation"

import { ErrorBoundary } from "@/components/error-boundary"
import { QualifyForm } from "@/components/qualify/qualify-form"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function QualifyPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/qualify")
  }

  // Get companyId from query params
  let companyId: string | undefined = undefined;
  const reqHeaders = await nextHeaders();
  const referer = reqHeaders.get('referer') || '';
  if (referer && referer.includes('companyId=')) {
    const url = new URL(referer);
    companyId = url.searchParams.get('companyId') || undefined;
  }

  // Fetch all companies and their ICPs
  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    include: {
      icps: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (companies.length === 0) {
    redirect("/onboarding")
  }

  // Serialize ICPs for client component
  const allIcps = companies.flatMap((c: any) => c.icps.map((icp: any) => ({
    ...icp,
    companyId: c.id,
    companyName: c.name || c.domain,
    createdAt: icp.createdAt.toISOString(),
    updatedAt: icp.updatedAt.toISOString(),
    buyerPersonas: icp.buyerPersonas ? structuredClone(icp.buyerPersonas) : null,
    companySize: icp.companySize ? JSON.parse(JSON.stringify(icp.companySize)) : null,
    industries: Array.isArray(icp.industries) ? icp.industries : [],
    geographicRegions: Array.isArray(icp.geographicRegions) ? icp.geographicRegions : [],
    fundingStages: Array.isArray(icp.fundingStages) ? icp.fundingStages : [],
  })));

  // Find the first ICP for the selected company, if companyId is present
  let defaultIcpId = undefined;
  if (companyId) {
    const company = companies.find((c: any) => c.id === companyId);
    if (company && company.icps.length > 0) {
      defaultIcpId = company.icps[0].id;
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="container mx-auto max-w-4xl">
          <QualifyForm icps={allIcps} defaultIcpId={defaultIcpId} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
