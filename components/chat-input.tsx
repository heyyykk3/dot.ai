"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ImagePlus, X, Loader2, AlertCircle, Keyboard } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// Import the conversation reference component
import { ConversationReference } from "@/components/conversation-reference"
import { toast } from "@/components/ui/use-toast"

// Update the ChatInputProps interface
interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void
  isLoading: boolean
  mode: string
  messages: any[]
  sendWithEnter?: boolean // Add this prop
}

// Update the component to receive the sendWithEnter prop
export function ChatInput({ onSendMessage, isLoading, mode, messages, sendWithEnter = true }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Add a responsive height adjustment for mobile
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to avoid continuous growth
      textareaRef.current.style.height = "56px"

      // Set height based on content
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, window.innerHeight * 0.3)}px`
    }
  }, [message])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if ((message.trim() || imageUrl) && !isLoading && !isUploading) {
        // Add a special loading message for code mode
        if (mode === "code") {
          toast({
            title: "Generating code",
            description: "Code generation may take a moment. Please be patient.",
            duration: 3000,
          })
        }

        onSendMessage(message, imageUrl || undefined)
        setMessage("")
        setImageUrl(null)
        setImageError(false)
        setShowImageUpload(false)
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "56px"
        }
      }
    },
    [message, imageUrl, isLoading, isUploading, onSendMessage, mode, toast],
  )

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (document.activeElement === textareaRef.current) {
          e.preventDefault()
          handleSubmit(new Event("submit") as any)
        }
      }

      // Ctrl+/ or Cmd+/ to show keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }

      // Escape to close keyboard shortcuts dialog
      if (e.key === "Escape" && showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false)
      }

      // Alt+N to start new chat
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        // Clear the input and focus
        setMessage("")
        setImageUrl(null)
        textareaRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSubmit, showKeyboardShortcuts])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && sendWithEnter) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
    setImageError(false)
    setShowImageUpload(false)
    console.log("Image uploaded successfully:", url.substring(0, 50) + "...")
  }

  const cancelImageUpload = () => {
    setImageUrl(null)
    setImageError(false)
    setShowImageUpload(false)
  }

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl)
    setImageError(true)
  }

  // Add a function to handle reference selection
  const handleReferenceSelect = (reference: string) => {
    setMessage((prev) => {
      // If there's already text, add the reference on a new line
      if (prev.trim()) {
        return `${prev}\n\n${reference}`
      }
      return reference
    })

    // Focus the textarea after adding the reference
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
  }

  let placeholder = "Message dot.ai... (Ctrl+Enter to send)"

  switch (mode) {
    case "code":
      placeholder = "Ask about code, programming, or development... (Ctrl+Enter to send)"
      break
    case "research":
      placeholder = "Ask a research question or request information... (Ctrl+Enter to send)"
      break
    case "image":
      placeholder = imageUrl
        ? "Ask about this image or describe what you want to know... (Ctrl+Enter to send)"
        : "Describe the image you want to generate... (Ctrl+Enter to send)"
      break
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {imageUrl && (
        <div className="mb-3 relative">
          <div className="relative rounded-xl overflow-hidden border border-sky-200 dark:border-sky-800/50 shadow-sm">
            {imageError ? (
              <div className="flex items-center justify-center h-32 bg-muted/30 p-4">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">Image preview not available</p>
                </div>
              </div>
            ) : (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Uploaded"
                className="max-h-32 w-full object-contain"
                onError={handleImageError}
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={cancelImageUpload}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showImageUpload && !imageUrl && (
        <div className="mb-3">
          <ImageUpload
            onImageUpload={handleImageUpload}
            onCancel={cancelImageUpload}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-sky-100 dark:border-sky-900/50 p-1 transition-all">
        <div className="flex items-end gap-1">
          <div className="flex items-center gap-1 px-2">
            {!showImageUpload && mode !== "image" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                onClick={() => setShowImageUpload(true)}
                disabled={isLoading}
              >
                <ImagePlus className="h-4 w-4" />
                <span className="sr-only">Upload image</span>
              </Button>
            )}

            <ConversationReference messages={messages} onReferenceSelect={handleReferenceSelect} />

            <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                  onClick={() => setShowKeyboardShortcuts(true)}
                >
                  <Keyboard className="h-4 w-4" />
                  <span className="sr-only">Keyboard shortcuts</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  <DialogDescription>
                    Use these keyboard shortcuts to navigate the application more efficiently.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <div className="font-medium">Ctrl+Enter</div>
                    <div className="text-sm text-muted-foreground">Send message</div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <div className="font-medium">Alt+N</div>
                    <div className="text-sm text-muted-foreground">Clear input</div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <div className="font-medium">Ctrl+/</div>
                    <div className="text-sm text-muted-foreground">Show keyboard shortcuts</div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <div className="font-medium">Esc</div>
                    <div className="text-sm text-muted-foreground">Close dialogs</div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading || isUploading}
              className="min-h-[56px] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2 pr-12 text-sm ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontSize: "16px" }} // Prevents iOS zoom on focus
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!message.trim() && !imageUrl) || isLoading || isUploading}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-sky-400 hover:bg-sky-500 text-white shadow-sm"
            >
              {isLoading || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-1 text-xs text-center text-muted-foreground">
        {mode === "personal" ? "Assistant" : mode === "code" ? "Code" : mode === "research" ? "Research" : "Image"} mode
        • {sendWithEnter ? "Press Enter to send" : "Press Ctrl+Enter to send"}
      </div>
    </form>
  )
}
