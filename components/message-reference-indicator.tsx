"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"

interface MessageReferenceIndicatorProps {
  content: string
  messages: any[]
}

export function MessageReferenceIndicator({ content, messages }: MessageReferenceIndicatorProps) {
  const [referencedMessage, setReferencedMessage] = useState<any | null>(null)

  useEffect(() => {
    // Check if this message references a previous message
    const referenceMatch = content.match(/Referring to this earlier point: "([^"]+)"/i)

    if (referenceMatch && referenceMatch[1]) {
      const referenceText = referenceMatch[1]

      // Find the message that contains this text
      const foundMessage = messages.find((msg) => msg.content.includes(referenceText.replace("...", "")))

      if (foundMessage) {
        setReferencedMessage(foundMessage)
      }
    }
  }, [content, messages])

  if (!referencedMessage) return null

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      <ArrowUpRight className="h-3 w-3" />
      <span>Referencing earlier message</span>
    </div>
  )
}
