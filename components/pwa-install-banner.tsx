"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, Plus, X } from "lucide-react"
import { IOSInstallGuide } from "./ios-install-guide"

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  // Fix: useRef returns an object, not an array to destructure
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if banner was recently dismissed
    const lastDismissed = localStorage.getItem("pwaPromptDismissed")
    if (lastDismissed) {
      const dismissedTime = Number.parseInt(lastDismissed, 10)
      // If dismissed in the last 3 days, don't show again
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true)
        return
      }
    }

    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // For iOS, check if already installed
    if (isIOSDevice) {
      // Check if running in standalone mode (installed)
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
        return // Already installed, don't show banner
      }

      // Show banner after a delay for iOS
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // For other platforms, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault()

      // Store the event for later use
      const promptEvent = e as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      promptRef.current = promptEvent

      // Show the banner after user has interacted with the page
      const showBannerAfterInteraction = () => {
        setIsVisible(true)
        // Remove the event listener after it's been used
        document.removeEventListener("click", showBannerAfterInteraction)
      }

      // Add event listener for user interaction
      document.addEventListener("click", showBannerAfterInteraction, { once: true })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt && !promptRef.current) return

    const prompt = installPrompt || promptRef.current
    if (!prompt) return

    // Show the install prompt
    await prompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await prompt.userChoice

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt")
      setIsVisible(false)
    } else {
      console.log("User dismissed the install prompt")
    }

    // Clear the saved prompt
    setInstallPrompt(null)
    promptRef.current = null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    // Save dismissal time
    localStorage.setItem("pwaPromptDismissed", Date.now().toString())
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-secondary p-4 text-secondary-foreground animate-in slide-in-from-bottom-5">
      <div className="container flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">Add dot.ai to your home screen</p>
          <p className="text-xs text-muted-foreground">For a better experience and offline access</p>
        </div>

        <div className="flex items-center gap-2">
          {isIOS ? (
            <Button size="sm" variant="default" className="gap-1" onClick={() => setIsIOSGuideOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>How to Install</span>
            </Button>
          ) : (
            <Button size="sm" variant="default" className="gap-1" onClick={handleInstall}>
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </Button>
          )}

          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleDismiss}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>

      {isIOS && <IOSInstallGuide open={isIOSGuideOpen} onOpenChange={setIsIOSGuideOpen} />}
    </div>
  )
}
