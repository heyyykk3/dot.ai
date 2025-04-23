"use client"

import { createContext, useContext } from "react"

interface SettingsContextType {
  mode: string
  setMode: (mode: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
