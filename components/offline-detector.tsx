"use client"

import { useState, useEffect } from "react"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"
import { requestSync } from "@/lib/register-sw"

export function OfflineDetector() {
  const isOnline = useNetworkStatus()
  const [showAlert, setShowAlert] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  // Show alert when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowAlert(true)
    } else {
      // When coming back online, attempt to sync any pending messages
      if (showAlert) {
        requestSync()
      }
      // Hide the alert after a delay when coming back online
      const timer = setTimeout(() => {
        setShowAlert(false)
        setReconnecting(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, showAlert])

  // Handle manual reconnection attempt
  const handleReconnect = () => {
    setReconnecting(true)

    // Try to fetch a small resource to test connection
    fetch("/api/ping", { method: "HEAD" })
      .then(() => {
        // If successful, we're back online
        requestSync()
        setTimeout(() => {
          setShowAlert(false)
          setReconnecting(false)
        }, 1000)
      })
      .catch(() => {
        // Still offline
        setReconnecting(false)
      })
  }

  if (!showAlert) return null

  return (
    <Alert
      variant="destructive"
      className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5"
    >
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You're offline</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          {isOnline
            ? "Your connection has been restored."
            : "Your internet connection was lost. Some features may be unavailable."}
        </p>
        {!isOnline && (
          <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleReconnect} disabled={reconnecting}>
            {reconnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try to reconnect
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
