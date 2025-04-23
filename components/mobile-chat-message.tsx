"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ReactMarkdown } from "react-markdown"
import { Copy, Check, Share, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, AlertCircle, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSwipe } from "@/hooks/use-swipe"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useSettings } from "@/lib/settings-context"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MobileChatMessageProps {
  message: any
  onCopy: (text: string) => void
  onBookmark: (messageId: string) => void
  onShare: (messageId: string) => void
  onFeedback: (messageId: string, isPositive: boolean) => void
  bookmarkedMessages: Set<string>
}

export function MobileChatMessage({
  message,
  onCopy,
  onBookmark,
  onShare,
  onFeedback,
  bookmarkedMessages,
}: MobileChatMessageProps) {
  const [isActionsVisible, setIsActionsVisible] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [expandedCodeBlock, setExpandedCodeBlock] = useState<string | null>(null)

  const isBookmarked = bookmarkedMessages.has(message.id)

  // Use the swipe hook
  useSwipe(messageRef, {
    onSwipeLeft: () => setIsActionsVisible(true),
    onSwipeRight: () => setIsActionsVisible(false),
  })

  // Handle copy
  const handleCopy = () => {
    onCopy(message.content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Handle bookmark
  const handleBookmark = () => {
    onBookmark(message.id)
  }

  // Handle share
  const handleShare = () => {
    onShare(message.id)
  }

  // Handle feedback
  const handleFeedback = (isPositive: boolean) => {
    onFeedback(message.id, isPositive)
  }

  // Handle image error
  const handleImageError = (src: string) => {
    setImageErrors((prev) => ({ ...prev, [src]: true }))
  }

  // Toggle code block expansion
  const toggleCodeBlock = (codeId: string) => {
    if (expandedCodeBlock === codeId) {
      setExpandedCodeBlock(null)
    } else {
      setExpandedCodeBlock(codeId)
    }
  }

  return (
    <div
      ref={messageRef}
      className={cn(
        "relative flex items-start gap-2 transition-all duration-200 ease-in-out touch-pan-y p-2 rounded-lg mb-2",
        isActionsVisible ? "transform -translate-x-20" : "",
        message.role === "user" ? "flex-row-reverse" : "",
        message.role === "user" ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-900/20",
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn("flex-1 overflow-hidden", message.role === "user" ? "text-right" : "text-left")}>
        {/* Timestamp */}
        {settings.showTimestamps && message.timestamp && (
          <div className="text-xs text-muted-foreground mb-1">{format(new Date(message.timestamp), "h:mm a")}</div>
        )}

        {/* Content */}
        <div
          className={cn("prose prose-sm dark:prose-invert max-w-none", message.role === "user" ? "ml-auto" : "mr-auto")}
        >
          <ReactMarkdown
            components={{
              img: ({ node, ...props }) => {
                if (!props.src) return null
                if (imageErrors[props.src]) {
                  return (
                    <div className="flex items-center justify-center h-32 bg-muted/30 rounded-md border border-border my-2">
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Image could not be loaded</p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="my-2">
                    <div className="relative rounded-md overflow-hidden border border-border bg-muted/30">
                      <img
                        {...props}
                        alt={props.alt || "Image"}
                        loading="lazy"
                        onError={() => handleImageError(props.src!)}
                        className="max-w-full rounded-md object-contain max-h-64 mx-auto"
                      />
                    </div>
                  </div>
                )
              },
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
                const isExpanded = expandedCodeBlock === codeId

                if (!inline && match) {
                  return (
                    <div className="relative my-4 rounded-md overflow-hidden border border-border">
                      <div className="flex items-center justify-between bg-muted px-3 py-1.5 text-xs">
                        <span className="font-mono text-muted-foreground">{match[1]}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleCodeBlock(codeId)}
                          >
                            <Code className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ""))
                              setIsCopied(true)
                              setTimeout(() => setIsCopied(false), 2000)
                            }}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "overflow-auto transition-all duration-200",
                          isExpanded ? "max-h-[80vh]" : "max-h-[200px]",
                        )}
                      >
                        <SyntaxHighlighter
                          language={match[1]}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            fontSize: "0.875rem",
                            backgroundColor: "var(--code-bg)",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )
                }

                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Swipe actions */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full flex items-center gap-1 transition-opacity",
          isActionsVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBookmark}>
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
          <Share className="h-4 w-4" />
        </Button>
        {message.role === "assistant" && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFeedback(true)}>
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFeedback(false)}>
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
