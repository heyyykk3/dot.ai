"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Copy, Check, AlertCircle, Eye, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { MessageReferenceIndicator } from "@/components/message-reference-indicator"
import { OptimizedImage } from "@/components/optimized-image"
import { useSettings } from "@/lib/settings-context"
import { wrapUrl } from "@/lib/url-utils"

interface ChatMessagesProps {
  messages: any[]
  isLoading: boolean
  topic?: string
  messagesEndRef?: React.RefObject<HTMLDivElement>
}

interface MediaItem {
  type: "image" | "text"
  content: string
}

// URL Display Component
const UrlDisplay = ({ url }: { url: string }) => {
  const lines = wrapUrl(url, 30)

  return (
    <div className="text-xs text-muted-foreground break-all">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
}

// Function to render media items
const renderMediaItem = (
  item: MediaItem,
  messageId: string,
  index: number,
  imageErrors: Record<string, boolean>,
  handleImageError: (src: string) => void,
) => {
  if (item.type === "image") {
    if (imageErrors[item.content]) {
      return (
        <div
          key={`${messageId}-${index}`}
          className="flex items-center justify-center h-32 bg-muted/30 rounded-md border border-border my-2"
        >
          <div className="text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Image could not be loaded</p>
          </div>
        </div>
      )
    }

    return (
      <div key={`${messageId}-${index}`} className="my-2">
        <div className="relative rounded-md overflow-hidden border border-border bg-muted/30">
          <OptimizedImage
            src={item.content}
            alt="Uploaded"
            className="object-contain max-h-64 w-full rounded-md"
            onError={() => handleImageError(item.content)}
          />
        </div>
        <div className="mt-1 flex items-center gap-1">
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <UrlDisplay url={item.content} />
          </a>
        </div>
      </div>
    )
  } else if (item.type === "text") {
    return (
      <ReactMarkdown
        key={`${messageId}-${index}`}
        unwrapDisallowed
        components={{
          p: ({ node, ...props }) => <div className="mb-2" {...props} />,
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "")
            if (inline) return <code className={className}>{children}</code>
            return (
              <div className="relative">
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm max-h-[400px]">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          img: ({ src, alt, ...props }) => (
            <div className="my-2">
              <OptimizedImage
                src={src || ""}
                alt={alt || "Image"}
                className="object-contain max-h-64 w-full rounded-md border border-border"
              />
              {src && (
                <div className="mt-1 flex items-center gap-1">
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <UrlDisplay url={src} />
                  </a>
                </div>
              )}
            </div>
          ),
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-words"
              {...props}
            >
              {children}
              {href && (
                <span className="inline-flex items-center ml-1">
                  <ExternalLink className="h-3 w-3" />
                </span>
              )}
            </a>
          ),
        }}
      >
        {item.content}
      </ReactMarkdown>
    )
  }
  return null
}

// Function to render the chat message content
const renderMessageContent = (
  message: any,
  imageErrors: Record<string, boolean>,
  handleImageError: (src: string) => void,
) => {
  // Check if the message content is already an array of media items
  const mediaItems: MediaItem[] = Array.isArray(message.content)
    ? message.content
    : [{ type: "text", content: message.content }]

  return mediaItems.map((item, index) => renderMediaItem(item, message.id, index, imageErrors, handleImageError))
}

