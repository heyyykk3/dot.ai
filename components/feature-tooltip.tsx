"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FeatureTooltipProps {
  children: ReactNode
  featureId: string
  content: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  showOnce?: boolean
  delay?: number
  forceShow?: boolean
}

export function FeatureTooltip({
  children,
  featureId,
  content,
  side = "top",
  showOnce = true,
  delay = 1000,
  forceShow = false,
}: FeatureTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)
  const storageKey = `tooltip_${featureId}`

  useEffect(() => {
    // Check if tooltip has been shown before
    const hasSeenTooltip = localStorage.getItem(storageKey) === "true"
    setHasBeenShown(hasSeenTooltip)

    // If tooltip should be shown and hasn't been shown before (or showOnce is false)
    if (!hasSeenTooltip || !showOnce || forceShow) {
      const timer = setTimeout(() => {
        setIsOpen(true)

        // Mark as shown if showOnce is true
        if (showOnce) {
          localStorage.setItem(storageKey, "true")
        }
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [featureId, showOnce, delay, storageKey, forceShow])

  // Handle dismissal
  const handleDismiss = () => {
    setIsOpen(false)
    setHasBeenShown(true)
    localStorage.setItem(storageKey, "true")
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="p-0 overflow-hidden">
          <div className="p-3 max-w-xs">
            <div className="flex justify-between items-start">
              <div className="flex-1">{content}</div>
              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1 -mt-1" onClick={handleDismiss}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
