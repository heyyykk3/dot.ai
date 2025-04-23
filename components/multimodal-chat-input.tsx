"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, X, Loader2, Keyboard, FileText, Mic, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConversationReference } from "@/components/conversation-reference"
import { UserPreferencesDialog } from "@/components/user-preferences-dialog"
import { processFiles, type FileMetadata } from "@/lib/multimodal-handler"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useSettings } from "@/lib/settings-context"

interface MultimodalChatInputProps {
  onSendMessage: (message: string, files: FileMetadata[]) => void
  isLoading: boolean
  mode: string
  messages: any[]
}

export function MultimodalChatInput({ onSendMessage, isLoading, mode, messages }: MultimodalChatInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { settings } = useSettings()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + "px"
    }
  }, [message])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if ((message.trim() || files.length > 0) && !isLoading && !isUploading) {
        onSendMessage(message, files)
        setMessage("")
        setFiles([])
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "56px"
        }
      }
    },
    [message, files, isLoading, isUploading, onSendMessage],
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
        setFiles([])
        textareaRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSubmit, showKeyboardShortcuts])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && settings.sendWithEnter) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const selectedFiles = Array.from(e.target.files)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const processedFiles = await processFiles(selectedFiles, setUploadProgress)
      setFiles((prev) => [...prev, ...processedFiles])
    } catch (error) {
      console.error("Error processing files:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const startRecording = () => {
    // In a real implementation, you would use the Web Speech API
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
      setMessage((prev) => prev + " [Voice transcription would appear here]")
    }, 2000)
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
      placeholder = "Describe the image you want to generate... (Ctrl+Enter to send)"
      break
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {files.length > 0 && (
        <div className="mb-2">
          <ScrollArea className="h-24 w-full rounded-md border">
            <div className="p-2 flex flex-wrap gap-2">
              {files.map((file) => (
                <div key={file.id} className="relative rounded-md border p-2 flex items-center gap-2 bg-muted/30">
                  {file.type === "image" && (
                    <img
                      src={file.url || "/placeholder.svg"}
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  )}
                  {file.type === "pdf" && <FileText className="h-12 w-12 text-primary" />}
                  {file.type === "audio" && <Mic className="h-12 w-12 text-primary" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {file.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isUploading && (
        <div className="mb-2 p-2 border rounded-md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm">Uploading files...</span>
            <span className="text-sm">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,application/pdf,audio/*"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isUploading}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add files</span>
        </Button>

        <ConversationReference
          messages={messages}
          onReferenceSelect={(reference) => setMessage((prev) => (prev ? `${prev}\n\n${reference}` : reference))}
        />

        <UserPreferencesDialog />

        <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowKeyboardShortcuts(true)}
            >
              <Keyboard className="h-4 w-4" />
              <span className="sr-only">Keyboard shortcuts</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
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

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || isUploading}
            className="min-h-[56px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={(message.trim() === "" && files.length === 0) || isLoading || isUploading}
            className="absolute bottom-1 right-1 h-8 w-8"
          >
            {isLoading || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
