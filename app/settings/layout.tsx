import type React from "react"
import { BackgroundPath } from "@/components/background-path"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <BackgroundPath className="fixed inset-0 z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
