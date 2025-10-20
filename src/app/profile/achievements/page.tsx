import { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AchievementGallery } from "@/components/profile/achievement-gallery"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Achievements | AI Qualifier",
  description: "View your earned badges, certificates, and achievements",
}

export default async function AchievementsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Achievements"
        text="Your badges, certificates, and learning milestones"
      />
      
      <AchievementGallery userId={session.user.id} />
    </DashboardShell>
  )
}