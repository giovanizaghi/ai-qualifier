import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { QualifyForm } from "@/components/qualify/qualify-form";
import { prisma } from "@/lib/prisma";

export default async function QualifyPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/qualify");
  }

  // Fetch user's companies and ICPs
  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    include: {
      icps: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (companies.length === 0) {
    redirect("/onboarding");
  }

  // Get all ICPs
  const allIcps = companies.flatMap((c: any) => c.icps.map((icp: any) => ({
    ...icp,
    companyName: c.name || c.domain,
  })));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-4xl">
        <QualifyForm icps={allIcps} />
      </div>
    </div>
  );
}
