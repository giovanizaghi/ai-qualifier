import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Profile | AI Qualifier",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Profile"
        text="Manage your account settings and preferences"
      />
      
      <div className="max-w-2xl">
        <ProfileForm user={session.user} />
      </div>
    </DashboardShell>
  )
}