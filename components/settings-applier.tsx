"use client"

import { useEffect } from "react"
import { useSettings } from "@/lib/settings-context"

export function SettingsApplier() {
  const { settings } = useSettings()

  useEffect(() => {
    // Apply high contrast mode
    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }

    // Apply font size
    document.documentElement.classList.remove("font-size-small", "font-size-medium", "font-size-large")
    document.documentElement.classList.add(`font-size-${settings.fontSize}`)

    // Apply message density
    document.documentElement.classList.remove(
      "message-density-compact",
      "message-density-comfortable",
      "message-density-spacious",
    )
    document.documentElement.classList.add(`message-density-${settings.messageDensity}`)
  }, [settings])

  return null
}
