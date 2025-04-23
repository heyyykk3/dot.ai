import type { AIProvider, AIResponse, AIError, AIMode } from "./provider-interface"

export class HuggingFaceProvider implements AIProvider {
  name = "HuggingFace"
  priority = 3 // Second priority (first fallback)
  supportedModes = ["chat", "code", "research", "image"] as AIMode[]

  private getModelForMode(mode: AIMode): string {
    switch (mode) {
      case "chat":
        return "mistralai/Mistral-7B-Instruct-v0.2"
      case "code":
        return "bigcode/starcoder2-15b"
      case "research":
        return "meta-llama/Llama-2-70b-chat-hf"
      case "image":
        return "stabilityai/stable-diffusion-xl-base-1.0"
      default:
        return "mistralai/Mistral-7B-Instruct-v0.2"
    }
  }

  private getHeaders(): Record<string, string> {
    const apiKey = process.env.HUGGINGFACE_API_TOKEN

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
  }

  private formatPromptForModel(prompt: string, systemPrompt: string, model: string): string {
    if (model.includes("mistral")) {
      return `<s>[INST] ${systemPrompt}\n\n${prompt} [/INST]`
    } else if (model.includes("llama")) {
      return `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n${prompt} [/INST]`
    } else if (model.includes("starcoder")) {
      return `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
    } else {
      return `System: ${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
    }
  }

  async generateText(prompt: string, systemPrompt: string, mode: AIMode): Promise<AIResponse> {
    const model = this.getModelForMode(mode)

    try {
      // For image analysis, use a different endpoint
      if (mode === "image" && prompt.includes("[Image URL:")) {
        return this.analyzeImage(prompt, systemPrompt)
      }

      const formattedPrompt = this.formatPromptForModel(prompt, systemPrompt, model)

      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleError(new Error(`Hugging Face API error: ${response.status} - ${errorText}`))
      }

      const data = await response.json()

      // Handle different response formats from Hugging Face
      let generatedText = ""
      if (Array.isArray(data) && data.length > 0) {
        generatedText = data[0].generated_text || ""
      } else if (typeof data === "object" && data.generated_text) {
        generatedText = data.generated_text
      } else if (typeof data === "string") {
        generatedText = data
      }

      return {
        text: generatedText,
        provider: this.name,
        model,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private async analyzeImage(prompt: string, systemPrompt: string): Promise<AIResponse> {
    // Extract image URL from prompt
    const match = prompt.match(/\[Image URL: (.*?)\]/)
    if (!match || !match[1]) {
      throw this.handleError(new Error("No image URL found in prompt"))
    }

    const imageUrl = match[1]
    const textPrompt = prompt.replace(/\[Image URL: .*?\]/, "").trim()

    try {
      // Fetch the image as a blob
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw this.handleError(new Error(`Failed to fetch image: ${imageResponse.status}`))
      }

      const imageBlob = await imageResponse.blob()

      // Use a multimodal model for image analysis
      const model = "microsoft/git-large-coco"

      const formData = new FormData()
      formData.append("file", imageBlob)
      formData.append("text", `${systemPrompt}\n\n${textPrompt}`)

      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleError(new Error(`Hugging Face image analysis error: ${response.status} - ${errorText}`))
      }

      const data = await response.json()

      return {
        text: data.generated_text || "I could not analyze the image.",
        provider: this.name,
        model,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const model = "mistralai/Mistral-7B-Instruct-v0.2"
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          inputs: "Hello",
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error checking Hugging Face availability:", error)
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
    } else if (errorMessage.includes("quota") || errorMessage.includes("exceeded")) {
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
