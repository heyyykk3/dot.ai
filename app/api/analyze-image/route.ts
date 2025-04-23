import { type NextRequest, NextResponse } from "next/server"

// Get OpenRouter headers with server-side API key
function getOpenRouterHeaders() {
  // Use the server-side environment variable (not NEXT_PUBLIC_)
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
    const { text, imageUrl, model = "qwen/qwen2.5-vl-72b-instruct:free" } = body

    // Format the content for vision models
    const content = [
      {
        type: "text",
        text: text || "What's in this image?",
      },
      {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      },
    ]

    // Make the request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Vision API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Vision API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in image analysis API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
