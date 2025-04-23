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
import { Sparkles, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

// Current app version - update this when adding new features
const APP_VERSION = "1.3.0"

// Features by version
const versionFeatures = {
  "1.3.0": [
    {
      title: "Enhanced Conversation Context",
      description: "AI now maintains better context of your entire conversation, including images you've shared.",
      icon: "🧠",
    },
    {
      title: "Improved Mobile Experience",
      description: "Fixed UI issues on mobile devices when displaying code blocks and images.",
      icon: "📱",
    },
    {
      title: "Better Image Context",
      description: "AI now remembers images you've shared and can reference them in later responses.",
      icon: "🖼️",
    },
    {
      title: "Enhanced Export Options",
      description: "More options for exporting your conversations with improved formatting.",
      icon: "📤",
    },
  ],
  "1.2.0": [
    {
      title: "Progressive Web App Support",
      description: "Install dot.ai on your device for a better experience and offline access.",
      icon: "💻",
    },
    {
      title: "Improved Mobile Experience",
      description: "Pull-to-refresh, better keyboard handling, and haptic feedback for mobile devices.",
      icon: "📱",
    },
    {
      title: "Interactive Tutorial",
      description: "New user onboarding with an interactive tutorial to help you get started.",
      icon: "🎓",
    },
    {
      title: "Offline Support",
      description: "Access your cached conversations even when you're offline.",
      icon: "🔌",
    },
  ],
  "1.1.0": [
    {
      title: "Image Generation",
      description: "Generate images from text descriptions using AI.",
      icon: "🖼️",
    },
    {
      title: "Multiple AI Models",
      description: "Choose from different AI models for different tasks.",
      icon: "🤖",
    },
    {
      title: "Dark Mode",
      description: "Switch between light and dark themes.",
      icon: "🌙",
    },
  ],
  "1.0.0": [
    {
      title: "Initial Release",
      description: "The first version of dot.ai with basic chat functionality.",
      icon: "🚀",
    },
  ],
}

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastSeenVersion, setLastSeenVersion] = useState("")
  const router = useRouter()

  // Check if there are new features to show
  useEffect(() => {
    const storedVersion = localStorage.getItem("lastSeenVersion") || "0.0.0"
    setLastSeenVersion(storedVersion)

    // Compare versions to see if we should show what's new
    if (compareVersions(APP_VERSION, storedVersion) > 0) {
      // Only show after a short delay to not interrupt initial app load
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [])

  // Handle dialog close
  const handleClose = () => {
    localStorage.setItem("lastSeenVersion", APP_VERSION)
    setIsOpen(false)
  }

  // Handle "Try Now" button click
  const handleTryNow = () => {
    localStorage.setItem("lastSeenVersion", APP_VERSION)
    setIsOpen(false)
    // Navigate to chat page
    router.push("/chat")
  }

  // Get features to show (only new ones since last seen version)
  const getFeaturesToShow = () => {
    const features: any[] = []

    Object.entries(versionFeatures).forEach(([version, versionFeatures]) => {
      if (compareVersions(version, lastSeenVersion) > 0) {
        features.push(...versionFeatures.map((feature) => ({ ...feature, version })))
      }
    })

    return features
  }

  const newFeatures = getFeaturesToShow()

  // If no new features, don't render anything
  if (newFeatures.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What's New in dot.ai v{APP_VERSION}
          </DialogTitle>
          <DialogDescription>Check out these new features and improvements</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-auto pr-2">
          {newFeatures.map((feature, index) => (
            <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
              <div className="text-2xl flex-shrink-0">{feature.icon}</div>
              <div>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div className="text-xs text-muted-foreground mt-1">Added in v{feature.version}</div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="sm:flex-1">
            <X className="mr-2 h-4 w-4" />
            Dismiss
          </Button>
          <Button onClick={handleTryNow} className="sm:flex-1">
            <Check className="mr-2 h-4 w-4" />
            Try Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to compare version strings
function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split(".").map(Number)
  const parts2 = version2.split(".").map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }

  return 0
}
