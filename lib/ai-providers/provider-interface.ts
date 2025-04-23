export type AIMode = "chat" | "code" | "research" | "image"

export type AIErrorType =
  | "rate_limit"
  | "quota_exceeded"
  | "invalid_request"
  | "service_unavailable"
  | "authentication_error"
  | "unknown"

export interface AIResponse {
  text: string
  provider: string
  model?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface AIError extends Error {
  type: AIErrorType
  retryable: boolean
  provider: string
}

export interface AIProvider {
  name: string
  priority: number
  supportedModes: AIMode[]

  generateText(prompt: string, systemPrompt: string, mode: AIMode): Promise<AIResponse>
  generateImage?(prompt: string, options?: any): Promise<string>

  isAvailable(): Promise<boolean>
  handleError(error: any): AIError
}

// Factory for creating providers
export class AIProviderFactory {
  private static providers: AIProvider[] = []

  static registerProvider(provider: AIProvider): void {
    this.providers.push(provider)
  }

  static getProviders(): AIProvider[] {
    return [...this.providers].sort((a, b) => a.priority - b.priority)
  }

  static getProvidersForMode(mode: AIMode): AIProvider[] {
    return this.getProviders().filter((provider) => provider.supportedModes.includes(mode))
  }
}

// Fallback manager for handling provider failures
export class AIFallbackManager {
  private static instance: AIFallbackManager
  private providerAttempts: Map<string, number> = new Map()
  private lastErrorTime: Map<string, number> = new Map()
  private cooldownPeriod: number = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): AIFallbackManager {
    if (!this.instance) {
      this.instance = new AIFallbackManager()
    }
    return this.instance
  }

  async getNextProvider(mode: AIMode, lastError?: any): Promise<AIProvider> {
    const providers = AIProviderFactory.getProvidersForMode(mode)

    if (providers.length === 0) {
      throw new Error(`No providers available for mode: ${mode}`)
    }

    // If this is the first attempt or no error, return the highest priority provider
    if (!lastError) {
      return providers[0]
    }

    // Try to get the provider that failed
    let failedProviderName = "unknown"
    if (lastError && (lastError as AIError).provider) {
      failedProviderName = (lastError as AIError).provider
    }

    // Increment attempt count for the failed provider
    const attempts = (this.providerAttempts.get(failedProviderName) || 0) + 1
    this.providerAttempts.set(failedProviderName, attempts)

    // If the error is not retryable or we've tried too many times, mark provider as in cooldown
    if ((lastError as AIError).retryable === false || attempts >= 3) {
      this.lastErrorTime.set(failedProviderName, Date.now())
      this.providerAttempts.delete(failedProviderName)
    }

    // Filter out providers in cooldown
    const availableProviders = providers.filter((provider) => {
      const lastError = this.lastErrorTime.get(provider.name)
      if (!lastError) return true

      const timeSinceError = Date.now() - lastError
      return timeSinceError > this.cooldownPeriod
    })

    if (availableProviders.length === 0) {
      // If all providers are in cooldown, reset the one with the oldest error
      let oldestProvider = providers[0]
      let oldestTime = Number.POSITIVE_INFINITY

      for (const provider of providers) {
        const errorTime = this.lastErrorTime.get(provider.name) || 0
        if (errorTime < oldestTime) {
          oldestTime = errorTime
          oldestProvider = provider
        }
      }

      this.lastErrorTime.delete(oldestProvider.name)
      return oldestProvider
    }

    // Skip the failed provider if it's still in the list
    const nextProviders = availableProviders.filter((p) => p.name !== failedProviderName)
    return nextProviders.length > 0 ? nextProviders[0] : availableProviders[0]
  }

  resetProvider(providerName: string): void {
    this.providerAttempts.delete(providerName)
    this.lastErrorTime.delete(providerName)
  }

  resetAllProviders(): void {
    this.providerAttempts.clear()
    this.lastErrorTime.clear()
  }
}
