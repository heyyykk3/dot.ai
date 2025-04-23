"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/register-sw"
import { initializeEncryption } from "@/lib/secure-storage"

export function ClientInit() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    // Initialize encryption if needed
    const privacySettings = localStorage.getItem("privacySettings")
    if (privacySettings) {
      const settings = JSON.parse(privacySettings)
      if (settings.encryptMessages) {
        initializeEncryption().catch(console.error)
      }
    }

    // Check if app was launched from installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")

    if (isStandalone) {
      // Set a flag that we're running as installed PWA
      localStorage.setItem("isPWA", "true")

      // Apply PWA-specific styles or behaviors
      document.documentElement.classList.add("pwa-mode")

      // Handle back button for PWA navigation
      window.addEventListener("popstate", (e) => {
        // Custom back navigation handling for PWA
        if (window.location.pathname === "/") {
          // Prevent closing the app on home screen back press
          e.preventDefault()
        }
      })
    }

    // Register for push notifications if supported
    if ("Notification" in window && "PushManager" in window) {
      // Check if we should request permission
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        // Wait until user has interacted with the page
        document.addEventListener(
          "click",
          async () => {
            try {
              const permission = await Notification.requestPermission()
              if (permission === "granted") {
                console.log("Notification permission granted")
                // Would register with push service here in a real app
              }
            } catch (error) {
              console.error("Error requesting notification permission:", error)
            }
          },
          { once: true },
        )
      }
    }
  }, [])

  return null
}
