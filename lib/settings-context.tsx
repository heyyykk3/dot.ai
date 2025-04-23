"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useTheme } from "next-themes"

// Define the settings interface
export interface UserSettings {
  // Appearance
  messageDensity: "compact" | "comfortable" | "spacious"
  fontSize: "small" | "medium" | "large"
  codeBlockTheme: "default" | "github" | "dracula" | "solarized"

  // Models
  defaultPersonalModel: string
  defaultCodeModel: string
  defaultResearchModel: string
  defaultImageModel: string

  // Notifications
  emailNotifications: boolean
  desktopNotifications: boolean

  // Privacy
  saveHistory: boolean
  shareAnonymousUsage: boolean

  // Accessibility
  reducedMotion: boolean
  highContrast: boolean

  // Chat
  sendWithEnter: boolean
  showTimestamps: boolean
  autoGenerateTitles: boolean
}

// Default settings
export const defaultSettings: UserSettings = {
  // Appearance
  messageDensity: "comfortable",
  fontSize: "medium",
  codeBlockTheme: "default",

  // Models
  defaultPersonalModel: "mistralai/mistral-nemo:free",
  defaultCodeModel: "open-r1/olympiccoder-32b:free",
  defaultResearchModel: "deepseek/deepseek-r1-zero:free",
  defaultImageModel: "absolute_reality",

  // Notifications
  emailNotifications: true,
  desktopNotifications: false,

  // Privacy
  saveHistory: true,
  shareAnonymousUsage: true,

  // Accessibility
  reducedMotion: false,
  highContrast: false,

  // Chat
  sendWithEnter: true,
  showTimestamps: true,
  autoGenerateTitles: true,
}

// Create the context
interface SettingsContextType {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>
  resetSettings: () => Promise<void>
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const { setTheme } = useTheme()

  // Load settings when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoading(true)

      try {
        if (user) {
          // For signed-in users, load from Firestore
          const settingsDoc = await getDoc(doc(db, "userSettings", user.uid))

          if (settingsDoc.exists()) {
            const userSettings = settingsDoc.data() as Partial<UserSettings>
            setSettings({ ...defaultSettings, ...userSettings })
          } else {
            // If no settings document exists, create one with defaults
            await setDoc(doc(db, "userSettings", user.uid), defaultSettings)
            setSettings(defaultSettings)
          }
        } else {
          // For guest users, load from localStorage
          const storedSettings = localStorage.getItem("userSettings")

          if (storedSettings) {
            try {
              const parsedSettings = JSON.parse(storedSettings) as Partial<UserSettings>
              setSettings({ ...defaultSettings, ...parsedSettings })
            } catch (e) {
              console.error("Error parsing stored settings:", e)
              setSettings(defaultSettings)
              localStorage.setItem("userSettings", JSON.stringify(defaultSettings))
            }
          } else {
            setSettings(defaultSettings)
            localStorage.setItem("userSettings", JSON.stringify(defaultSettings))
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        setSettings(defaultSettings)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Update a single setting
  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)

      if (auth.currentUser) {
        // For signed-in users, update Firestore
        await updateDoc(doc(db, "userSettings", auth.currentUser.uid), {
          [key]: value,
        })
      } else {
        // For guest users, update localStorage
        localStorage.setItem("userSettings", JSON.stringify(newSettings))
      }
    } catch (error) {
      console.error(`Error updating setting ${String(key)}:`, error)
    }
  }

  // Reset all settings to defaults
  const resetSettings = async () => {
    try {
      setSettings(defaultSettings)

      if (auth.currentUser) {
        // For signed-in users, update Firestore
        await setDoc(doc(db, "userSettings", auth.currentUser.uid), defaultSettings)
      } else {
        // For guest users, update localStorage
        localStorage.setItem("userSettings", JSON.stringify(defaultSettings))
      }
    } catch (error) {
      console.error("Error resetting settings:", error)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

// Hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext)

  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
