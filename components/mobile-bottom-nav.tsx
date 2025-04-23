"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Code, ImageIcon, MessageSquare, Search, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerHapticIfEnabled, HapticPattern } from "@/lib/haptic-feedback"

interface MobileBottomNavProps {
  mode: string
  onModeChange: (mode: string) => void
  isPremium?: boolean
}

export function MobileBottomNav({ mode, onModeChange, isPremium = false }: MobileBottomNavProps) {
  const handleModeChange = useCallback(
    (newMode: string) => {
      onModeChange(newMode)
      triggerHapticIfEnabled(HapticPattern.LIGHT)
    },
    [onModeChange],
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex flex-col items-center justify-center h-10 w-10 rounded-lg",
            mode === "personal" && "bg-muted text-sky-400",
          )}
          onClick={() => handleModeChange("personal")}
        >
          <MessageSquare className="h-3 w-3" />
          <span className="text-xs mt-0.5">Chat</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex flex-col items-center justify-center h-10 w-10 rounded-lg",
            mode === "code" && "bg-muted text-sky-400",
          )}
          onClick={() => handleModeChange("code")}
        >
          <Code className="h-3 w-3" />
          <span className="text-xs mt-0.5">Code</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex flex-col items-center justify-center h-10 w-10 rounded-lg",
            mode === "research" && "bg-muted text-sky-400",
          )}
          onClick={() => handleModeChange("research")}
        >
          <Search className="h-3 w-3" />
          <span className="text-xs mt-0.5">Research</span>
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "flex flex-col items-center justify-center h-10 w-10 rounded-lg",
              mode === "image" && "bg-muted text-sky-400",
            )}
            onClick={() => handleModeChange("image")}
          >
            <ImageIcon className="h-3 w-3" />
            <span className="text-xs mt-0.5">Image</span>
          </Button>
          {!isPremium && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1 rounded-full flex items-center">
              <Crown className="h-2 w-2 mr-0.5" />
              <span className="text-[8px]">PRO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
