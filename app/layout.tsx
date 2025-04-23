import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { SettingsProvider } from "@/lib/settings-context"
import { SettingsApplier } from "@/components/settings-applier"
import { ClientInit } from "./client-init"
import { ErrorBoundary } from "@/components/error-boundary"
import { AccessibilityProvider } from "@/components/accessibility-provider"
import { OfflineDetector } from "@/components/offline-detector"
import { WhatsNewDialog } from "@/components/whats-new-dialog"
import { FirebaseAuthProvider } from "@/lib/firebase-auth-provider"
// Import the PwaInstallBanner at the top of the file
import { PwaInstallBanner } from "@/components/pwa-install-banner"
// Add the import for OfflineSyncIndicator
import { OfflineSyncIndicator } from "@/components/offline-sync-indicator"
import { IOSSplashScreens } from "@/components/ios-splash-screens"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dot.ai - All-in-One AI Assistant",
  description: "Your personal AI assistant powered by advanced AI models - Developed by Kunj Kariya",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "dot.ai",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dot.ai",
    title: "dot.ai - All-in-One AI Assistant",
    description: "Your personal AI assistant powered by advanced AI models",
    siteName: "dot.ai",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "dot.ai logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dot.ai - All-in-One AI Assistant",
    description: "Your personal AI assistant powered by advanced AI models",
    images: ["/images/logo.png"],
  },
    generator: 'v0.dev'
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <IOSSplashScreens />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <FirebaseAuthProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <SettingsProvider>
                <AccessibilityProvider>
                  <SettingsApplier />
                  <ClientInit />
                  <OfflineDetector />
                  <OfflineSyncIndicator />
                  <PwaInstallBanner />
                  <WhatsNewDialog />
                  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
                </AccessibilityProvider>
              </SettingsProvider>
            </ThemeProvider>
          </FirebaseAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
