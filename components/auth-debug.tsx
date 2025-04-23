"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkAuthProviders } from "@/lib/auth-config-checker"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AuthDebug() {
  const [providerStatus, setProviderStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkProviders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const status = await checkAuthProviders()
      setProviderStatus(status)
    } catch (err: any) {
      setError(err.message || "Failed to check providers")
      console.error("Provider check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>Check if authentication providers are properly configured</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {providerStatus && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Google Provider:</div>
              <div className={providerStatus.hasGoogleProvider ? "text-green-500" : "text-red-500"}>
                {providerStatus.hasGoogleProvider ? "Configured" : "Not Configured"}
              </div>

              <div className="text-sm font-medium">Apple Provider:</div>
              <div className={providerStatus.hasAppleProvider ? "text-green-500" : "text-red-500"}>
                {providerStatus.hasAppleProvider ? "Configured" : "Not Configured"}
              </div>

              <div className="text-sm font-medium">Email Provider:</div>
              <div className={providerStatus.hasEmailProvider ? "text-green-500" : "text-red-500"}>
                {providerStatus.hasEmailProvider ? "Configured" : "Not Configured"}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium">All Available Methods:</p>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                {JSON.stringify(providerStatus.allMethods, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkProviders} disabled={isLoading} className="w-full">
          {isLoading ? "Checking..." : "Check Auth Providers"}
        </Button>
      </CardFooter>
    </Card>
  )
}
