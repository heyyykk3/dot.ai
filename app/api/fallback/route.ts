import { type NextRequest, NextResponse } from "next/server"

// This is a guaranteed fallback API that will always return a response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    // Extract the user's last message
    const userMessages = messages.filter((msg) => msg.role === "user")
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : ""

    // Create a simple response based on the user's message
    let response = "I'm sorry, I'm having trouble connecting to my knowledge base right now."

    if (lastUserMessage) {
      // Extract the first 50 characters of the user's message to personalize the response
      const userQuery = lastUserMessage.substring(0, 50) + (lastUserMessage.length > 50 ? "..." : "")
      response = `I apologize, but I'm currently experiencing technical difficulties processing your request about "${userQuery}". Please try again in a moment or try a different question.`
    }

    // Return a properly formatted response
    return NextResponse.json({
      choices: [
        {
          message: {
            content: response,
            role: "assistant",
          },
        },
      ],
    })
  } catch (error) {
    console.error("Error in fallback API route:", error)

    // Even if everything fails, return a response
    return NextResponse.json({
      choices: [
        {
          message: {
            content: "I apologize for the technical difficulties. Please try again later.",
            role: "assistant",
          },
        },
      ],
    })
  }
}
