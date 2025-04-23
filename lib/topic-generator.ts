/**
 * Enhanced topic generator with fallback system
 * Generates a concise topic from a chat message with robust error handling
 */
export async function generateTopicFromMessage(message: string): Promise<string> {
  const truncated = message.length > 200 ? message.slice(0, 200) + "..." : message

  // Improved system prompt for better topic generation
  const systemPrompt =
    "You are a topic extraction specialist. Generate a short, clear topic (3-5 words) that accurately summarizes this chat message. Focus on the main subject or question."
  const userPrompt = `Chat message: "${truncated}"`

  try {
    // Use our unified AI endpoint with fallback capabilities
    const response = await fetch("/api/unified-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt,
        mode: "chat", // Use chat mode for topic generation
        max_tokens: 16, // Keep response short
        temperature: 0.3, // Lower temperature for more focused responses
        priority: "speed", // Prioritize speed for topic generation
      }),
    })

    if (!response.ok) {
      console.warn(`Topic generation API error: ${response.status}`)
      return fallbackTopic(truncated)
    }

    const data = await response.json()
    const raw = data.text || ""
    const cleaned = sanitizeTopic(raw)
    return cleaned || fallbackTopic(truncated)
  } catch (err) {
    console.error("Topic generation failed:", err)
    return fallbackTopic(truncated)
  }
}

/**
 * Clean and format topic string
 * Removes quotes, trailing periods, and trims whitespace
 */
function sanitizeTopic(input: string): string {
  return input
    .replace(/["'\\]/g, "") // Remove quotes
    .replace(/[.]+$/, "") // Remove trailing periods
    .replace(/^Topic:?\s*/i, "") // Remove "Topic:" prefix if present
    .trim()
    .slice(0, 30) // Limit length
}

/**
 * Enhanced fallback topic generator
 * Creates a topic from the first few meaningful words in the message
 */
function fallbackTopic(message: string): string {
  // Filter out common stop words and short words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "has",
    "have",
    "had",
    "be",
    "been",
    "being",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "can",
    "could",
    "may",
    "might",
    "must",
    "for",
    "of",
    "to",
    "in",
    "on",
    "at",
    "by",
    "with",
    "about",
  ])

  // Split into words, filter out stop words and short words, take first 5
  const words = message.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()))

  // Take up to 5 meaningful words
  const result = words.slice(0, 5).join(" ").trim()

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1).slice(0, 30)
}
