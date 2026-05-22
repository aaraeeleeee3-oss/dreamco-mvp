import OpenAI from "openai"

let openaiInstance: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

const AI_SYSTEM_PROMPT = `You are DREAM.CO AI Sales Assistant — an elite AI SDR.
You help sales teams close more deals by analyzing leads, writing outreach, and suggesting next steps.

CORE CAPABILITIES:
1. Lead Analysis: Evaluate lead fit, intent, and priority
2. Cold Email Writing: Craft personalized, high-converting outreach
3. Objection Handling: Provide persuasive responses
4. Next Step Suggestions: Recommend optimal actions based on pipeline stage
5. Follow-up Strategy: Design multi-touch sequences

TONE: Professional, confident, persuasive, human-like. Sound like a top 1% sales rep.
NEVER generate generic sales spam. Always personalize based on available lead data.

RESPONSE FORMAT:
Keep responses concise and actionable. When generating emails, wrap them in triple backticks.`

export async function getAIResponse(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  leadContext?: string
) {
  const systemMessage = leadContext
    ? `${AI_SYSTEM_PROMPT}\n\nLEAD CONTEXT:\n${leadContext}`
    : AI_SYSTEM_PROMPT

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return response.choices[0]?.message?.content || ""
}

export async function getAIResponseStream(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  leadContext?: string
): Promise<ReadableStream> {
  const systemMessage = leadContext
    ? `${AI_SYSTEM_PROMPT}\n\nLEAD CONTEXT:\n${leadContext}`
    : AI_SYSTEM_PROMPT

  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          controller.enqueue(new TextEncoder().encode(content))
        }
      }
      controller.close()
    },
  })
}

export async function generateColdEmail(
  leadName: string,
  leadCompany: string,
  leadTitle: string,
  context?: string
) {
  const prompt = `Write a personalized cold email for:\nName: ${leadName}\nCompany: ${leadCompany}\nTitle: ${leadTitle}\n${context ? `Context: ${context}` : ""}\n\nThe email should be concise, value-first, and include a clear CTA to book a call.`

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a world-class copywriter specializing in B2B sales emails. Write compelling, personalized cold emails that get replies. Keep under 150 words. Use natural language.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
  })

  return response.choices[0]?.message?.content || ""
}

export async function analyzeLead(
  leadData: { name: string; company?: string; title?: string; notes?: string }
) {
  const prompt = `Analyze this lead and provide: 1) Fit Score (1-10) 2) Recommended next action 3) Key talking points 4) Risk factors\n\nLead: ${JSON.stringify(leadData)}`

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a senior sales analyst. Provide actionable lead intelligence in a structured format.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 500,
  })

  return response.choices[0]?.message?.content || ""
}