import { type NextRequest, NextResponse } from "next/server"

// Base URL for AI Horde API
const AI_HORDE_API_URL = "https://aihorde.net/api/v2"

// Get AI Horde API key from environment variables
function getAIHordeApiKey() {
  // Use the hardcoded API key provided by the user
  return "z1xlcxq8UtB7IwEpBF7GwA"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model = "absolute_reality", width = 512, height = 512, steps = 30 } = body

    // Step 1: Submit the generation request
    console.log("Submitting generation request to AI Horde...")
    const generationResponse = await fetch(`${AI_HORDE_API_URL}/generate/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: getAIHordeApiKey(),
      },
      body: JSON.stringify({
        prompt: prompt,
        params: {
          sampler_name: "k_euler_a",
          cfg_scale: 7.5,
          width: width,
          height: height,
          steps: steps,
          karras: true,
          post_processing: ["GFPGAN"], // Face correction
          seed_variation: 1,
          n: 1, // Number of images to generate
        },
        models: [model],
        r2: true, // Use R2 for image storage
        trusted_workers: true, // Only use trusted workers
      }),
    })

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text().catch(() => "Unknown error")
      console.error(`AI Horde API error (${generationResponse.status}): ${errorText}`)
      return NextResponse.json(
        { error: `AI Horde API error: ${generationResponse.status} - ${errorText}` },
        { status: generationResponse.status },
      )
    }

    const generationData = await generationResponse.json()
    const requestId = generationData.id

    if (!requestId) {
      return NextResponse.json({ error: "Failed to get request ID from AI Horde" }, { status: 500 })
    }

    // Return the request ID for client-side polling
    return NextResponse.json({ id: requestId })
  } catch (error) {
    console.error("Error in AI Horde API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add a GET endpoint to check the status of a generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 })
    }

    // Check if we're getting status or result
    const type = searchParams.get("type") || "status"

    if (type === "status") {
      // Get status
      const statusResponse = await fetch(`${AI_HORDE_API_URL}/generate/check/${id}`, {
        headers: {
          apikey: getAIHordeApiKey(),
        },
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text().catch(() => "Unknown error")
        return NextResponse.json(
          { error: `AI Horde status check error: ${statusResponse.status} - ${errorText}` },
          { status: statusResponse.status },
        )
      }

      const statusData = await statusResponse.json()
      return NextResponse.json(statusData)
    } else {
      // Get result
      const resultResponse = await fetch(`${AI_HORDE_API_URL}/generate/status/${id}`, {
        headers: {
          apikey: getAIHordeApiKey(),
        },
      })

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text().catch(() => "Unknown error")
        return NextResponse.json(
          { error: `AI Horde result fetch error: ${resultResponse.status} - ${errorText}` },
          { status: resultResponse.status },
        )
      }

      const resultData = await resultResponse.json()
      return NextResponse.json(resultData)
    }
  } catch (error) {
    console.error("Error in AI Horde status API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
