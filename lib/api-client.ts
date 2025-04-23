import type { AIMode } from "./ai-providers/provider-interface"

export function getOpenRouterHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.error("OpenRouter API key is missing. Please check your environment variables.")
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://dot.ai", // Add your domain for better request tracking
    "X-Title": "dot.ai", // Add your app name for better request tracking
  }
}

// Function to check OpenRouter status
export async function checkOpenRouterStatus(): Promise<boolean> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: getOpenRouterHeaders(),
    })

    return response.ok
  } catch (error) {
    console.error("Error checking OpenRouter status:", error)
    return false
  }
}

// Function to generate text with robust error handling and retries
export async function generateAIResponse(
  model: string,
  messages: any[],
  systemPrompt: string,
  maxRetries = 3,
): Promise<string> {
  // Determine the mode based on the model or messages
  const mode = determineMode(model, messages)

  // Extract the prompt from messages
  const prompt = extractPromptFromMessages(messages)

  try {
    // Use our unified API route
    const response = await fetch("/api/unified-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        mode,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error(`API error (${response.status}):`, errorData.error)
      return `I couldn't generate a response. Error: ${errorData.error || "Unknown error"}`
    }

    const data = await response.json()
    return data.text || "I couldn't generate a response."
  } catch (error) {
    console.error("Error generating AI response:", error)
    return `I couldn't generate a response. Error: ${(error as Error).message}`
  }
}

// Function to determine the mode based on model or messages
function determineMode(model: string, messages: any[]): AIMode {
  // Check if model name contains indicators
  if (model.includes("code") || model.includes("starcoder") || model.includes("CodeLlama")) {
    return "code"
  }

  if (model.includes("research") || model.includes("r1")) {
    return "research"
  }

  // Check messages for code-related content
  const lastMessage = messages[messages.length - 1]
  if (lastMessage && typeof lastMessage.content === "string") {
    const content = lastMessage.content.toLowerCase()

    if (
      content.includes("code") ||
      content.includes("function") ||
      content.includes("programming") ||
      content.includes("javascript") ||
      content.includes("python") ||
      content.includes("java") ||
      content.includes("c++") ||
      content.includes("typescript")
    ) {
      return "code"
    }

    if (
      content.includes("research") ||
      content.includes("study") ||
      content.includes("analyze") ||
      content.includes("investigate") ||
      content.includes("academic")
    ) {
      return "research"
    }
  }

  // Default to chat mode
  return "chat"
}

// Function to extract prompt from messages
function extractPromptFromMessages(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return ""
  }

  // Get the last user message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i].content
    }
  }

  // If no user message found, concatenate all messages
  return messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
}

// Function to handle image analysis with vision models - NEW APPROACH
export async function analyzeImage(text: string, imageUrl: string): Promise<string> {
  try {
    console.log("Analyzing image with text:", text, "and URL:", imageUrl)

    // Ensure the imageUrl is properly formatted
    if (!imageUrl) {
      return "I couldn't analyze the image. No image URL provided."
    }

    // Use our direct image analysis API route
    const response = await fetch("/api/analyze-image-direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        text,
        systemPrompt: "You are analyzing an image. Describe what you see in detail.",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error(`Vision API error (${response.status}):`, errorData.error)
      return `I couldn't analyze the image. Error: ${errorData.error || "Unknown error"}`
    }

    const data = await response.json()
    return data.text || "I couldn't analyze the image."
  } catch (error) {
    console.error("Error analyzing image:", error)
    return `I couldn't analyze the image. Error: ${(error as Error).message}`
  }
}
