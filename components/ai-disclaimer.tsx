"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function AIDisclaimer() {
  const [dismissed, setDismissed] = useState(false)

  // Check if the disclaimer has been dismissed before
  useEffect(() => {
    const isDismissed = localStorage.getItem("aiDisclaimerDismissed") === "true"
    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("aiDisclaimerDismissed", "true")
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 mb-4 relative">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
        AI may generate inaccurate information. Always verify important information from reliable sources.
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 absolute top-2 right-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  )
}