export function ChatMessages({ messages, isLoading, topic = "New Chat", messagesEndRef }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef<number>(0)

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [copiedSnippets, setCopiedSnippets] = useState<Record<string, boolean>>({})
  const [isRaw, setIsRaw] = useState<Record<string, boolean>>({})
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [expandedCode, setExpandedCode] = useState<Record<string, boolean>>({})
  const { settings } = useSettings()

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
      setTimeout(() => (containerRef.current!.scrollTop = containerRef.current!.scrollHeight), 300)
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages.length])

  const handleImageError = useCallback((src: string) => {
    setImageErrors((prev) => ({ ...prev, [src]: true }))
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippets((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => setCopiedSnippets((prev) => ({ ...prev, [id]: false })), 2000)
    })
  }

  const toggleRaw = (id: string) => setIsRaw((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleCodeExpand = (id: string) => setExpandedCode((prev) => ({ ...prev, [id]: !prev[id] }))

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage(text)
      setTimeout(() => setCopiedMessage(null), 2000)
    })
  }

  // Extract code blocks from message content
  const extractCodeBlocks = (content: string): { language: string; code: string }[] => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const codeBlocks: { language: string; code: string }[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || "text",
        code: match[2],
      })
    }

    return codeBlocks
  }

  // Custom renderer for code blocks
  const renderCodeBlock = (code: string, language: string, messageId: string, index: number) => {
    const blockId = `${messageId}-code-${index}`
    const isExpanded = expandedCode[blockId] || false

    return (
      <div key={blockId} className="relative mt-2 mb-4">
        <div className="flex items-center justify-between bg-muted/80 rounded-t-lg px-3 py-1 text-xs">
          <div className="font-mono">{language}</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => toggleCodeExpand(blockId)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(code, blockId)}
              title="Copy code"
            >
              {copiedSnippets[blockId] ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <pre
          className={`overflow-x-auto rounded-b-lg bg-muted p-4 text-sm ${isExpanded ? "max-h-none" : "max-h-[300px]"}`}
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    )
  }

  // Custom message renderer with better code block handling
  const renderMessage = (msg: any) => {
    if (isRaw[msg.id]) {
      return <pre className="text-xs whitespace-pre-wrap break-all">{msg.content}</pre>
    }

    // Check if the message contains code blocks
    const codeBlocks = extractCodeBlocks(msg.content)

    if (codeBlocks.length > 0) {
      // Split content by code blocks
      const parts = msg.content.split(/```(\w+)?\n[\s\S]*?```/)
      const result: React.ReactNode[] = []

      let codeBlockIndex = 0

      parts.forEach((part: string, index: number) => {
        if (part.trim()) {
          if (index % 2 === 0) {
            // Text content
            result.push(
              <ReactMarkdown
                key={`${msg.id}-text-${index}`}
                unwrapDisallowed
                components={{
                  p: ({ node, ...props }) => <div className="mb-2" {...props} />,
                  img: ({ src, alt, ...props }) => (
                    <div className="my-2">
                      <OptimizedImage
                        src={src || ""}
                        alt={alt || "Image"}
                        className="object-contain max-h-64 w-full rounded-md border border-border"
                      />
                      {src && (
                        <div className="mt-1 flex items-center gap-1">
                          <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <UrlDisplay url={src} />
                          </a>
                        </div>
                      )}
                    </div>
                  ),
                  a: ({ node, href, children, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-words"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {part}
              </ReactMarkdown>,
            )
          } else {
            // This is a marker for a code block, we'll skip it
            // The actual code blocks are rendered separately
          }
        }

        // After each text part, add a code block if available
        if (index % 2 === 0 && codeBlockIndex < codeBlocks.length) {
          result.push(
            renderCodeBlock(
              codeBlocks[codeBlockIndex].code,
              codeBlocks[codeBlockIndex].language,
              msg.id,
              codeBlockIndex,
            ),
          )
          codeBlockIndex++
        }
      })

      return result
    }

    // If no code blocks, render normally
    return renderMessageContent(msg, imageErrors, handleImageError)
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-bold">{topic}</h2>
          <p className="mt-2 text-muted-foreground">
            Your all-in-one AI assistant powered by free AI models. Start by sending a message below.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {topic !== "New Chat" && (
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">{topic}</h2>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
          maxHeight: "calc(100vh - 240px)", // Fixed height
          height: "calc(100vh - 240px)", // Fixed height
        }}
      >
        <div className="pb-4 px-2">
          {messages.map((msg, i) => {
            if (!msg) return null
            return (
              <div key={msg.id} className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[80%]">
                  {msg.role === "assistant" && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`message ${
                      msg.role === "user"
                        ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30"
                        : "bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/30"
                    } rounded-2xl p-4 shadow-sm text-sm prose prose-sm dark:prose-invert overflow-hidden max-w-full`}
                  >
                    {msg.role === "assistant" && (
                      <MessageReferenceIndicator content={msg.content} messages={messages} />
                    )}

                    <div className="overflow-hidden">{renderMessage(msg)}</div>

                    <div className="flex items-center gap-2 mt-1">
                      <Button size="xs" variant="ghost" onClick={() => toggleRaw(msg.id)}>
                        {isRaw[msg.id] ? "Rendered" : "Raw"}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => copyMessage(msg.content)}>
                        {copiedMessage === msg.content ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{" "}
                        Copy
                      </Button>
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-2">
                <Avatar className="h-6 w-6 mt-1">
                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground animate-pulse mt-3">AI is thinking...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} data-scroll-marker="true" />
        </div>
      </div>
    </div>
  )
}
