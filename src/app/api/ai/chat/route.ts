import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getAIResponse, getAIResponseStream } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, leadContext, stream: useStream } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    const recentMessages = messages.slice(-10)

    // Streaming mode
    if (useStream) {
      const readableStream = await getAIResponseStream(recentMessages, leadContext)

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    // Non-streaming mode (default)
    const response = await getAIResponse(recentMessages, leadContext)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("AI Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}