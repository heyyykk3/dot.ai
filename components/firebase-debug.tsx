"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, isFirebaseInitialized } from "@/lib/firebase"
import { signInAnonymously } from "firebase/auth"

export function FirebaseDebug() {
  const [status, setStatus] = useState<{
    initialized: boolean
    auth: boolean
    anonymousAuth: boolean
    error: string | null
  }>({
    initialized: false,
    auth: false,
    anonymousAuth: false,
    error: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if Firebase is initialized
    const initialized = isFirebaseInitialized()
    setStatus((prev) => ({ ...prev, initialized }))

    // Check if auth is available
    if (initialized) {
      setStatus((prev) => ({ ...prev, auth: !!auth }))
    }
  }, [])

  const testAnonymousAuth = async () => {
    setIsLoading(true)
    try {
      await signInAnonymously(auth)
      setStatus((prev) => ({ ...prev, anonymousAuth: true, error: null }))
    } catch (error: any) {
      console.error("Anonymous auth error:", error)
      setStatus((prev) => ({
        ...prev,
        anonymousAuth: false,
        error: error?.message || "Unknown error",
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firebase Debug</CardTitle>
        <CardDescription>Test Firebase configuration and authentication</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Firebase Initialized:</div>
          <div className={status.initialized ? "text-green-500" : "text-red-500"}>
            {status.initialized ? "Yes" : "No"}
          </div>

          <div className="text-sm font-medium">Auth Available:</div>
          <div className={status.auth ? "text-green-500" : "text-red-500"}>{status.auth ? "Yes" : "No"}</div>

          <div className="text-sm font-medium">Anonymous Auth:</div>
          <div className={status.anonymousAuth ? "text-green-500" : status.error ? "text-red-500" : "text-gray-500"}>
            {status.anonymousAuth ? "Success" : status.error ? "Failed" : "Not Tested"}
          </div>
        </div>

        {status.error && (
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-md text-sm">
            <strong>Error:</strong> {status.error}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={testAnonymousAuth}
          disabled={isLoading || !status.initialized || !status.auth}
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Anonymous Auth"}
        </Button>
      </CardFooter>
    </Card>
  )
}
