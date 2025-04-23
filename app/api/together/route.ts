import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, messages, max_tokens = 1000 } = body

    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 })
    }

    // Get API key from environment variable
    const apiKey = process.env.TOGETHER_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Together AI API key not configured" }, { status: 500 })
    }

    // Call Together AI API
    const response = await fetch("https://api.together.xyz/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature: 0.7,
        top_p: 0.95,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Together AI API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Together AI API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Together AI route:", error)
    return NextResponse.json({ error: `Together AI API error: ${(error as Error).message}` }, { status: 500 })
  }
}
