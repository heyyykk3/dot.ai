"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, MessageSquare, Bot, User } from "lucide-react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { format } from "date-fns"

interface SearchDialogProps {
  onSelectResult: (chatId: string, messageId?: string) => void
}

export function SearchDialog({ onSelectResult }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchFilter, setSearchFilter] = useState("all")
  const [guestResults, setGuestResults] = useState<any[]>([])

  // Handle search for signed-in users
  const handleSearch = async () => {
    if (!searchTerm.trim() || !auth.currentUser) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const messagesRef = collection(db, "messages")
      let q = query(
        messagesRef,
        where("userId", "==", auth.currentUser.uid),
        where("content", ">=", searchTerm),
        where("content", "<=", searchTerm + "\uf8ff"),
        orderBy("content"),
        limit(20),
      )

      // Apply filters
      if (searchFilter === "user") {
        q = query(
          messagesRef,
          where("userId", "==", auth.currentUser.uid),
          where("role", "==", "user"),
          where("content", ">=", searchTerm),
          where("content", "<=", searchTerm + "\uf8ff"),
          orderBy("content"),
          limit(20),
        )
      } else if (searchFilter === "assistant") {
        q = query(
          messagesRef,
          where("userId", "==", auth.currentUser.uid),
          where("role", "==", "assistant"),
          where("content", ">=", searchTerm),
          where("content", "<=", searchTerm + "\uf8ff"),
          orderBy("content"),
          limit(20),
        )
      }

      const querySnapshot = await getDocs(q)
      const results: any[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        results.push({
          id: doc.id,
          chatId: data.chatId,
          content: data.content,
          role: data.role,
          timestamp: data.timestamp?.toDate() || new Date(),
        })
      })

      setSearchResults(results)
    } catch (error) {
      console.error("Error searching messages:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search for guest users (localStorage)
  const handleGuestSearch = () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setGuestResults([])

    try {
      const results: any[] = []

      // Search through all localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("chat_")) {
          const chatId = key.replace("chat_", "")
          const messagesJson = localStorage.getItem(key)

          if (messagesJson) {
            try {
              const messages = JSON.parse(messagesJson)

              // Filter messages based on search term and role filter
              const matchingMessages = messages.filter((msg: any) => {
                const contentMatch = msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                if (!contentMatch) return false

                if (searchFilter === "user") return msg.role === "user"
                if (searchFilter === "assistant") return msg.role === "assistant"
                return true
              })

              // Add matching messages to results
              matchingMessages.forEach((msg: any) => {
                results.push({
                  id: msg.id,
                  chatId,
                  content: msg.content,
                  role: msg.role,
                  timestamp: new Date(msg.timestamp),
                })
              })
            } catch (e) {
              console.error("Error parsing messages for chat:", chatId, e)
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Limit to 20 results
      setGuestResults(results.slice(0, 20))
    } catch (error) {
      console.error("Error searching guest messages:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Trigger search when search term or filter changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        if (auth.currentUser) {
          handleSearch()
        } else {
          handleGuestSearch()
        }
      }
    }, 500)

    return () => clearTimeout(delaySearch)
  }, [searchTerm, searchFilter])

  // Handle result selection
  const handleSelectResult = (chatId: string, messageId?: string) => {
    onSelectResult(chatId, messageId)
    setOpen(false)
  }

  // Format message content for display (truncate if too long)
  const formatMessageContent = (content: string) => {
    if (content.length > 100) {
      return content.substring(0, 100) + "..."
    }
    return content
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search conversations</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={searchFilter} onValueChange={setSearchFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="user">
                  <User className="mr-1 h-3 w-3" />
                  You
                </TabsTrigger>
                <TabsTrigger value="assistant">
                  <Bot className="mr-1 h-3 w-3" />
                  AI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[300px]">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="dot-pulse" />
              </div>
            ) : (
              <div className="space-y-2">
                {(auth.currentUser ? searchResults : guestResults).length > 0 ? (
                  (auth.currentUser ? searchResults : guestResults).map((result) => (
                    <button
                      key={result.id}
                      className="w-full rounded-md border p-3 text-left hover:bg-muted transition-colors"
                      onClick={() => handleSelectResult(result.chatId, result.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-1 rounded-full p-1 ${result.role === "user" ? "bg-primary/10" : "bg-secondary"}`}
                        >
                          {result.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{formatMessageContent(result.content)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(result.timestamp, "MMM d, yyyy h:mm a")}</span>
                            <MessageSquare className="ml-2 h-3 w-3" />
                            <span>Chat ID: {result.chatId.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : searchTerm.trim() ? (
                  <div className="py-8 text-center text-muted-foreground">No results found for "{searchTerm}"</div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">Enter a search term to find messages</div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
