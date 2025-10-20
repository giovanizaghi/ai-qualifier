import { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileForm } from "@/components/profile/profile-form"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Profile | AI Qualifier",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Fetch full user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      bio: true,
      linkedInUrl: true,
      githubUrl: true,
      portfolioUrl: true,
      timezone: true,
      preferredLanguage: true,
      image: true,
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Profile"
        text="Manage your account settings and preferences"
      />
      
      <div className="max-w-2xl">
        <ProfileForm user={user} />
      </div>
    </DashboardShell>
  )
}