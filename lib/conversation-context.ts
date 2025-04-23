// Maximum number of messages to include in context
const MAX_CONTEXT_MESSAGES = 25

// Maximum number of tokens for summary
const MAX_SUMMARY_TOKENS = 800

// Cache for conversation summaries
const summaryCache: Record<string, { summary: string; timestamp: number }> = {}

// Cache validity period in milliseconds (20 minutes)
const CACHE_VALIDITY_PERIOD = 20 * 60 * 1000

// Interface for message
interface Message {
  role: string
  content: string
}

// Function to extract image URLs from message content
function extractImageUrls(content: string): string[] {
  const regex = /!\[.*?\]$$(.*?)$$/g
  const urls: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1])
  }

  return urls
}

// Maximum number of messages to include in the full context
// const MAX_CONTEXT_MESSAGES = 20

// Maximum number of tokens to include in the context (approximate)
const MAX_CONTEXT_TOKENS = 4000

// Interface for conversation summary
interface ConversationSummary {
  summary: string
  lastUpdated: number // timestamp
  messageCount: number
}

/**
 * Estimates the number of tokens in a text
 * This is a rough approximation (4 chars ≈ 1 token)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Manages conversation context and history
 */
export class ConversationContextManager {
  private summaryCache: Map<string, ConversationSummary> = new Map()

  /**
   * Prepares messages for the AI, including context management
   */
  async prepareMessagesForAI(messages: any[], chatId: string, systemPrompt: string, mode = "personal"): Promise<any[]> {
    if (!messages || messages.length === 0) {
      return [{ role: "system", content: systemPrompt }]
    }

    // If there are only a few messages, include them all
    if (messages.length <= MAX_CONTEXT_MESSAGES) {
      // Track all image URLs in the conversation for context
      const imageContext: Record<string, boolean> = {}

      messages.forEach((msg) => {
        const imageUrls = extractImageUrls(msg.content)
        imageUrls.forEach((url) => {
          imageContext[url] = true
        })
      })

      // Add image context to system prompt if images were shared
      let enhancedSystemPrompt = systemPrompt
      const imageUrls = Object.keys(imageContext)

      if (imageUrls.length > 0) {
        enhancedSystemPrompt += `\n\nThis conversation includes ${imageUrls.length} shared image(s). When referring to images, be specific about which image you're discussing.`
      }

      return [{ role: "system", content: enhancedSystemPrompt }, ...messages]
    }

    // For longer conversations, use a summary of earlier messages
    // Get or generate a summary of earlier messages
    const summary = await getOrGenerateSummary(messages.slice(0, messages.length - MAX_CONTEXT_MESSAGES), chatId, mode)

    // Include the summary and the most recent messages
    const recentMessages = messages.slice(messages.length - MAX_CONTEXT_MESSAGES)

    // Track all image URLs in recent messages
    const imageContext: Record<string, boolean> = {}
    recentMessages.forEach((msg) => {
      const imageUrls = extractImageUrls(msg.content)
      imageUrls.forEach((url) => {
        imageContext[url] = true
      })
    })

    // Add image context to system prompt
    let enhancedSystemPrompt = systemPrompt
    const imageUrls = Object.keys(imageContext)

    if (imageUrls.length > 0) {
      enhancedSystemPrompt += `\n\nThis conversation includes ${imageUrls.length} shared image(s) in the recent messages. When referring to images, be specific about which image you're discussing.`
    }

    return [
      { role: "system", content: enhancedSystemPrompt },
      { role: "system", content: `Previous conversation summary: ${summary}` },
      ...recentMessages,
    ]
  }

  /**
   * Generates a summary of the conversation history
   */
  private async generateConversationSummary(messages: any[]): Promise<string> {
    try {
      // Use our server-side API route instead of calling OpenRouter directly
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro-exp-03-25:free", // Use a fast model for summarization
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that summarizes conversations. Create a comprehensive summary of the key points discussed in the conversation so far. Focus on the main topics, questions, and information shared. Include important details that might be relevant for future reference.",
            },
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            // Add a final user message to ensure proper API format
            {
              role: "user",
              content: "Please summarize our conversation so far, including all important details and context.",
            },
          ],
          max_tokens: 500, // Increased from 300 to 500 for more detailed summaries
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || "No summary available."
    } catch (error) {
      console.error("Error generating conversation summary:", error)
      return "Unable to generate conversation summary."
    }
  }

  /**
   * Clears the summary cache for a specific chat
   */
  clearSummaryCache(chatId: string): void {
    this.summaryCache.delete(chatId)
  }

  /**
   * Clears the entire summary cache
   */
  clearAllSummaryCache(): void {
    this.summaryCache.clear()
  }
}

// Function to get or generate a summary of messages
async function getOrGenerateSummary(messages: Message[], chatId: string, mode: string): Promise<string> {
  // Check if we have a valid cached summary
  if (summaryCache[chatId] && Date.now() - summaryCache[chatId].timestamp < CACHE_VALIDITY_PERIOD) {
    return summaryCache[chatId].summary
  }

  // Generate a new summary
  const summary = await generateSummary(messages, mode)

  // Cache the summary
  summaryCache[chatId] = {
    summary,
    timestamp: Date.now(),
  }

  return summary
}

// Function to generate a summary of messages
async function generateSummary(messages: Message[], mode: string): Promise<string> {
  try {
    // For simplicity, we'll just concatenate the messages with a character limit
    // In a real implementation, you would use an AI model to generate a proper summary

    // Extract key information based on mode
    let summaryPrefix = "Previous conversation: "

    if (mode === "code") {
      summaryPrefix = "Previous code discussion: "
    } else if (mode === "research") {
      summaryPrefix = "Previous research discussion: "
    } else if (mode === "image") {
      summaryPrefix = "Previous image generation discussion: "
    }

    // Track image references
    const imageReferences: string[] = []
    messages.forEach((msg) => {
      const imageUrls = extractImageUrls(msg.content)
      if (imageUrls.length > 0) {
        const role = msg.role === "user" ? "User" : "AI"
        imageReferences.push(`${role} shared image(s)`)
      }
    })

    // Create a condensed version of the conversation
    let summary = messages
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "AI"
        // Truncate long messages
        let content = msg.content
        if (content.length > 100) {
          content = content.substring(0, 100) + "..."
        }
        return `${role}: ${content}`
      })
      .join("\n")

    // Truncate the overall summary if it's too long
    if (summary.length > MAX_SUMMARY_TOKENS) {
      summary = summary.substring(0, MAX_SUMMARY_TOKENS) + "..."
    }

    // Add image references if any
    if (imageReferences.length > 0) {
      summary += "\n\nImage context: " + imageReferences.join(", ")
    }

    return summaryPrefix + summary
  } catch (error) {
    console.error("Error generating summary:", error)
    return "Previous conversation unavailable."
  }
}

// Function to clear the summary cache for a chat
function clearSummaryCache(chatId: string): void {
  delete summaryCache[chatId]
}

// Export the conversation context functions
const prepareMessagesForAI = new ConversationContextManager().prepareMessagesForAI
export const conversationContext = {
  prepareMessagesForAI,
  clearSummaryCache,
}
