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

    const { leadId, message, leadContext, stream: useStream } = await req.json()

    if (!leadId || !message) {
      return NextResponse.json({ error: "leadId and message are required" }, { status: 400 })
    }

    // Get user info
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Save the user message
    await supabase.from("chat_messages").insert({
      lead_id: leadId,
      user_id: user.id,
      role: "user",
      content: message,
    })

    // Get recent conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(10)

    const recentMessages = (history || [])
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }))

    const messagesToSend = [...recentMessages, { role: "user", content: message } as const]

    // Streaming mode
    if (useStream) {
      // We can't easily save the streamed response in this mode
      // So we just return the stream and save it client-side
      const readableStream = await getAIResponseStream(messagesToSend, leadContext)

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    // Non-streaming mode
    const response = await getAIResponse(messagesToSend, leadContext)

    // Save the AI response
    await supabase.from("chat_messages").insert({
      lead_id: leadId,
      user_id: user.id,
      role: "assistant",
      content: response,
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}