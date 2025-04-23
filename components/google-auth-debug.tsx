"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup, getRedirectResult } from "firebase/auth"

export function GoogleAuthDebug() {
  const [status, setStatus] = useState<{
    popupTest: boolean | null
    redirectTest: boolean | null
    persistenceTest: boolean | null
    currentUser: string | null
    error: string | null
  }>({
    popupTest: null,
    redirectTest: null,
    persistenceTest: null,
    currentUser: null,
    error: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  const testGooglePopup = async () => {
    setIsLoading(true)
    setStatus((prev) => ({ ...prev, popupTest: null, error: null }))

    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.addScope("profile")

      const result = await signInWithPopup(auth, provider)
      console.log("Popup test successful:", result.user.uid)

      setStatus((prev) => ({
        ...prev,
        popupTest: true,
        currentUser: result.user.uid,
      }))
    } catch (error: any) {
      console.error("Popup test failed:", error)
      setStatus((prev) => ({
        ...prev,
        popupTest: false,
        error: error.message,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const checkRedirectResult = async () => {
    setIsLoading(true)
    setStatus((prev) => ({ ...prev, redirectTest: null, error: null }))

    try {
      const result = await getRedirectResult(auth)

      if (result && result.user) {
        console.log("Redirect result found:", result.user.uid)
        setStatus((prev) => ({
          ...prev,
          redirectTest: true,
          currentUser: result.user.uid,
        }))
      } else {
        console.log("No redirect result found")
        setStatus((prev) => ({
          ...prev,
          redirectTest: false,
        }))
      }
    } catch (error: any) {
      console.error("Redirect check failed:", error)
      setStatus((prev) => ({
        ...prev,
        redirectTest: false,
        error: error.message,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const checkPersistence = async () => {
    setIsLoading(true)
    setStatus((prev) => ({ ...prev, persistenceTest: null, error: null }))

    try {
      const currentUser = auth.currentUser

      if (currentUser) {
        console.log("User is persisted:", currentUser.uid)
        setStatus((prev) => ({
          ...prev,
          persistenceTest: true,
          currentUser: currentUser.uid,
        }))
      } else {
        console.log("No persisted user found")
        setStatus((prev) => ({
          ...prev,
          persistenceTest: false,
        }))
      }
    } catch (error: any) {
      console.error("Persistence check failed:", error)
      setStatus((prev) => ({
        ...prev,
        persistenceTest: false,
        error: error.message,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Google Auth Debug</CardTitle>
        <CardDescription>Test Google authentication methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {status.currentUser && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Current User</AlertTitle>
            <AlertDescription>User ID: {status.currentUser}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Popup Sign-In:</div>
          <div
            className={
              status.popupTest === null ? "text-gray-500" : status.popupTest ? "text-green-500" : "text-red-500"
            }
          >
            {status.popupTest === null ? "Not tested" : status.popupTest ? "Success" : "Failed"}
          </div>

          <div className="text-sm font-medium">Redirect Result:</div>
          <div
            className={
              status.redirectTest === null ? "text-gray-500" : status.redirectTest ? "text-green-500" : "text-red-500"
            }
          >
            {status.redirectTest === null ? "Not tested" : status.redirectTest ? "Success" : "No result found"}
          </div>

          <div className="text-sm font-medium">Auth Persistence:</div>
          <div
            className={
              status.persistenceTest === null
                ? "text-gray-500"
                : status.persistenceTest
                  ? "text-green-500"
                  : "text-red-500"
            }
          >
            {status.persistenceTest === null
              ? "Not tested"
              : status.persistenceTest
                ? "User persisted"
                : "No persisted user"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button onClick={testGooglePopup} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Test Google Popup Sign-In
        </Button>
        <Button onClick={checkRedirectResult} disabled={isLoading} variant="outline" className="w-full">
          Check Redirect Result
        </Button>
        <Button onClick={checkPersistence} disabled={isLoading} variant="outline" className="w-full">
          Check Auth Persistence
        </Button>
      </CardFooter>
    </Card>
  )
}
