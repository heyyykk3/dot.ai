"use client"
import { MessageSquare } from "lucide-react"

interface ContextIndicatorProps {
  messageCount: number
  isUsingSummary: boolean
  contextSize?: number
}

export function ContextIndicator({ messageCount, isUsingSummary, contextSize = 0 }: ContextIndicatorProps) {
  if (messageCount === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <MessageSquare className="h-3 w-3" />
      <span>
        {isUsingSummary
          ? `AI has context of all ${messageCount} messages (using summary + recent messages)`
          : `AI has full context of all ${messageCount} messages`}
      </span>
    </div>
  )
}
