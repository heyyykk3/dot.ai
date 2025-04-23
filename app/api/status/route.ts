import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider")

  try {
    if (provider === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        return NextResponse.json({ available: false, error: "API key not configured" })
      }

      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://dot.ai",
          "X-Title": "Dot AI",
        },
      })

      return NextResponse.json({ available: response.ok })
    } else if (provider === "huggingface") {
      const apiKey = process.env.HUGGINGFACE_API_TOKEN
      if (!apiKey) {
        return NextResponse.json({ available: false, error: "API key not configured" })
      }

      const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Hello",
          parameters: {
            max_new_tokens: 5,
          },
        }),
      })

      return NextResponse.json({ available: response.ok })
    } else if (provider === "together") {
      const apiKey = process.env.TOGETHER_AI_API_KEY
      if (!apiKey) {
        return NextResponse.json({ available: false, error: "API key not configured" })
      }

      const response = await fetch("https://api.together.xyz/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      return NextResponse.json({ available: response.ok })
    } else if (provider === "ai-horde") {
      const apiKey = process.env.AI_HORDE_API_KEY || "0000000000"

      const response = await fetch("https://aihorde.net/api/v2/status/heartbeat", {
        method: "GET",
        headers: {
          apikey: apiKey,
        },
      })

      return NextResponse.json({ available: response.ok })
    } else {
      // Check all providers
      const openRouterAvailable = await checkOpenRouter()
      const huggingFaceAvailable = await checkHuggingFace()
      const togetherAvailable = await checkTogether()
      const aiHordeAvailable = await checkAIHorde()

      return NextResponse.json({
        openrouter: openRouterAvailable,
        huggingface: huggingFaceAvailable,
        together: togetherAvailable,
        aiHorde: aiHordeAvailable,
      })
    }
  } catch (error) {
    console.error(`Error checking ${provider || "all"} status:`, error)
    return NextResponse.json({ available: false, error: (error as Error).message }, { status: 500 })
  }
}

async function checkOpenRouter(): Promise<boolean> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return false

    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://dot.ai",
        "X-Title": "Dot AI",
      },
    })

    return response.ok
  } catch {
    return false
  }
}

async function checkHuggingFace(): Promise<boolean> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_TOKEN
    if (!apiKey) return false

    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: "Hello",
        parameters: {
          max_new_tokens: 5,
        },
      }),
    })

    return response.ok
  } catch {
    return false
  }
}

async function checkTogether(): Promise<boolean> {
  try {
    const apiKey = process.env.TOGETHER_AI_API_KEY
    if (!apiKey) return false

    const response = await fetch("https://api.together.xyz/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    return response.ok
  } catch {
    return false
  }
}

async function checkAIHorde(): Promise<boolean> {
  try {
    const apiKey = process.env.AI_HORDE_API_KEY || "0000000000"

    const response = await fetch("https://aihorde.net/api/v2/status/heartbeat", {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    })

    return response.ok
  } catch {
    return false
  }
}
