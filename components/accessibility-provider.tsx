"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSettings } from "@/lib/settings-context"

interface AccessibilityContextType {
  announceMessage: (message: string, politeness?: "polite" | "assertive") => void
  focusableElements: HTMLElement[]
  registerFocusableElement: (element: HTMLElement) => void
  unregisterFocusableElement: (element: HTMLElement) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([])
  const [announcements, setAnnouncements] = useState<
    Array<{ id: string; message: string; politeness: "polite" | "assertive" }>
  >([])

  // Register a focusable element
  const registerFocusableElement = (element: HTMLElement) => {
    setFocusableElements((prev) => [...prev, element])
  }

  // Unregister a focusable element
  const unregisterFocusableElement = (element: HTMLElement) => {
    setFocusableElements((prev) => prev.filter((el) => el !== element))
  }

  // Announce a message to screen readers
  const announceMessage = (message: string, politeness: "polite" | "assertive" = "polite") => {
    const id = Math.random().toString(36).substring(2, 9)
    setAnnouncements((prev) => [...prev, { id, message, politeness }])

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }, 3000)
  }

  // Apply reduced motion setting
  useEffect(() => {
    if (settings.reducedMotion) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }
  }, [settings.reducedMotion])

  // Apply high contrast setting
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }, [settings.highContrast])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab trap for modals
      if (e.key === "Tab" && document.querySelector("[role=dialog]")) {
        const focusableModalElements = Array.from(
          document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => {
          const element = el as HTMLElement
          return (
            element.closest("[role=dialog]") &&
            !element.disabled &&
            element.tabIndex !== -1 &&
            element.offsetParent !== null
          )
        }) as HTMLElement[]

        if (focusableModalElements.length === 0) return

        const firstElement = focusableModalElements[0]
        const lastElement = focusableModalElements[focusableModalElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{
        announceMessage,
        focusableElements,
        registerFocusableElement,
        unregisterFocusableElement,
      }}
    >
      {children}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcements
          .filter((a) => a.politeness === "polite")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      <div className="sr-only" aria-live="assertive" role="alert">
        {announcements
          .filter((a) => a.politeness === "assertive")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}
