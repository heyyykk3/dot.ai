import { type NextRequest, NextResponse } from "next/server"
import { type AIMode, AIProviderFactory, AIFallbackManager } from "@/lib/ai-providers/provider-interface"
import { OpenRouterProvider } from "@/lib/ai-providers/openrouter-provider"
import { HuggingFaceProvider } from "@/lib/ai-providers/huggingface-provider"
import { TogetherAIProvider } from "@/lib/ai-providers/together-provider"

// Initialize providers
const openRouterProvider = new OpenRouterProvider()
const huggingFaceProvider = new HuggingFaceProvider()
const togetherAIProvider = new TogetherAIProvider()

// Register providers with updated priorities
AIProviderFactory.registerProvider(togetherAIProvider) // Register TogetherAI first (priority 1)
AIProviderFactory.registerProvider(openRouterProvider) // Register OpenRouter second (priority 2)
AIProviderFactory.registerProvider(huggingFaceProvider) // Register HuggingFace last (priority 3)

// Get fallback manager instance
const fallbackManager = AIFallbackManager.getInstance()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, systemPrompt, mode = "chat" } = body

    // Validate inputs
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log(`Processing request for mode: ${mode}`)
    if (mode === "image") {
      console.log("Image prompt:", prompt)
    }

    let retries = 0
    const maxRetries = 3
    let lastError: any = null

    // Special handling for research and image modes to prioritize Together AI
    if (mode === "research" || mode === "image") {
      try {
        console.log(`Using TogetherAI for ${mode} mode with specialized models`)

        // Use TogetherAI directly for these specific modes
        const response = await togetherAIProvider.generateText(
          prompt,
          systemPrompt || "You are a helpful assistant.",
          mode as AIMode,
        )

        console.log(`Successfully generated response using ${togetherAIProvider.name}`)
        return NextResponse.json(response)
      } catch (error) {
        console.error(`Error using TogetherAI for ${mode} mode:`, error)
        lastError = error
        // Continue to fallback logic if TogetherAI fails
      }
    }

    // Standard fallback logic for all modes
    while (retries <= maxRetries) {
      try {
        // Get the next provider to try
        const provider = await fallbackManager.getNextProvider(mode as AIMode, lastError)

        console.log(`Attempt ${retries + 1}/${maxRetries + 1} using provider: ${provider.name}`)

        // Generate response using the selected provider
        const response = await provider.generateText(
          prompt,
          systemPrompt || "You are a helpful assistant.",
          mode as AIMode,
        )

        // Log successful provider
        console.log(`Successfully generated response using ${provider.name}`)

        return NextResponse.json(response)
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed:`, error)

        lastError = error
        retries++

        // Wait before retrying (exponential backoff)
        if (retries <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retries), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    return NextResponse.json(
      { error: `Failed to generate AI response after multiple attempts: ${lastError?.message || "Unknown error"}` },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error in unified AI route:", error)
    return NextResponse.json({ error: `AI generation error: ${(error as Error).message}` }, { status: 500 })
  }
}
