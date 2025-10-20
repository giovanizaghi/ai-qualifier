import { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import DashboardContent from "./dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | AI Qualifier",
  description: "Your comprehensive AI qualification dashboard",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return <DashboardContent user={session.user} />
}