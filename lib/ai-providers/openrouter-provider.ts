import type { AIProvider, AIResponse, AIError, AIMode } from "./provider-interface"

export class OpenRouterProvider implements AIProvider {
  name = "OpenRouter"
  priority = 2 // Highest priority (primary provider)
  supportedModes = ["chat", "code", "research", "image"] as AIMode[]

  private getModelForMode(mode: AIMode): string {
    switch (mode) {
      case "chat":
        return "meta-llama/llama-4-maverick:free"
      case "code":
        return "deepseek/deepseek-chat-v3-0324:free"
      case "research":
        return "deepseek/deepseek-r1:free"
      case "image":
        return "google/gemini-pro-vision:free"
      default:
        return "meta-llama/llama-4-maverick:free"
    }
  }

  private getHeaders(): Record<string, string> {
    const apiKey = process.env.OPENROUTER_API_KEY

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://dot.ai",
      "X-Title": "dot.ai",
    }
  }

  async generateText(prompt: string, systemPrompt: string, mode: AIMode): Promise<AIResponse> {
    const model = this.getModelForMode(mode)

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw this.handleError(
          new Error(`OpenRouter API error: ${response.status} - ${errorData.error || "Unknown error"}`),
        )
      }

      const data = await response.json()

      if (!data || !data.choices || data.choices.length === 0) {
        throw this.handleError(new Error("No choices returned from OpenRouter API"))
      }

      return {
        text: data.choices[0].message.content,
        provider: this.name,
        model,
        usage: data.usage,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      console.error("Error checking OpenRouter availability:", error)
      return false
    }
  }

  handleError(error: any): AIError {
    const errorMessage = error.message || "Unknown error"
    let type: AIError["type"] = "unknown"
    let retryable = true

    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      type = "rate_limit"
      retryable = false // Don't retry rate limits immediately
    } else if (errorMessage.includes("quota") || errorMessage.includes("credits")) {
      type = "quota_exceeded"
      retryable = false
    } else if (
      errorMessage.includes("authentication") ||
      errorMessage.includes("401") ||
      errorMessage.includes("403")
    ) {
      type = "authentication_error"
      retryable = false
    } else if (errorMessage.includes("503") || errorMessage.includes("502") || errorMessage.includes("504")) {
      type = "service_unavailable"
      retryable = true
    } else if (errorMessage.includes("400") || errorMessage.includes("invalid")) {
      type = "invalid_request"
      retryable = false
    }

    const aiError = new Error(errorMessage) as AIError
    aiError.type = type
    aiError.retryable = retryable
    aiError.provider = this.name

    return aiError
  }
}
