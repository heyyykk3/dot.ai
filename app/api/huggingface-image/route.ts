import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 512, height = 512 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Validate dimensions
    const validWidth = Math.min(Math.max(Number.parseInt(String(width), 10) || 512, 256), 1024)
    const validHeight = Math.min(Math.max(Number.parseInt(String(height), 10) || 512, 256), 1024)

    // Use Hugging Face API to generate image
    const huggingFaceToken = process.env.HUGGINGFACE_API_TOKEN
    if (!huggingFaceToken) {
      return NextResponse.json({ error: "Hugging Face API token not configured" }, { status: 500 })
    }

    // Use Stable Diffusion model for image generation
    const modelEndpoint = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

    console.log(`Generating image with Hugging Face: "${prompt}" (${validWidth}x${validHeight})`)

    const response = await fetch(modelEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${huggingFaceToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: validWidth,
          height: validHeight,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
      // Set a longer timeout for image generation
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Hugging Face API error:", errorText)
      return NextResponse.json(
        { error: `Hugging Face API error: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    // The response is the image binary data
    const imageBuffer = await response.arrayBuffer()

    // Convert to base64 for easier handling
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const dataUrl = `data:image/jpeg;base64,${base64Image}`

    return NextResponse.json({ url: dataUrl })
  } catch (error) {
    console.error("Error in Hugging Face image generation:", error)
    return NextResponse.json({ error: `Image generation failed: ${(error as Error).message}` }, { status: 500 })
  }
}
