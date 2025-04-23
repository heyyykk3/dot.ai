"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { checkAIHordeStatus } from "@/lib/ai-horde"
import { Loader2, CheckCircle, XCircle, Users, Clock, AlertTriangle, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AIHordeStatus() {
  const [status, setStatus] = useState<{
    isOnline: boolean
    workerCount: number
    queueSize: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const statusData = await checkAIHordeStatus()

      // Check if we got a valid response with the expected properties
      if (statusData && typeof statusData.isOnline === "boolean") {
        setStatus(statusData)
        setLastChecked(new Date())
      } else {
        // Handle case where we got a response but it's not in the expected format
        console.error("Invalid status data format:", statusData)
        setError("Received invalid status data from the service")
        setStatus({ isOnline: false, workerCount: 0, queueSize: 0 })
      }
    } catch (err) {
      console.error("Error checking AI Horde status:", err)
      setError("Failed to check image generation service status")
      setStatus({ isOnline: false, workerCount: 0, queueSize: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  // Check status on component mount
  useEffect(() => {
    checkStatus()
  }, [])

  // Determine status color and message
  const getStatusInfo = () => {
    if (error) return { color: "red", message: "Error checking status" }
    if (!status) return { color: "gray", message: "Unknown" }

    if (!status.isOnline) return { color: "red", message: "Offline" }

    if (status.workerCount === 0) return { color: "red", message: "No workers available" }

    if (status.workerCount < 5) return { color: "amber", message: "Limited availability" }

    if (status.queueSize > 100) return { color: "amber", message: "High queue load" }

    return { color: "green", message: "Operational" }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="p-4 border rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">AI Horde Status</h3>
        {lastChecked && !error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Status last updated at {lastChecked.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking status...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-destructive flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : status ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {status.isOnline ? (
              statusInfo.color === "green" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : statusInfo.color === "amber" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>{statusInfo.message}</span>
          </div>

          {status.isOnline && (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{status.workerCount || 0} active workers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>{status.queueSize || 0} images in queue</span>
                {(status.queueSize || 0) > 50 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>High queue load may result in longer generation times</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                {(status.queueSize || 0) > 0 && (status.workerCount || 0) > 0 ? (
                  <span>Estimated wait: ~{Math.ceil((status.queueSize || 0) / (status.workerCount || 1))} minutes</span>
                ) : (
                  <span>Wait time unknown</span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div>No status information available</div>
      )}

      <Button onClick={checkStatus} className="mt-2" size="sm" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </>
        )}
      </Button>
    </div>
  )
}
