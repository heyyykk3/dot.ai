import { type NextRequest, NextResponse } from "next/server"
import { generateImage } from "@/lib/ai-client-unified"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, width = 1024, height = 1024, steps = 30 } = body

    // Validate inputs
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Generate image using our unified client with fallback
    const imageUrl = await generateImage(
      prompt,
      { width, height, steps, model: "black-forest-labs/FLUX.1-schnell-Free" },
      2, // Max retries
    )

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error("Error in unified image route:", error)
    return NextResponse.json({ error: `Image generation error: ${(error as Error).message}` }, { status: 500 })
  }
}
