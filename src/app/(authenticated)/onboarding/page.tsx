import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { auth } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <OnboardingWizard userId={session.user.id!} />
    </div>
  );
}
