import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QualificationResults } from "@/components/qualify/qualification-results";

interface PageProps {
  params: {
    runId: string;
  };
}

export default async function QualificationRunPage({ params }: PageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch run data
  const run = await prisma.qualificationRun.findUnique({
    where: { id: params.runId },
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
  });

  if (!run || run.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-7xl">
        <QualificationResults run={run} />
      </div>
    </div>
  );
}
