"use client"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OfflinePage() {
  const router = useRouter()
  const [cachedChats, setCachedChats] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)

  // Check for cached chats
  useEffect(() => {
    const checkCachedChats = () => {
      const chats: string[] = []

      // Check localStorage for cached chats
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("chat_")) {
          const chatId = key.replace("chat_", "")
          const topicKey = `topic_${chatId}`
          const topic = localStorage.getItem(topicKey) || "Chat"
          chats.push(topic)
        }
      }

      setCachedChats(chats.slice(0, 5)) // Show only the first 5 chats
    }

    checkCachedChats()
  }, [])

  // Check connection status
  const checkConnection = () => {
    setIsChecking(true)

    // Try to fetch a small resource to test connection
    fetch("/api/ping", { method: "HEAD" })
      .then(() => {
        // If successful, we're back online
        window.location.reload()
      })
      .catch(() => {
        // Still offline
        setIsChecking(false)
      })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">dot.ai</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">You're offline</h1>
            <p className="text-muted-foreground">
              dot.ai needs an internet connection to chat with AI models. You can still access your cached
              conversations.
            </p>
          </div>

          <Button onClick={checkConnection} className="w-full" disabled={isChecking}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking connection..." : "Check connection"}
          </Button>

          {cachedChats.length > 0 && (
            <div className="w-full space-y-4 mt-8">
              <h2 className="text-xl font-semibold">Available offline:</h2>
              <div className="space-y-2">
                {cachedChats.map((topic, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/chat")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground mb-4">While offline, you can:</p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left list-disc pl-5">
              <li>View previously cached conversations</li>
              <li>Draft messages (they'll send when you're back online)</li>
              <li>Access your settings</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
