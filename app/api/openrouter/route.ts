import { type NextRequest, NextResponse } from "next/server"

// Get OpenRouter headers with server-side API key
function getOpenRouterHeaders() {
  // Use the public key that's available in the client
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.error("OpenRouter API key is missing. Please check your environment variables.")
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://dot.ai", // Add your domain for better request tracking
    "X-Title": "dot.ai", // Add your app name for better request tracking
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, messages, max_tokens = 1000, temperature = 0.7 } = body

    // Make the request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenRouter API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in OpenRouter API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
