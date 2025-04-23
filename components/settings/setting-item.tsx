import type { ReactNode } from "react"

interface SettingItemProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingItem({ title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between space-y-0.5">
      <div className="space-y-0.5">
        <div className="font-medium">{title}</div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}
