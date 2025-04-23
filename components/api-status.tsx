"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function ApiStatus() {
  const [status, setStatus] = useState<{
    openrouter: { available: boolean; usagePercent: number }
    huggingface: { available: boolean; usagePercent: number }
    currentProvider: string
  }>({
    openrouter: { available: true, usagePercent: 0 },
    huggingface: { available: false, usagePercent: 0 },
    currentProvider: "openrouter",
  })

  const [isLoading, setIsLoading] = useState(false)

  // Check API status
  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error checking API status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check status on component mount
  useEffect(() => {
    checkStatus()

    // Check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Status</CardTitle>
        <CardDescription>Current API provider status and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>OpenRouter</span>
              {status.openrouter.available ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" /> Available
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                  <AlertCircle className="mr-1 h-3 w-3" /> Rate Limited
                </Badge>
              )}
              {status.currentProvider === "openrouter" && <Badge>Active</Badge>}
            </div>
            <span className="text-sm">{status.openrouter.usagePercent}% used</span>
          </div>
          <Progress value={status.openrouter.usagePercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>HuggingFace</span>
              {status.huggingface.available ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" /> Available
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                  <AlertCircle className="mr-1 h-3 w-3" /> Not Configured
                </Badge>
              )}
              {status.currentProvider === "huggingface" && <Badge>Active</Badge>}
            </div>
            {status.huggingface.available && (
              <>
                <span className="text-sm">{status.huggingface.usagePercent}% used</span>
                <Progress value={status.huggingface.usagePercent} className="h-2" />
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={checkStatus} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
