"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getOpenRouterHeaders } from "@/lib/api-client"

export function ApiKeyTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testApiKey = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      // Get the API key
      const headers = getOpenRouterHeaders()
      const apiKey = headers.Authorization.replace("Bearer ", "")

      if (!apiKey) {
        setError("API key is missing. Please check your environment variables.")
        return
      }

      // Make a simple request to OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      setResult(`API key is working! Found ${data.data?.length || 0} models.`)
    } catch (error) {
      console.error("API test failed:", error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium mb-2">API Key Tester</h3>
      <Button onClick={testApiKey} disabled={isLoading}>
        {isLoading ? "Testing..." : "Test API Key"}
      </Button>

      {result && <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 rounded">{result}</div>}

      {error && <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded">Error: {error}</div>}
    </div>
  )
}
