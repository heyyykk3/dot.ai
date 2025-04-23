"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [hasPrompted, setHasPrompted] = useState(false)

  useEffect(() => {
    // Check if already prompted recently
    const lastPrompt = localStorage.getItem("pwaPromptTime")
    if (lastPrompt) {
      const lastPromptTime = Number.parseInt(lastPrompt, 10)
      const now = Date.now()
      // Don't prompt if it's been less than 7 days
      if (now - lastPromptTime < 7 * 24 * 60 * 60 * 1000) {
        setHasPrompted(true)
        return
      }
    }

    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Only show prompt after user has interacted with the site for at least 30 seconds
      setTimeout(() => {
        if (!hasPrompted) {
          setIsOpen(true)
          setHasPrompted(true)
          localStorage.setItem("pwaPromptTime", Date.now().toString())
        }
      }, 30000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check if it's iOS and user has been on the site for 30 seconds
    if (isIOSDevice && !hasPrompted) {
      setTimeout(() => {
        setIsOpen(true)
        setHasPrompted(true)
        localStorage.setItem("pwaPromptTime", Date.now().toString())
      }, 30000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [hasPrompted])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choiceResult = await installPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt")
    } else {
      console.log("User dismissed the install prompt")
    }

    setInstallPrompt(null)
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add dot.ai to Home Screen</DialogTitle>
          <DialogDescription>
            {isIOS
              ? "Install dot.ai on your iOS device for quick access and a better experience."
              : "Install dot.ai as an app for quick access and a better experience."}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 text-sm">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Tap the{" "}
                  <span className="inline-flex items-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 10l5 5 5-5" />
                    </svg>{" "}
                    Share
                  </span>{" "}
                  button
                </li>
                <li>
                  Scroll down and tap <span className="font-semibold">Add to Home Screen</span>
                </li>
                <li>
                  Tap <span className="font-semibold">Add</span> in the top right corner
                </li>
              </ol>
            </div>
            <div className="flex justify-center">
              <img src="/images/ios-install.png" alt="iOS installation steps" className="h-40 object-contain" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">Installing dot.ai gives you:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Faster access to your conversations</li>
              <li>Offline capabilities</li>
              <li>Full-screen experience</li>
              <li>App-like interface</li>
            </ul>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe later
          </Button>

          {!isIOS && (
            <Button onClick={handleInstall} className="mb-2 sm:mb-0">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
