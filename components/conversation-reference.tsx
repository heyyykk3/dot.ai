"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Quote } from "lucide-react"

interface ConversationReferenceProps {
  messages: any[]
  onReferenceSelect: (reference: string) => void
}

export function ConversationReference({ messages, onReferenceSelect }: ConversationReferenceProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Only show if we have enough messages
  if (messages.length < 5) return null

  // Get user messages that can be referenced
  const referenceableMessages = messages.filter((msg) => msg.role === "user" && msg.content.length > 10).slice(-10) // Only show the last 10 referenceable messages

  // Get AI responses that can be referenced
  const referenceableResponses = messages.filter((msg) => msg.role === "assistant" && msg.content.length > 20).slice(-5) // Only show the last 5 referenceable responses

  const handleReferenceSelect = (content: string) => {
    // Create a reference snippet (truncate if too long)
    const snippet = content.length > 100 ? content.substring(0, 100) + "..." : content

    onReferenceSelect(`Referring to this earlier point: "${snippet}"`)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Quote className="h-4 w-4" />
          <span className="sr-only">Reference previous messages</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Reference earlier messages</h4>
          <p className="text-xs text-muted-foreground mt-1">Select a message to reference in your current response</p>
        </div>
        <ScrollArea className="h-60">
          <div className="p-3 space-y-4">
            {referenceableMessages.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Your messages</h5>
                <div className="space-y-2">
                  {referenceableMessages.map((msg, index) => (
                    <button
                      key={`user-${index}`}
                      className="w-full text-left p-2 text-xs rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                      onClick={() => handleReferenceSelect(msg.content)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px]">You</span>
                        </div>
                        <p className="line-clamp-2">{msg.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {referenceableResponses.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">AI responses</h5>
                <div className="space-y-2">
                  {referenceableResponses.map((msg, index) => (
                    <button
                      key={`ai-${index}`}
                      className="w-full text-left p-2 text-xs rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                      onClick={() => handleReferenceSelect(msg.content)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="h-3 w-3" />
                        </div>
                        <p className="line-clamp-2">{msg.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {referenceableMessages.length === 0 && referenceableResponses.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No messages to reference yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
