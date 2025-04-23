import type { AIProvider, AIResponse, AIError, AIMode } from "./provider-interface"

export class TogetherAIProvider implements AIProvider {
  name = "TogetherAI"
  priority = 1
  supportedModes = ["chat", "code", "research", "image"] as AIMode[] // Added image support

  private getModelForMode(mode: AIMode): string {
    const modelOptions = {
      chat: [
        "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", // Fast & reliable
        "google/gemma-7b-it", // Open-source alternative
      ],
      code: [
        "Qwen/Qwen2.5-Coder-32B-Instruct",
        "codellama/CodeLlama-7b-Instruct-hf", // Good free LLaMA-based coder
        "mistralai/Mistral-7B-Instruct-v0.2", // Also supports light coding
      ],
      research: [
        "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free", // Prioritize this model for research mode
        "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        "mistralai/mixtral-8x7b-instruct", // Powerful MoE for analysis
        "meta-llama/Llama-2-70b-chat", // Still free, great for long text
      ],
      image: [
        "black-forest-labs/FLUX.1-schnell-Free", // New primary model for image generation
        "stabilityai/stable-diffusion-xl-base-1.0", // Secondary model for image generation
        "meta-llama/Llama-Vision-Free", // For image analysis
        "llava/Llava-1.5-7b-hf", // Alternative vision model
      ],
    }

    const models = modelOptions[mode] || modelOptions["chat"]
    return models[0] // Use top preferred free model
  }

  private getHeaders(): Record<string, string> {
    const apiKey = process.env.TOGETHER_AI_API_KEY
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
  }

  async generateText(prompt: string, systemPrompt: string, mode: AIMode): Promise<AIResponse> {
    let model = this.getModelForMode(mode)
    let modelOptionsUsed: string[] | undefined

    try {
      // Check if this is an image analysis request with embedded image URL
      if (mode === "image") {
        // Extract image URL if it's embedded in the prompt
        const imageUrlMatch = this.extractImageUrl(prompt)
        if (imageUrlMatch) {
          return this.analyzeImageDirect(imageUrlMatch, prompt.replace(imageUrlMatch, "").trim(), systemPrompt)
        }
      }

      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.95,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const errorData = JSON.parse(errorText)
        const aiError = this.handleError(new Error(`Together AI API error: ${response.status} - ${errorText}`))
        const errorMessage = aiError.message // Declared errorMessage here
        if (aiError.type === "rate_limit" && errorMessage.includes("model_rate_limit")) {
          console.warn(`Rate limit reached for model ${model}. Trying a different model.`)
          // Try a different model from the modelOptions list
          const modelOptions = {
            chat: [
              "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", // Fast & reliable
              "google/gemma-7b-it", // Open-source alternative
            ],
            code: [
              "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
              "codellama/CodeLlama-7b-Instruct-hf", // Good free LLaMA-based coder
              "mistralai/Mistral-7B-Instruct-v0.2", // Also supports light coding
            ],
            research: [
              "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free", // Prioritize this model for research mode
              "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
              "mistralai/mixtral-8x7b-instruct", // Powerful MoE for analysis
              "meta-llama/Llama-2-70b-chat", // Still free, great for long text
            ],
            image: [
              "meta-llama/Llama-Vision-Free", // Prioritize this model for image analysis
              "llava/Llava-1.5-7b-hf", // Alternative vision model
            ],
          }
          modelOptionsUsed = modelOptions[mode]
          const models = modelOptions[mode]
          if (!models || models.length === 0) {
            throw new Error(`No models available for mode ${mode}`)
          }
          const currentIndex = models.indexOf(model)
          const nextIndex = (currentIndex + 1) % models.length
          model = models[nextIndex]
          console.warn(`Trying model ${model} instead.`)
          return this.generateText(prompt, systemPrompt, mode) // Recursive call with the new model
        }
        throw aiError
      }

      const data = await response.json()

      if (!data || !data.choices || data.choices.length === 0) {
        throw this.handleError(new Error("No choices returned from Together AI API"))
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

  // Helper method to extract image URL from prompt
  private extractImageUrl(prompt: string): string | null {
    // Try markdown format: ![alt](url)
    const markdownMatch = prompt.match(/!\[.*?\]$$(.*?)$$/)
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1]
    }

    // Try direct URL pattern
    const urlMatch = prompt.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i)
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1]
    }

    // Try any URL pattern as last resort
    const anyUrlMatch = prompt.match(/(https?:\/\/[^\s]+)/i)
    if (anyUrlMatch && anyUrlMatch[1]) {
      return anyUrlMatch[1]
    }

    return null
  }

  // New direct method for image analysis that takes the image URL directly
  async analyzeImageDirect(imageUrl: string, textPrompt: string, systemPrompt: string): Promise<AIResponse> {
    try {
      console.log("Direct image analysis with URL:", imageUrl)
      console.log("Text prompt:", textPrompt)

      // Use a vision-capable model
      const model = "meta-llama/Llama-Vision-Free"

      // Combine system prompt and user prompt
      const combinedPrompt = `${systemPrompt}\n\n${textPrompt || "What's in this image?"}`

      // Prepare the message content with image - only include ONE message as required by the API
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: combinedPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ]

      console.log("Sending request to Together AI with image URL:", imageUrl)

      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleError(new Error(`Together AI Vision API error: ${response.status} - ${errorText}`))
      }

      const data = await response.json()

      if (!data || !data.choices || data.choices.length === 0) {
        throw this.handleError(new Error("No choices returned from Together AI Vision API"))
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

  async generateImage(prompt: string, options: any = {}): Promise<string> {
    try {
      const { width = 1024, height = 1024 } = options

      // Try with FLUX.1-schnell-Free first
      let model = "black-forest-labs/FLUX.1-schnell-Free"

      const response = await fetch("https://api.together.xyz/v1/completions", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          prompt: prompt,
          max_tokens: 1024,
          temperature: 0.7,
          response_format: { type: "image_url" },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Error with ${model}: ${errorText}`)

        // Try with stable-diffusion-xl as fallback
        model = "stabilityai/stable-diffusion-xl-base-1.0"

        const fallbackResponse = await fetch("https://api.together.xyz/v1/completions", {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            model,
            prompt: prompt,
            max_tokens: 1024,
            temperature: 0.7,
            response_format: { type: "image_url" },
          }),
        })

        if (!fallbackResponse.ok) {
          throw this.handleError(new Error(`Together AI image generation failed with both models`))
        }

        const fallbackData = await fallbackResponse.json()
        return fallbackData.choices[0].image_url || fallbackData.choices[0].text
      }

      const data = await response.json()
      return data.choices[0].image_url || data.choices[0].text
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://api.together.xyz/v1/models", {
        method: "GET",
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      console.error("Error checking Together AI availability:", error)
      return false
    }
  }

  handleError(error: any): AIError {
    const errorMessage = error.message || "Unknown error"
    let type: AIError["type"] = "unknown"
    let retryable = true

    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      type = "rate_limit"
      retryable = false
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
