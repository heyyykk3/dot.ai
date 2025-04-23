"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, orderBy } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { getDefaultModel } from "@/lib/openrouter"
import { generateTopicFromMessage } from "@/lib/topic-generator"
import { generateImage } from "@/lib/ai-horde"
import {
  checkMessageLimit,
  checkImageLimit,
  getUsageLimits,
  isGuestSessionExpired,
  initGuestSession,
  getGuestChatId,
} from "@/lib/usage-limits"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInput } from "@/components/chat-input"
import { ChatMessages } from "@/components/chat-messages"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { conversationContext } from "@/lib/conversation-context"
import { ContextIndicator } from "@/components/context-indicator"
import { SearchDialog } from "@/components/search-dialog"
import { ExportDialog } from "@/components/export-dialog"
import { useSettings } from "@/lib/settings-context"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { triggerHapticIfEnabled, HapticPattern } from "@/lib/haptic-feedback"
import { InteractiveTutorial } from "@/components/interactive-tutorial"
import { FeatureTooltip } from "@/components/feature-tooltip"

// Import our new API client
import { generateAIResponse, analyzeImage } from "@/lib/api-client"

// First, import the new component at the top of the file
import { ImageModeInfo } from "@/components/image-mode-info"

// Add this import at the top with the other imports
import { checkOpenRouterStatus } from "@/lib/api-client"

// Add these imports
import { KeyboardSafeView } from "@/components/keyboard-safe-view"
import { isMobileBrowser, isIOS } from "@/lib/mobile-detection"
import { useTouchGestures } from "@/hooks/use-touch-gestures"

// Import the new mobile components
import { OptimizedMobileChatContainer } from "@/components/optimized-mobile-chat-container"

// Add these imports at the top of the file
import { getChat, getChatMessages, saveMessage, saveChat, syncPendingMessages } from "@/lib/firestore-operations"
import { storeMessageOffline, isOnline } from "@/lib/offline-sync"

// Add the BackgroundPath import at the top with the other imports
import { BackgroundPath } from "@/components/background-path"

