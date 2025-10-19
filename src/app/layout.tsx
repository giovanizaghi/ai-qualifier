import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SonnerProvider } from "@/components/ui/sonner-provider"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Qualifier",
  description: "Domain qualification using AI and ICP profiles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <SonnerProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}