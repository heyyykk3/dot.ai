"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import {
  isOnline,
  addOnlineStatusListener,
  syncPendingData,
  getPendingMessages,
  getPendingChats,
} from "@/lib/offline-sync"

export function OfflineSyncIndicator() {
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    messages: number
    chats: number
    errors: number
  } | null>(null)
  const [showAlert, setShowAlert] = useState(false)

  // Check pending items count
  const checkPendingCount = async () => {
    try {
      const messages = await getPendingMessages()
      const chats = await getPendingChats()
      setPendingCount(messages.length + chats.length)
    } catch (error) {
      console.error("Error checking pending count:", error)
    }
  }

  // Listen for online status changes
  useEffect(() => {
    const cleanup = addOnlineStatusListener((isOnline) => {
      setOnline(isOnline)

      // When coming back online, show the alert if we have pending items
      if (isOnline && pendingCount > 0) {
        setShowAlert(true)
      }
    })

    // Initial check
    checkPendingCount()

    return cleanup
  }, [pendingCount])

  // Periodically check pending count
  useEffect(() => {
    const interval = setInterval(checkPendingCount, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Handle manual sync
  const handleSync = async () => {
    if (!online || isSyncing) return

    setIsSyncing(true)
    setSyncProgress(10)
    setSyncResult(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Perform sync
      const result = await syncPendingData()

      clearInterval(progressInterval)
      setSyncProgress(100)

      // Update result
      setSyncResult({
        success: result.errors === 0,
        messages: result.messages,
        chats: result.chats,
        errors: result.errors,
      })

      // Update pending count
      await checkPendingCount()

      // Auto-hide after success
      if (result.errors === 0) {
        setTimeout(() => {
          setShowAlert(false)
        }, 5000)
      }
    } catch (error) {
      console.error("Error syncing:", error)
      setSyncResult({
        success: false,
        messages: 0,
        chats: 0,
        errors: 1,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Don't show anything if we're online and have no pending items
  if ((online && pendingCount === 0) || !showAlert) {
    return null
  }

  return (
    <Alert
      variant={!online ? "destructive" : syncResult?.success === false ? "destructive" : "default"}
      className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5"
    >
      {!online ? (
        <WifiOff className="h-4 w-4" />
      ) : syncResult?.success === false ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}

      <AlertTitle>
        {!online
          ? "You're offline"
          : isSyncing
            ? "Syncing data..."
            : syncResult
              ? syncResult.success
                ? "Sync complete"
                : "Sync error"
              : "Offline data available"}
      </AlertTitle>

      <AlertDescription className="flex flex-col gap-2">
        {!online ? (
          <p>Your changes are being saved locally and will sync when you're back online.</p>
        ) : (
          <>
            {!syncResult && !isSyncing && (
              <p>
                You have {pendingCount} item{pendingCount !== 1 ? "s" : ""} to sync.
              </p>
            )}

            {isSyncing && (
              <>
                <p>Syncing your offline changes...</p>
                <Progress value={syncProgress} className="h-2 mt-1" />
              </>
            )}

            {syncResult && (
              <p>
                {syncResult.success
                  ? `Successfully synced ${syncResult.messages} message${syncResult.messages !== 1 ? "s" : ""} and ${syncResult.chats} chat${syncResult.chats !== 1 ? "s" : ""}.`
                  : `Sync completed with ${syncResult.errors} error${syncResult.errors !== 1 ? "s" : ""}. Some items may not have synced.`}
              </p>
            )}

            {!isSyncing && (
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Close button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={() => setShowAlert(false)}
        >
          <span className="sr-only">Close</span>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
