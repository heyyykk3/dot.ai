import { type NextRequest, NextResponse } from "next/server"
import { TogetherAIProvider } from "@/lib/ai-providers/together-provider"

// Initialize the TogetherAI provider
const togetherAIProvider = new TogetherAIProvider()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, text, systemPrompt } = body

    // Validate inputs
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    console.log("Direct image analysis request received")
    console.log("Image URL:", imageUrl)
    console.log("Text prompt:", text)

    try {
      // Use the direct image analysis method
      const response = await togetherAIProvider.analyzeImageDirect(
        imageUrl,
        text || "What's in this image?",
        systemPrompt || "You are analyzing an image. Describe what you see in detail.",
      )

      console.log("Successfully analyzed image using TogetherAI")
      return NextResponse.json(response)
    } catch (error) {
      console.error("Error analyzing image with TogetherAI:", error)

      // Try with AI Horde as fallback
      try {
        console.log("Falling back to AI Horde for image analysis")

        // Import AI Horde dynamically to avoid circular dependencies
        const { analyzeImageWithAIHorde } = await import("@/lib/ai-horde")

        const hordeResponse = await analyzeImageWithAIHorde(imageUrl, text)

        return NextResponse.json({
          text: hordeResponse,
          provider: "AI Horde",
          model: "stable-diffusion",
        })
      } catch (hordeError) {
        console.error("AI Horde fallback also failed:", hordeError)
        throw error // Throw the original error
      }
    }
  } catch (error) {
    console.error("Error in analyze-image-direct route:", error)
    return NextResponse.json({ error: `Image analysis error: ${(error as Error).message}` }, { status: 500 })
  }
}
