import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { SessionProvider } from "@/components/providers/session-provider"
import { SonnerProvider } from "@/components/ui/sonner-provider"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: "AI Qualifier",
  description: "Domain qualification using AI and ICP profiles",
  metadataBase: new URL('https://ai-qualifier.vercel.app'), // Update with your domain
  keywords: ["AI", "qualification", "assessment", "machine learning", "certification"],
  authors: [{ name: "AI Qualifier Team" }],
  creator: "AI Qualifier",
  publisher: "AI Qualifier",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-qualifier.vercel.app', // Update with your domain
    title: 'AI Qualifier - Master AI Skills with Intelligent Assessments',
    description: 'Elevate your AI expertise through personalized qualifications, adaptive testing, and real-time feedback designed for the modern AI practitioner.',
    siteName: 'AI Qualifier',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Qualifier - Master AI Skills',
    description: 'Elevate your AI expertise through personalized qualifications and adaptive testing.',
    creator: '@aiqualifier', // Update with your Twitter handle
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="smooth-scroll">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#0f172a" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased safe-area-padding`}>
        <SessionProvider>
          <SonnerProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}