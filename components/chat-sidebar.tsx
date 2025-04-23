"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, query, where, orderBy, getDocs, limit, deleteDoc, doc, writeBatch } from "firebase/firestore"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModeToggle } from "@/components/mode-toggle"
import {
  MessageSquare,
  PlusCircle,
  Settings,
  LogOut,
  LogIn,
  Info,
  X,
  Zap,
  Trash,
  Code,
  Search,
  ImageIcon,
  Home,
} from "lucide-react"
import { getGuestChatId, initGuestSession } from "@/lib/usage-limits"
import { useToast } from "@/hooks/use-toast"
import { firestoreOperation } from "@/lib/firestore-operations"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ChatSidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  chatId: string
  setChatId: (chatId: string) => void
  setMessages: (messages: any[]) => void
  onNewChat: () => void
  mode?: string
  onModeChange?: (mode: string) => void
}

// Update the ChatSidebar component to include the mode selector
export function ChatSidebar({
  isOpen,
  setIsOpen,
  chatId,
  setChatId,
  setMessages,
  onNewChat,
  mode = "personal",
  onModeChange,
}: ChatSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [chats, setChats] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [guestChats, setGuestChats] = useState<any[]>([])
  const isMobile = useMobile()

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        fetchChats(user.uid)
      } else {
        setChats([])
        loadGuestChats()
      }
    })

    return () => unsubscribe()
  }, [chatId]) // Add chatId to the dependency array

  const fetchChats = async (userId: string) => {
    try {
      // Get chats from the chats collection
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("userId", "==", userId), orderBy("updatedAt", "desc"))

      const querySnapshot = await getDocs(q)
      const chatList: any[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        chatList.push({
          id: data.chatId,
          title: data.topic || "New Chat",
          timestamp: data.updatedAt?.toDate() || new Date(),
        })
      })

      // If no chats found in the chats collection, fall back to messages collection
      if (chatList.length === 0) {
        const messagesRef = collection(db, "messages")
        const messagesQuery = query(messagesRef, where("userId", "==", userId), orderBy("timestamp", "desc"))

        const messagesSnapshot = await getDocs(messagesQuery)
        const chatIds = new Set<string>()

        messagesSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.chatId) {
            chatIds.add(data.chatId)
          }
        })

        // For each chat ID, get the first message to use as a title
        const fallbackChatList = await Promise.all(
          Array.from(chatIds).map(async (id) => {
            const chatQuery = query(
              messagesRef,
              where("chatId", "==", id),
              where("userId", "==", userId),
              orderBy("timestamp", "asc"),
              limit(1),
            )

            const chatSnapshot = await getDocs(chatQuery)
            let title = "New Chat"
            let timestamp = new Date()

            if (!chatSnapshot.empty) {
              const firstMessage = chatSnapshot.docs[0].data()
              // Use the first 30 characters of the first message as the title
              title = firstMessage.content.substring(0, 30)
              if (firstMessage.content.length > 30) {
                title += "..."
              }
              timestamp = firstMessage.timestamp?.toDate() || new Date()
            }

            return {
              id,
              title,
              timestamp,
            }
          }),
        )

        setChats(fallbackChatList)
      } else {
        setChats(chatList)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
      // Don't show an empty state on error, as it might be confusing
      // Instead, keep the previous state
    }
  }

  const loadGuestChats = () => {
    try {
      // Get all localStorage keys that start with "topic_"
      const chatList: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("topic_")) {
          const chatId = key.replace("topic_", "")
          const topic = localStorage.getItem(key) || "New Chat"

          // Get the messages to find the timestamp
          const messagesKey = `chat_${chatId}`
          const messagesJson = localStorage.getItem(messagesKey)
          let timestamp = new Date()

          if (messagesJson) {
            try {
              const messages = JSON.parse(messagesJson)
              if (messages.length > 0) {
                // Use the timestamp of the last message
                timestamp = new Date(messages[messages.length - 1].timestamp)
              }
            } catch (e) {
              console.error("Error parsing messages for chat:", chatId, e)
              // Use current timestamp as fallback
            }
          }

          chatList.push({
            id: chatId,
            title: topic,
            timestamp,
          })
        }
      }

      // Sort by timestamp, newest first
      chatList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setGuestChats(chatList)
    } catch (error) {
      console.error("Error loading guest chats:", error)
      // Keep previous state on error
    }
  }

  const handleSelectChat = async (selectedChatId: string) => {
    setChatId(selectedChatId)
    setIsOpen(false) // Close the sidebar after selecting a chat

    try {
      if (!user) {
        // For guest users, load from localStorage
        const messagesKey = `chat_${selectedChatId}`
        const messagesJson = localStorage.getItem(messagesKey)

        if (messagesJson) {
          try {
            setMessages(JSON.parse(messagesJson))
          } catch (e) {
            console.error("Error parsing messages:", e)
            setMessages([])
          }
        } else {
          setMessages([])
        }

        // Update guest session with selected chat ID
        try {
          const guestSession = localStorage.getItem("guestSession")
          if (guestSession) {
            const session = JSON.parse(guestSession)
            session.chatId = selectedChatId
            localStorage.setItem("guestSession", JSON.stringify(session))
          } else {
            initGuestSession()
          }
        } catch (e) {
          console.error("Error updating guest session:", e)
          // Initialize a new session as fallback
          initGuestSession()
        }
      }
      // For signed-in users, messages will be loaded in the chat page
      // when the chatId changes, so we don't need to do anything here
    } catch (error) {
      console.error("Error selecting chat:", error)
    }

    setIsOpen(false)
  }

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setChatId(getGuestChatId())
      setMessages([])
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Add the delete chat function
  const handleDeleteChat = async (chatIdToDelete: string, e?: React.MouseEvent) => {
    // Prevent the click from bubbling up to the chat selection
    if (e) {
      e.stopPropagation()
    }

    try {
      if (user) {
        // For signed-in users, delete from Firestore
        await firestoreOperation(async () => {
          await deleteDoc(doc(db, "chats", chatIdToDelete))

          // Delete all messages in the chat
          const messagesRef = collection(db, "messages")
          const q = query(messagesRef, where("chatId", "==", chatIdToDelete))
          const querySnapshot = await getDocs(q)

          const batch = writeBatch(db)
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref)
          })
          await batch.commit()

          console.log(`Successfully deleted chat ${chatIdToDelete} and its messages`)
        }, `Error deleting chat ${chatIdToDelete} from Firestore`)

        // Update the chat list
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatIdToDelete))

        // If the deleted chat is the current chat, clear the messages
        if (chatIdToDelete === chatId) {
          setChatId("")
          setMessages([])
        }

        toast({
          title: "Chat deleted",
          description: "This chat has been deleted successfully.",
        })
      } else {
        // For guest users, delete from localStorage
        localStorage.removeItem(`chat_${chatIdToDelete}`)
        localStorage.removeItem(`topic_${chatIdToDelete}`)

        // Update the guest chat list
        loadGuestChats()

        // If the deleted chat is the current chat, clear the messages
        if (chatIdToDelete === chatId) {
          setChatId("")
          setMessages([])
        }

        toast({
          title: "Chat deleted",
          description: "This chat has been deleted from your device.",
        })
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace the renderChatItem function with this updated version
  const renderChatItem = (chat: any, isUserChat: boolean) => {
    return (
      <div key={chat.id} className="relative mb-1 group">
        <Button
          variant={chat.id === chatId ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2 text-left overflow-hidden text-ellipsis",
            chat.id === chatId && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
          )}
          onClick={() => handleSelectChat(chat.id)}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="truncate">{chat.title}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center p-1"
          onClick={(e) => handleDeleteChat(chat.id, e)}
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Delete chat</span>
        </Button>
      </div>
    )
  }

  // Add a function to handle mode changes
  const handleModeChange = (newMode: string) => {
    if (onModeChange) {
      onModeChange(newMode)
    }
  }

  return (
    <>
      {/* Mobile overlay - keep this the same */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
            isMobile ? "block" : "hidden",
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - update the layout */}
      <div
        className={cn(
          `fixed inset-y-0 left-0 z-50 w-[240px] border-r bg-background transition-transform duration-300 ease-in-out lg:static lg:z-0 lg:translate-x-0`,
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile ? "top-0" : "",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-3 lg:h-[60px]">
            <Link href="/" className="text-lg font-semibold hover:text-sky-400 transition-colors">
              dot.ai
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <Button
              onClick={onNewChat}
              className="w-full rounded-full bg-sky-400 hover:bg-sky-500 text-white justify-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="px-3 py-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">CHAT MODES</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-full rounded-md",
                        mode === "personal" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
                      )}
                      onClick={() => handleModeChange("personal")}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Assistant</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Assistant</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-full rounded-md",
                        mode === "code" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
                      )}
                      onClick={() => handleModeChange("code")}
                    >
                      <Code className="h-4 w-4" />
                      <span className="sr-only">Code</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Code</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-full rounded-md",
                        mode === "research" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
                      )}
                      onClick={() => handleModeChange("research")}
                    >
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Research</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Research</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-full rounded-md",
                        mode === "image" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
                      )}
                      onClick={() => handleModeChange("image")}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="sr-only">Image</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Chat History */}
          <div className="px-3 py-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">CHAT HISTORY</span>
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1 px-2 overflow-y-auto custom-scrollbar">
            <div className="space-y-1 p-1">
              {user ? (
                chats.length > 0 ? (
                  chats.map((chat) => renderChatItem(chat, true))
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">No chat history</div>
                )
              ) : guestChats.length > 0 ? (
                guestChats.map((chat) => renderChatItem(chat, false))
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">No chat history</div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Navigation */}
          <div className="border-t p-3">
            <div className="grid grid-cols-5 gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/">
                      <Button variant="ghost" size="icon" className="h-10 w-full">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Home</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/about">
                      <Button variant="ghost" size="icon" className="h-10 w-full">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">About</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">About</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/pricing">
                      <Button variant="ghost" size="icon" className="h-10 w-full">
                        <Zap className="h-4 w-4" />
                        <span className="sr-only">Pricing</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Pricing</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings">
                      <Button variant="ghost" size="icon" className="h-10 w-full">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {user ? (
                        <Button variant="ghost" size="icon" className="h-10 w-full" onClick={handleSignOut}>
                          <LogOut className="h-4 w-4" />
                          <span className="sr-only">Sign Out</span>
                        </Button>
                      ) : (
                        <Link href="/signin">
                          <Button variant="ghost" size="icon" className="h-10 w-full">
                            <LogIn className="h-4 w-4" />
                            <span className="sr-only">Sign In</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{user ? "Sign Out" : "Sign In"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-3 flex items-center gap-2 px-2">
                <div className="h-6 w-6 rounded-full bg-sky-400 flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "User"}
                      className="h-full w-full rounded-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full text-xs text-white">
                      {(user.displayName || user.email || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <span className="truncate text-xs">{user.displayName || user.email || "User"}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="mt-3 flex justify-center">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
      {/* Remove the MobileBottomNav since we've moved the mode selector to the sidebar */}
    </>
  )
}
