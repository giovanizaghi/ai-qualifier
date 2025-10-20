import { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StudyHistory } from "@/components/profile/study-history"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Study History | AI Qualifier",
  description: "View your detailed learning activity and progress over time",
}

export default async function StudyHistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Study History"
        text="Your complete learning journey and activity timeline"
      />
      
      <StudyHistory userId={session.user.id} />
    </DashboardShell>
  )
}