// First, add the import for the new disclaimer component at the top of the file
import { AIDisclaimer } from "@/components/ai-disclaimer"
import { useAuth } from "@/lib/firebase-auth-provider"

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [chatId, setChatId] = useState<string | null>(searchParams.get("id"))
  const { user } = useAuth()
  const { toast } = useToast()
  const [chatTopic, setChatTopic] = useState<string>("New Chat")
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [mode, setMode] = useState<string>("personal")
  const [model, setModel] = useState<string>(getDefaultModel("personal"))
  const [aiHordeModel, setAiHordeModel] = useState<string>("absolute_reality")
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isGuest, setIsGuest] = useState<boolean>(true)
  const [imageGenerationProgress, setImageGenerationProgress] = useState<number>(0)
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const { settings } = useSettings()

  // Add state for tracking context information
  const [contextInfo, setContextInfo] = useState({
    messageCount: 0,
    isUsingSummary: false,
    contextSize: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = isMobileBrowser()

  const handleModeChange = useCallback((value: string) => {
    setMode(value)
    triggerHapticIfEnabled(HapticPattern.LIGHT)
    // Reset to default model for the selected mode
    setModel(getDefaultModel(value))
  }, [])

  useTouchGestures(containerRef, {
    onSwipeRight: () => {
      if (isMobile && !isSidebarOpen) {
        setIsSidebarOpen(true)
        triggerHapticIfEnabled(HapticPattern.MEDIUM)
      }
    },
    onSwipeLeft: () => {
      if (isMobile && isSidebarOpen) {
        setIsSidebarOpen(false)
        triggerHapticIfEnabled(HapticPattern.MEDIUM)
      }
    },
  })

  // Handle search result
  const handleSearchResult = (selectedChatId: string, messageId?: string) => {
    // Switch to the selected chat
    if (selectedChatId !== chatId) {
      setChatId(selectedChatId)
    }
  }

  // Function to migrate guest chat to Firestore
  const migrateGuestChatToFirestore = async (chatId: string, messages: any[], chatTopic: string, userId: string) => {
    try {
      // Save chat document
      await setDoc(doc(db, "chats", chatId), {
        chatId,
        userId: userId,
        topic: chatTopic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Save messages
      for (const message of messages) {
        await addDoc(collection(db, "messages"), {
          chatId,
          userId: userId,
          role: message.role,
          content: message.content,
          timestamp: serverTimestamp(),
        })
      }

      // Clear guest chat from localStorage
      localStorage.removeItem(`chat_${chatId}`)
      localStorage.removeItem(`topic_${chatId}`)
    } catch (error) {
      console.error("Error migrating guest chat:", error)
      throw error // Re-throw the error to be caught by the caller
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsGuest(false)

        // Check if we're transitioning from guest to authenticated user
        const currentChatId = chatId || getGuestChatId()

        if (!chatId) {
          // If no active chat, create a new one
          const newChatId = uuidv4()
          setChatId(newChatId)
        }
      } else {
        setIsGuest(true)
        // Check if guest session is expired
        if (isGuestSessionExpired()) {
          initGuestSession()
        }
        setChatId(getGuestChatId())
      }
    })

    return () => unsubscribe()
  }, [chatId])

  // Update the model based on mode and settings
  useEffect(() => {
    switch (mode) {
      case "personal":
        setModel(settings.defaultPersonalModel)
        break
      case "code":
        setModel(settings.defaultCodeModel)
        break
      case "research":
        setModel(settings.defaultResearchModel)
        break
      case "image":
        setAiHordeModel(settings.defaultImageModel)
        break
    }
  }, [mode, settings])

  // Scroll to bottom when messages change
  useEffect(() => {
    handleScrollToBottom()
  }, [messages])

  // Load messages for the current chat
  useEffect(() => {
    if (chatId && !isFirstRender.current) {
      loadMessages()
    }
    isFirstRender.current = false
  }, [chatId])

  // Simplified scroll to bottom function - only used for manual scrolling
  const handleScrollToBottom = useCallback(() => {
    const chatContainer = document.querySelector(".overflow-y-auto")
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [])

  async function loadMessages() {
    if (!chatId) return

    try {
      setIsLoading(true)

      if (auth.currentUser) {
        try {
          console.log(`Loading messages for chat ${chatId} and user ${auth.currentUser.uid}`)

          if (isOnline()) {
            await syncPendingMessages()
          }

          const messageList = await getChatMessages(chatId, auth.currentUser.uid)

          console.log(`Loaded ${messageList.length} messages from Firestore`)
          setMessages(messageList)

          const chatData = await getChat(chatId)
          if (chatData) {
            setChatTopic(chatData.topic || "New Chat")
          } else if (messageList.length > 0) {
            const firstMessage = messageList[0].content
            const topic = await generateTopicFromMessage(firstMessage)
            setChatTopic(topic)
            await saveChat(chatId, auth.currentUser.uid, topic)
          } else {
            setChatTopic("New Chat")
          }
        } catch (error) {
          console.error("Error loading messages from Firestore:", error)

          // Try to load from localStorage as fallback
          const storedMessages = localStorage.getItem(`chat_${chatId}`)
          if (storedMessages) {
            try {
              const parsedMessages = JSON.parse(storedMessages)
              setMessages(parsedMessages)

              const storedTopic = localStorage.getItem(`topic_${chatId}`)
              setChatTopic(storedTopic || "New Chat")

              console.log("Loaded messages from localStorage fallback")
            } catch (e) {
              console.error("Error parsing stored messages:", e)
              setMessages([])
            }
          }
        }
      } else {
        // For guest users, load from localStorage
        const storedMessages = localStorage.getItem(`chat_${chatId}`)
        if (storedMessages) {
          try {
            const parsedMessages = JSON.parse(storedMessages)
            setMessages(parsedMessages)
          } catch (e) {
            console.error("Error parsing stored messages:", e)
            setMessages([])
            localStorage.removeItem(`chat_${chatId}`)
          }
        }

        const storedTopic = localStorage.getItem(`topic_${chatId}`)
        if (storedTopic) {
          setChatTopic(storedTopic)
        } else if (storedMessages) {
          // If topic doesn't exist but messages do, generate a topic
          try {
            const parsedMessages = JSON.parse(storedMessages)
            if (parsedMessages.length > 0) {
              const firstMessage = parsedMessages[0].content
              const topic = await generateTopicFromMessage(firstMessage)
              setChatTopic(topic)
              localStorage.setItem(`topic_${chatId}`, topic)
            }
          } catch (e) {
            console.error("Error generating topic for guest chat:", e)
          }
        }
      }

      setContextInfo({
        messageCount: messages.length,
        isUsingSummary: messages.length > 20,
        contextSize: Math.min(messages.length, 20),
      })
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    triggerHapticIfEnabled(HapticPattern.LIGHT)

    try {
      await loadMessages()
      toast({
        title: "Refreshed",
        description: "Chat messages have been refreshed",
      })
    } catch (error) {
      console.error("Error refreshing messages:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle new chat
  const handleNewChat = async () => {
    const newChatId = isGuest ? uuidv4() : uuidv4()
    setChatId(newChatId)
    setMessages([])
    setChatTopic("New Chat")
    setLastUserMessage("")
    triggerHapticIfEnabled(HapticPattern.MEDIUM)

    // Clear the summary cache for the new chat
    conversationContext.clearSummaryCache(newChatId)

    // Check OpenRouter status when starting a new chat
    try {
      await checkOpenRouterStatus()
    } catch (error) {
      console.error("Error checking OpenRouter status:", error)
    }

    if (isGuest) {
      // Update guest session with new chat ID
      const guestSession = localStorage.getItem("guestSession")
      if (guestSession) {
        const session = JSON.parse(guestSession)
        session.chatId = newChatId
        localStorage.setItem("guestSession", JSON.stringify(session))
      } else {
        initGuestSession()
      }

      // Save empty chat to localStorage to make it appear in sidebar
      localStorage.setItem(`chat_${newChatId}`, JSON.stringify([]))
      localStorage.setItem(`topic_${newChatId}`, "New Chat")
    }
  }

  // Also check OpenRouter status when the component mounts
  useEffect(() => {
    // Check OpenRouter status on initial load
    checkOpenRouterStatus().catch(console.error)
  }, [])

  const getSystemPrompt = (mode: string, isImageAnalysis = false): string => {
    if (isImageAnalysis) {
      return "You are an image analysis assistant. Provide a thorough description of the image and answer any questions about it. If no specific question is asked, give a concise yet complete overview. Only elaborate when requested."
    }

    switch (mode) {
      case "personal":
        return "You are a helpful, friendly personal assistant. Provide concise, accurate answers to the user questions. Analyze their conversation history to identify preferences and past discussions, then build on these seamlessly. Only offer more details when the user specifically asks for elaboration."
      case "code":
        return "You are a helpful, friendly personal assistant. Provide concise, accurate answers to the users questions. Analyze their conversation history to identify preferences and past discussions, then build on these seamlessly. Only offer more details when the user specifically asks for elaboration."
      case "research":
        return "You are a research assistant. Offer in-depth, well-sourced information and consider various perspectives. Use the conversation history to remain consistent with the users past needs. Provide short answers by default, and only elaborate when asked."
      case "image":
        return "You are an image generation assistant. Provide concise yet detailed prompts for AI image generation. Review conversation history for context, accurately referencing past discussions. Keep responses short until the user requests more details."
      default:
        return "You are a helpful assistant."
    }
  }

  const getUserTier = () => {
    if (isGuest) return "Guest Mode"
    return "Free Tier"
  }

  const isPremiumUser = () => {
    // For now, all users are non-premium
    // This would be replaced with actual premium status check
    return false
  }

  const limits = getUsageLimits(isGuest)

  // Handle continuing generation from the last AI response
  const handleContinueGeneration = useCallback(async () => {
    if (isLoading || messages.length === 0) return
    triggerHapticIfEnabled(HapticPattern.MEDIUM)

    // Get the last AI message
    const lastAiMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "assistant")
    if (lastAiMessageIndex === -1) return

    const lastAiMessage = messages[messages.length - 1 - lastAiMessageIndex]

    setIsLoading(true)

    try {
      // Prepare the continuation prompt
      const continuationPrompt = "Please continue from where you left off."

      // Create a temporary user message for the continuation request
      const tempUserMessage = {
        id: uuidv4(),
        role: "user",
        content: continuationPrompt,
        timestamp: new Date().toISOString(),
      }

      // Add to messages array but don't display to user
      const messagesWithContinuation = [...messages, tempUserMessage]

      // Use our improved AI client for continuation
      const systemPrompt = getSystemPrompt(mode)
      const messageHistory = messagesWithContinuation.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Use the conversation context manager to prepare messages with context awareness
      const messagesForAPI = await conversationContext.prepareMessagesForAI(messageHistory, chatId, systemPrompt, mode)

      // Generate the continuation with the properly prepared messages
      const continuationText = await generateAIResponse(model, messagesForAPI, systemPrompt)

      // Create a new AI message with the continuation
      const continuationMessage = {
        id: uuidv4(),
        role: "assistant",
        content: continuationText,
        timestamp: new Date().toISOString(),
      }

      // Add the continuation to the messages
      setMessages((prev) => [...prev, continuationMessage])
      triggerHapticIfEnabled(HapticPattern.SUCCESS)

      // Save the continuation
      if (auth.currentUser) {
        await addDoc(collection(db, "messages"), {
          chatId,
          userId: auth.currentUser.uid,
          role: "assistant",
          content: continuationText,
          timestamp: serverTimestamp(),
        })
      } else {
        // For guest users, save to localStorage
        const updatedMessages = [...messages, continuationMessage]
        localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages))
      }
    } catch (error) {
      console.error("Error continuing generation:", error)
      triggerHapticIfEnabled(HapticPattern.ERROR)
      toast({
        title: "Error",
        description: "Failed to continue generation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [messages, chatId, mode, model, isLoading, settings])

  const handleSendMessage = useCallback(
    async (message: string, imageUrl?: string) => {
      if (!message.trim() && !imageUrl) return
      triggerHapticIfEnabled(HapticPattern.MEDIUM)

      // Store the user message for potential continuation
      setLastUserMessage(message)

      // Check usage limits
      const canSendMessage = await checkMessageLimit(auth.currentUser?.uid || null, isGuest)
      if (!canSendMessage) {
        triggerHapticIfEnabled(HapticPattern.ERROR)
        toast({
          title: "Daily limit reached",
          description: isGuest
            ? "You've reached the guest daily message limit. Sign in for more messages."
            : "You've reached your daily message limit. Try again tomorrow.",
          variant: "destructive",
        })
        return
      }

      // Format the message content to include the image if provided
      const messageContent = imageUrl
        ? `${message}

![Uploaded Image](${imageUrl})`
        : message

      // Add user message to the chat
      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: messageContent,
        timestamp: new Date().toISOString(),
      }

      // Update messages state with the new user message
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setIsLoading(true)

      let aiResponse = "" // Declare aiResponse here

      try {
        // Generate topic for new chats
        if (messages.length === 0) {
          const topic = await generateTopicFromMessage(message || "Image analysis")
          setChatTopic(topic)

          // Save topic
          if (auth.currentUser) {
            await setDoc(doc(db, "chats", chatId), {
              chatId,
              userId: auth.currentUser.uid,
              topic,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } else {
            localStorage.setItem(`topic_${chatId}`, topic)
          }
        }

        // Save message
        if (auth.currentUser) {
          try {
            if (isOnline()) {
              // Save to Firestore
              await saveMessage(chatId, auth.currentUser.uid, "user", messageContent)
              console.log(`Saved user message to Firestore for chat ${chatId}`)
            } else {
              // Store offline
              await storeMessageOffline({
                chatId,
                userId: auth.currentUser.uid,
                role: "user",
                content: messageContent,
                timestamp: new Date().toISOString(),
              })
              console.log(`Stored user message offline for chat ${chatId}`)
            }
          } catch (firestoreError) {
            console.error("Error saving message to Firestore:", firestoreError)
            // If Firestore save fails, try localStorage as fallback
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages))
          }
        } else {
          // For guest users, save to localStorage
          localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages))
        }

        // Generate AI response
        if (mode === "image" && !imageUrl) {
          // Check image generation limit
          const canGenerateImage = await checkImageLimit(auth.currentUser?.uid || null, isGuest)
          if (!canGenerateImage) {
            aiResponse =
              "You've reached your daily image generation limit. Please try again tomorrow or upgrade your account."
          } else {
            try {
              // Add a temporary message to show progress with more details
              const tempMessage = {
                id: uuidv4(),
                role: "assistant",
                content: `Generating image with ${aiHordeModel}... (0%)

This may take a few minutes depending on queue size and worker availability.`,
                timestamp: new Date().toISOString(),
              }
              setMessages((prev) => [...prev, tempMessage])

              // Generate image with AI Horde
              const generatedImageUrl = await generateImage(
                message, // Use the user's message as the prompt
                aiHordeModel,
                512, // width
                512, // height
                30, // steps
                (progress) => {
                  // Update progress in the temporary message with more details
                  setImageGenerationProgress(progress)
                  setMessages((prev) => {
                    const updatedMessages = [...prev]
                    const lastMessage = updatedMessages[updatedMessages.length - 1]
                    if (lastMessage.role === "assistant") {
                      const statusMessage =
                        progress < 10
                          ? "Waiting in queue..."
                          : progress < 30
                            ? "Starting generation..."
                            : progress < 70
                              ? "Creating your image..."
                              : "Finalizing image..."

                      lastMessage.content = `Generating image with ${aiHordeModel}... (${progress}%)
     
${statusMessage}`
                    }
                    return updatedMessages
                  })
                },
              )

              // Create the final response with the generated image
              aiResponse = `Here's your generated image using ${aiHordeModel}:

![Generated Image](${generatedImageUrl})`
            } catch (error) {
              console.error("Error generating image:", error)
              triggerHapticIfEnabled(HapticPattern.ERROR)

              // Provide a more detailed error message
              let errorMessage = "I'm sorry, there was an error generating the image. Please try again later."

              if (error instanceof Error) {
                if (error.message.includes("401")) {
                  errorMessage =
                    "Authentication error with the image generation service. Using anonymous access which may have longer wait times."
                } else if (error.message.includes("timeout")) {
                  errorMessage =
                    "The image generation timed out. The service might be busy. Please try again later with a simpler prompt."
                } else if (error.message.includes("No generations found")) {
                  errorMessage =
                    "The image generation service couldn't create an image for your prompt. Please try a different description."
                }
              }

              aiResponse = errorMessage
            }
          }
        } else {
          // Use our improved API client for text generation or image analysis
          try {
            const systemPrompt = getSystemPrompt(mode, !!imageUrl)

            // For image analysis, use the specialized function
            if (imageUrl) {
              aiResponse = await analyzeImage(message, imageUrl)
            } else {
              // For regular text generation, prepare the message history
              const messageHistory = updatedMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }))

              const messagesForAPI = await conversationContext.prepareMessagesForAI(
                messageHistory,
                chatId,
                systemPrompt,
                mode,
              )

              aiResponse = await generateAIResponse(model, messagesForAPI, systemPrompt)
            }
          } catch (error) {
            console.error("Error generating AI response:", error)
            triggerHapticIfEnabled(HapticPattern.ERROR)

            if (error instanceof Error && error.message.includes("Rate limit")) {
              toast({
                title: "Rate limit reached",
                description: "You've reached the daily limit for this AI model. Trying a different model...",
                variant: "warning",
              })

              // Try with a different model
              try {
                const systemPrompt = getSystemPrompt(mode, !!imageUrl)
                const messageHistory = updatedMessages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                }))

                // Use DeepSeek as fallback
                aiResponse = await generateAIResponse(
                  "deepseek/deepseek-chat-v3-0324:free",
                  messageHistory,
                  systemPrompt,
                )
              } catch (fallbackError) {
                aiResponse =
                  "I'm sorry, I encountered a rate limit error. Please try again later or try a different model."
              }
            } else {
              aiResponse =
                "I'm sorry, I encountered an error while generating a response. Please try again later or try a different model."
            }
          }
        }

        // If we're in image generation mode and there was a temporary progress message, remove it
        if (mode === "image" && !imageUrl && imageGenerationProgress > 0) {
          setMessages((prev) => prev.slice(0, -1)) // Remove the last message (progress message)
          setImageGenerationProgress(0)
        }

        // Add AI response to chat
        const assistantMessage = {
          id: uuidv4(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        }

        const finalMessages = [...updatedMessages, assistantMessage]
        setMessages(finalMessages)
        triggerHapticIfEnabled(HapticPattern.SUCCESS)

        // Save AI response
        if (auth.currentUser) {
          try {
            if (isOnline()) {
              // Save to Firestore
              await saveMessage(chatId, auth.currentUser.uid, "assistant", aiResponse)
            } else {
              // Store offline
              await storeMessageOffline({
                chatId,
                userId: auth.currentUser.uid,
                role: "assistant",
                content: aiResponse,
                timestamp: new Date().toISOString(),
              })
            }
          } catch (firestoreError) {
            console.error("Error saving AI response to Firestore:", firestoreError)
            // If Firestore save fails, try localStorage as fallback
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(finalMessages))
          }
        } else {
          localStorage.setItem(`chat_${chatId}`, JSON.stringify(finalMessages))
        }

        setContextInfo({
          messageCount: finalMessages.length,
          isUsingSummary: finalMessages.length > 20,
          contextSize: Math.min(finalMessages.length, 20),
        })
      } catch (error) {
        console.error("Error sending message:", error)
        triggerHapticIfEnabled(HapticPattern.ERROR)
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [messages, chatId, mode, model, aiHordeModel, isGuest, chatTopic, imageGenerationProgress, settings],
  )

  const showContinueButton = useMemo(() => {
    if (messages.length === 0 || isLoading) return false
    // Only show if the last message is from the assistant
    const lastMessage = messages[messages.length - 1]
    return lastMessage && lastMessage.role === "assistant"
  }, [messages, isLoading])

  // Add this function to handle the Alt+C keyboard shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+C to continue generation
      if (e.altKey && e.key === "c" && showContinueButton && !isLoading) {
        e.preventDefault()
        handleContinueGeneration()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleContinueGeneration, showContinueButton, isLoading])

  // Add this function after the other useEffect hooks
  useEffect(() => {
    if (isMobile) {
      const handleVisualViewportResize = () => {
        // When keyboard is dismissed (viewport height increases back to full height)
        if (window.visualViewport && window.innerHeight - window.visualViewport.height < 100) {
          // Small delay to ensure content has settled
          setTimeout(() => {
            // Scroll to the bottom of messages if we were near the bottom already
            const chatContainer = document.querySelector(".overflow-y-auto")
            if (chatContainer) {
              const { scrollTop, scrollHeight, clientHeight } = chatContainer as HTMLElement
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

              if (isNearBottom) {
                chatContainer.scrollTop = scrollHeight
              }
            }
          }, 100)
        }
      }

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleVisualViewportResize)
        return () => window.visualViewport?.removeEventListener("resize", handleVisualViewportResize)
      }
    }
  }, [isMobile])

  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Load chat history if chatId is provided
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !user) return

      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId))

        if (chatDoc.exists() && chatDoc.data().userId === user.uid) {
          setChatTopic(chatDoc.data().topic || "Chat")

          const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))

          const messagesSnapshot = await getDocs(messagesQuery)
          const loadedMessages = messagesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          setMessages(loadedMessages)
        } else {
          // Chat doesn't exist or doesn't belong to user
          router.push("/chat")
        }
      } catch (error) {
        console.error("Error loading chat:", error)
      }
    }

    loadChat()
  }, [chatId, user, router])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage2 = async (message: string) => {
    if (!message.trim()) return

    const newMessage = {
      id: uuidv4(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    try {
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: uuidv4(),
          content: `I received your message: "${message}"\n\nThis is a simulated response. In the real app, this would be a response from the AI model.`,
          role: "assistant",
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)
      setIsLoading(false)
    }
  }

  // In the return statement, add the BackgroundPath component right after the opening div
  // Update the main container div to include "relative" class
  return (
    <div className="flex h-screen bg-background relative" ref={containerRef}>
      <BackgroundPath />
      <ChatSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        chatId={chatId}
        setChatId={setChatId}
        setMessages={setMessages}
        onNewChat={handleNewChat}
        mode={mode}
        onModeChange={handleModeChange}
      />

      <div className="flex flex-1 flex-col">
        {/* Simplified Header - removed the mode selector */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:h-[60px]">
          <FeatureTooltip
            featureId="sidebar-toggle"
            content={<p>Access your chat history and settings here</p>}
            side="bottom"
          >
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </FeatureTooltip>

          <div className="flex-1 flex items-center gap-2">
            <Link href="/" className="text-xl font-semibold hover:text-sky-400 transition-colors">
              dot.ai
            </Link>
            <SearchDialog onSelectResult={handleSearchResult} />
          </div>

          {/* Display current mode in the header */}
          <div className="hidden md:flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {mode === "personal"
                ? "Assistant"
                : mode === "code"
                  ? "Code"
                  : mode === "research"
                    ? "Research"
                    : "Image"}{" "}
              Mode
            </span>
          </div>
        </header>

        {/* Status bar - keep the same */}
        <div className="bg-muted/30 border-b px-4 py-1 text-xs text-muted-foreground flex justify-center backdrop-blur-sm">
          {isGuest ? (
            <span>
              <span className="font-medium">Guest Mode</span> • {limits.DAILY_MESSAGES} messages/day •{" "}
              {limits.DAILY_IMAGES} images/day •{" "}
              <Link href="/signin" className="text-sky-400 hover:underline">
                Sign in
              </Link>{" "}
              for more features
            </span>
          ) : (
            <span>
              <span className="font-medium">Free Tier</span> • {limits.DAILY_MESSAGES} messages/day •{" "}
              {limits.DAILY_IMAGES} images/day • {limits.HISTORY_DAYS} days history •{" "}
              <Link href="/pricing" className="text-sky-400 hover:underline">
                Upgrade to Premium
              </Link>
            </span>
          )}
        </div>

        <AIDisclaimer />

        {/* Main content - keep the same */}
        <main className="flex-1 overflow-hidden px-2 md:px-4">
          <KeyboardSafeView bottomOffset={isIOS() ? 80 : 60}>
            <PullToRefresh onRefresh={handleRefresh} disabled={isLoading || isRefreshing}>
              <OptimizedMobileChatContainer messages={messages} isLoading={isLoading}>
                {mode === "image" && !imageUrl && <ImageModeInfo />}
                <ChatMessages
                  messages={messages}
                  isLoading={isLoading}
                  topic={chatTopic}
                  messagesEndRef={messagesEndRef}
                />
              </OptimizedMobileChatContainer>
            </PullToRefresh>
          </KeyboardSafeView>
        </main>

        {/* Footer - keep the same */}
        <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur p-4 safe-bottom">
          <div className="mb-2 flex items-center justify-between gap-2">
            <ContextIndicator messageCount={contextInfo.messageCount} isUsingSummary={contextInfo.isUsingSummary} />
            <div className="flex items-center gap-2">
              {showContinueButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleContinueGeneration}
                  disabled={isLoading}
                  className="text-xs flex items-center gap-1 hidden sm:flex rounded-full border-sky-400 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                >
                  Continue generation
                  <span className="text-muted-foreground text-xs">(Alt+C)</span>
                </Button>
              )}

              {messages.length > 0 && <ExportDialog messages={messages} chatTopic={chatTopic} />}
            </div>
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            mode={mode}
            messages={messages}
            sendWithEnter={settings.sendWithEnter}
          />
        </footer>
      </div>

      {/* Remove MobileBottomNav since we moved the mode selector to the sidebar */}

      {/* Interactive tutorial - only show on desktop */}
      <div className="hidden md:block">
        <InteractiveTutorial />
      </div>
    </div>
  )
}
