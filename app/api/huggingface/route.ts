import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, prompt, max_tokens = 1000 } = body

    // Validate inputs
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    // Get API key from environment variable
    const apiKey = process.env.HUGGINGFACE_API_TOKEN
    if (!apiKey) {
      return NextResponse.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    // Call Hugging Face API
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: max_tokens,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Hugging Face API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Hugging Face API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
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

    return NextResponse.json({ generated_text: generatedText })
  } catch (error) {
    console.error("Error in Hugging Face route:", error)
    return NextResponse.json({ error: `Hugging Face API error: ${(error as Error).message}` }, { status: 500 })
  }
}
