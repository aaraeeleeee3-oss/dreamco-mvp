/**
 * DREAM.CO — AI Conversation Engine
 *
 * A modular conversation engine library for AI sales employees.
 * Implements: state machine, objection handling (15 types), GPCT scoring,
 * persuasion frameworks (Cialdini), personality switching, sentiment analysis.
 *
 * Reference: /home/team/shared/03_CONVERSATION_VOICE_ENGINE.md (§4.1–4.8)
 *
 * Usage:
 *   import { conversationEngine } from '@/lib/conversation-engine'
 *   const prompt = conversationEngine.buildSystemPrompt({ ... })
 *   const stream = conversationEngine.getStreamingResponse({ ... })
 *   const objection = conversationEngine.detectObjection("too expensive")
 *   const score = conversationEngine.scoreGPCT({ goals: "...", ... })
 */

import OpenAI from "openai"

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ConversationState =
  | "initial"
  | "engaged"
  | "qualifying"
  | "objection"
  | "closing"
  | "booked"
  | "followup"
  | "disqualified"
  | "lost"

export type Channel = "email" | "phone" | "linkedin" | "whatsapp" | "chat"

export type Personality = "consultant" | "closer" | "supporter"

export type Sentiment =
  | "angry"
  | "skeptical"
  | "curious"
  | "indifferent"
  | "excited"
  | "confused"
  | "busy"

export type ObjectionId =
  | "not_interested"
  | "too_expensive"
  | "already_using"
  | "send_info"
  | "too_busy"
  | "not_a_fit"
  | "need_to_think"
  | "call_me_later"
  | "too_small"
  | "too_big"
  | "security_concerns"
  | "show_me_results"
  | "need_to_see_it"
  | "team_wont_use"
  | "no_budget"

export type ObjectionFramework =
  | "feel_felt_found"
  | "sandler"
  | "laer"
  | "spin"
  | "value_compression"
  | "specific_questioning"
  | "urgency_social_proof"
  | "commitment_specificity"
  | "scaled_offering"
  | "enterprise_authority"
  | "factual_social_proof"
  | "direct_demo_close"
  | "adoption_framework"
  | "creative_budget"

export interface LeadContext {
  name: string
  company?: string
  title?: string
  industry?: string
  painPoints?: string[]
  previousObjections?: ObjectionId[]
  objectionStatus?: "pending" | "partially_resolved" | "resolved"
  sentiment?: Sentiment
  score?: number
  stage?: ConversationState
  language?: string
  timezone?: string
}

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface GPCTInput {
  goals: string
  plans: string
  challenges: string
  timeline: string
}

export interface GPCTScore {
  goals: number
  plans: number
  challenges: number
  timeline: number
  overall: number
  tier: "hot" | "warm" | "cold" | "disqualified"
  label: string
}

export interface ObjectionResult {
  id: ObjectionId
  label: string
  detected: boolean
  confidence: number
  framework: ObjectionFramework
  response: string
}

export interface PersonalityProfile {
  tone: string
  vocabulary: string[]
  pacing: string
  questionStyle: string
  authorityLevel: string
  emotionalRange: number
  closingStyle: string
  systemInstruction: string
}

export interface SystemPromptInput {
  personality: Personality
  lead: LeadContext
  stage: ConversationState
  channel: Channel
  turnNumber: number
  objectionFramework?: ObjectionFramework
  conversationHistory?: Message[]
}

export interface StreamingResponseInput {
  messages: Message[]
  leadContext?: LeadContext
  personality?: Personality
  stage?: ConversationState
  channel?: Channel
  functions?: boolean
  temperature?: number
  maxTokens?: number
}

// ─────────────────────────────────────────────────────────────
// Objection Handling (15 Objections from §4.2)
// ─────────────────────────────────────────────────────────────

interface ObjectionConfig {
  id: ObjectionId
  label: string
  keywords: string[]
  framework: ObjectionFramework
  template: string
  followUp?: string
}

const OBJECTIONS: ObjectionConfig[] = [
  {
    id: "not_interested",
    label: "Not interested",
    keywords: ["not interested", "not looking", "no thanks", "not right now", "stop contacting"],
    framework: "feel_felt_found",
    template:
      "I understand how you feel. Many of our clients felt exactly the same way before they saw how much time they could save on lead follow-up. What they found was that a 10-minute conversation was enough to decide if it's worth pursuing. Would you be open to that?",
    followUp:
      "I respect that. Let me leave you with one thing — companies in your space are spending 20+ hours a week on manual follow-up. When you're ready to solve that, we're here.",
  },
  {
    id: "too_expensive",
    label: "Too expensive",
    keywords: ["too expensive", "over budget", "can't afford", "pricing", "too much", "cost"],
    framework: "sandler",
    template:
      "If I could show you how the ROI pays for itself in the first 30 days, would that change the conversation? Our clients typically see a 5x return within the first month. Let me show you the math.",
    followUp:
      "What if we could start with a pilot at half the commitment? If you don't see measurable ROI in 2 weeks, there's no obligation.",
  },
  {
    id: "already_using",
    label: "Already using something",
    keywords: ["already have", "using", "happy with", "already use", "current solution", "competitor", "switched to"],
    framework: "laer",
    template:
      "That's great that you're already automating. What's working well with your current solution? And if you could wave a magic wand, what's one thing you'd improve about it?",
    followUp:
      "The reason I ask is that most teams using [competitor] tell us they still spend 10+ hours on manual follow-up because the tool doesn't actually handle conversations. Our AI does.",
  },
  {
    id: "send_info",
    label: "Send me info",
    keywords: ["send info", "send email", "send brochure", "send details", "email me", "send over"],
    framework: "spin",
    template:
      "I'd be happy to send that over. Quick question so I send the right information — what's the biggest challenge you're currently facing with your sales outreach? That way I can customize what I share.",
    followUp:
      "Actually, let me send you a 2-minute video demo instead — it'll show you exactly how it works. Which is better for you, email or WhatsApp?",
  },
  {
    id: "too_busy",
    label: "Too busy",
    keywords: ["too busy", "no time", "swamped", "overwhelmed", "hectic", "crazy", "slammed"],
    framework: "value_compression",
    template:
      "This will actually save you time — our clients save an average of 15 hours a week on lead follow-up. A 10-minute conversation now could save you 10x that. When's the least busy time this week?",
    followUp:
      "I get it. How about I send you a 60-second video overview and you can decide if it's worth 10 minutes?",
  },
  {
    id: "not_a_fit",
    label: "Not a fit",
    keywords: ["not a fit", "doesn't apply", "different industry", "not for us", "not relevant"],
    framework: "specific_questioning",
    template:
      "What specifically makes you feel it might not fit? Often it comes down to a concern about industry fit — is that the case here? We work with companies of all sizes in various industries, so it's possible we can adapt.",
    followUp:
      "Let me share a case study from [similar industry]. Our AI adjusts to any business model. Would 5 minutes to see if it could work be worth it?",
  },
  {
    id: "need_to_think",
    label: "Need to think about it",
    keywords: ["need to think", "need to discuss", "talk to team", "think about it", "discuss internally", "get back to you"],
    framework: "urgency_social_proof",
    template:
      "What specifically do you need to think through? I can help address those questions right now. Also, [similar company] felt the same way, but after looking at the numbers they realized the decision was simpler than they thought.",
    followUp:
      "Let me put together a one-page summary for you to share with your team. What's the best time to follow up with them next week?",
  },
  {
    id: "call_me_later",
    label: "Call me later",
    keywords: ["call later", "call next week", "not now", "reach out later", "try again", "future date"],
    framework: "commitment_specificity",
    template:
      "I definitely will. To make sure I follow up at the right time, what's specifically changing between now and then? Is there a particular date or milestone I should align with?",
    followUp:
      "How about I send you a quick email with our info to review on your own time, and I'll follow up on [specific date]?",
  },
  {
    id: "too_small",
    label: "We're too small",
    keywords: ["too small", "small business", "startup", "not ready", "tiny", "small team"],
    framework: "scaled_offering",
    template:
      "Some of our best results have been with teams your size. In fact, companies with 5-20 employees see the fastest ROI because they can adopt quickly and the impact is immediate. We have a specific starter plan designed for growing teams.",
    followUp:
      "One person with our AI can do the work of three. For a team your size, that's game-changing. Want to see how?",
  },
  {
    id: "too_big",
    label: "We're too big",
    keywords: ["too large", "enterprise", "complex", "compliance", "too big", "large org"],
    framework: "enterprise_authority",
    template:
      "We work with enterprises of your scale. [Reference client] had similar concerns about complexity. Our enterprise tier includes dedicated support, SOC2 compliance, custom integrations, and white-glove onboarding.",
    followUp:
      "We handle over 500,000 conversations a month for companies like yours. Would you be open to a brief conversation with our enterprise team?",
  },
  {
    id: "security_concerns",
    label: "Data security concerns",
    keywords: ["security", "privacy", "data", "compliance", "gdpr", "hipaa", "soc2", "safe"],
    framework: "factual_social_proof",
    template:
      "Security is our top priority. We're SOC2 compliant, all data is encrypted at rest and in transit, we sign DPAs, and we've passed enterprise security audits. Happy to share our security whitepaper and schedule a call with our security team.",
    followUp:
      "Would a signed NDA and a security review call help put your mind at ease?",
  },
  {
    id: "show_me_results",
    label: "Show me results",
    keywords: ["proof", "results", "case studies", "testimonials", "roi", "data", "numbers", "evidence"],
    framework: "social_proof_specifics",
    template:
      "Absolutely. [Client A] in your industry saw a 3x increase in qualified meetings in 30 days. [Client B] reduced their cost per lead by 60%. I'll send you both case studies — want to hop on a quick call to walk through them?",
    followUp:
      "Actually, the fastest way to see results is a live demo of our dashboard showing real conversion data. Got 10 minutes this week?",
  },
  {
    id: "need_to_see_it",
    label: "I need to see it",
    keywords: ["demo", "see it", "show me", "see how it works", "need to see", "walkthrough"],
    framework: "direct_demo_close",
    template:
      "Perfect timing. I can show you a live demo right now in 10 minutes. Fair warning though — once you see what our AI sales agents can do, you'll wonder why you didn't try this sooner. What's your preferred browser?",
    followUp:
      "No time for a full demo now? Here's a 2-minute recorded demo. After you watch it, let me know if you'd like to see the live version.",
  },
  {
    id: "team_wont_use",
    label: "My team won't use it",
    keywords: ["team won't use", "adoption", "learning curve", "change management", "training", "my team"],
    framework: "adoption_framework",
    template:
      "That's a common concern. We have a proven 7-day onboarding process, our AI mimics your top sales rep's style so it feels familiar, and we provide hands-on team training plus ongoing support. Most teams are fully ramped within a week.",
    followUp:
      "We also provide adoption analytics so you can see exactly who's engaging. Happy to set up a pilot with just 2 team members first.",
  },
  {
    id: "no_budget",
    label: "No budget",
    keywords: ["no budget", "frozen", "next quarter", "next year", "budget cut", "no spending"],
    framework: "creative_budget",
    template:
      "I understand budget constraints. What if we could show measurable ROI in 2 weeks with a pilot that's completely risk-free? If you don't see results, there's no commitment. In fact, if the ROI doesn't justify the cost, I'd tell you not to buy it.",
    followUp:
      "When does your next budget cycle start? Let's set a reminder and I'll check back in with updated case studies from your industry.",
  },
]

// ─────────────────────────────────────────────────────────────
// Personality Profiles (§4.5)
// ─────────────────────────────────────────────────────────────

const PERSONALITIES: Record<Personality, PersonalityProfile> = {
  consultant: {
    tone: "Professional, analytical, warm",
    vocabulary: ["ROI", "efficiency", "optimization", "scale", "leverage", "data-driven", "systematic"],
    pacing: "Measured, gives space between statements",
    questionStyle: "Open-ended, Socratic",
    authorityLevel: "Expert — speaks from data and case studies",
    emotionalRange: 4,
    closingStyle: "Logical — 'Here's the data, here's the recommendation'",
    systemInstruction:
      "You are a consultative sales advisor. Speak analytically and professionally. Use data and case studies to support your points. Ask open-ended questions to understand the prospect's situation. Be measured and give them space to respond. Always tie features back to business impact.",
  },
  closer: {
    tone: "Energetic, confident, direct",
    vocabulary: ["results", "guaranteed", "proven", "now", "today", "let's go", "locked in"],
    pacing: "Faster, more conversational",
    questionStyle: "Assumptive closes, pattern interrupts",
    authorityLevel: "Peer-ish — 'I've seen this work for people like you'",
    emotionalRange: 7,
    closingStyle: "Direct — 'Let's get this scheduled'",
    systemInstruction:
      "You are a high-energy sales closer. Be direct, confident, and assumptive. Use pattern interrupts and assumptive closes. Drive toward commitment in every response. Be enthusiastic but not pushy. Mirror the prospect's energy and match it.",
  },
  supporter: {
    tone: "Empathetic, patient, reassuring",
    vocabulary: ["help", "support", "understand", "together", "we've got you", "step by step"],
    pacing: "Slow, pauses for questions",
    questionStyle: "Closed-ended, clarifying",
    authorityLevel: "Partner — 'We're in this together'",
    emotionalRange: 8,
    closingStyle: "Gentle — 'Whenever you're ready'",
    systemInstruction:
      "You are a supportive customer success partner. Be warm, empathetic, and patient. Validate their concerns and reassure them. Take things step by step. Never rush them. Ask clarifying questions to fully understand their needs before offering solutions.",
  },
}

// ─────────────────────────────────────────────────────────────
// Sentiment Tone Adjustment (§4.6)
// ─────────────────────────────────────────────────────────────

const SENTIMENT_TONE_MAP: Record<
  Sentiment,
  { shift: string; languagePattern: string; systemOverride: string }
> = {
  angry: {
    shift: "Apologetic + Empathetic → Reassuring",
    languagePattern: "I hear your frustration. Let me fix this.",
    systemOverride:
      "The prospect is frustrated. Be apologetic, empathetic, and focus on resolution. Validate their feelings. Do NOT be defensive. Keep responses short and focused on fixing the issue.",
  },
  skeptical: {
    shift: "Data-driven + Confident → Proof-based",
    languagePattern: "I understand the skepticism. Here are the numbers.",
    systemOverride:
      "The prospect is skeptical. Lead with data, proof, and case studies. Be confident but not arrogant. Anticipate doubts and address them preemptively with specifics.",
  },
  curious: {
    shift: "Enthusiastic + Detailed → Deep-dive",
    languagePattern: "Great question! Let me walk through how it works.",
    systemOverride:
      "The prospect is curious and interested. Provide detailed, enthusiastic answers. Encourage more questions. This is a high-intent signal — nurture it with depth.",
  },
  indifferent: {
    shift: "Pattern Interrupt → Value-focused",
    languagePattern: "Let me reframe this. Here's what matters most.",
    systemOverride:
      "The prospect seems disengaged. Use pattern interrupts to regain attention. Lead with the most compelling value proposition. Be concise. Ask questions to re-engage them.",
  },
  excited: {
    shift: "Energized + Direct → Close-ready",
    languagePattern: "You're right to be excited. Let's lock this in.",
    systemOverride:
      "The prospect is excited and engaged. Match their energy. Move toward closing. Use assumptive language. Don't slow down — strike while interest is high.",
  },
  confused: {
    shift: "Slow + Clear + Reassuring → Simplified",
    languagePattern: "Let me simplify. Here's what it means for you.",
    systemOverride:
      "The prospect is confused or uncertain. Slow down. Use simple language. Break complex concepts into small pieces. Ask if they want more detail. Be patient and reassuring.",
  },
  busy: {
    shift: "Concise + Respectful → Quick value",
    languagePattern: "I'll be brief. Here's the core value in 30 seconds.",
    systemOverride:
      "The prospect is busy or distracted. Be extremely concise. Lead with the single most compelling point. Offer to follow up later. Respect their time above all.",
  },
}

// ─────────────────────────────────────────────────────────────
// Cialdini Persuasion Scripts (§4.4)
// ─────────────────────────────────────────────────────────────

const PERSUASION_SCRIPTS = {
  reciprocity:
    "I just sent you a breakdown of how [company] achieved [result]. In return, would you be open to a 10-minute conversation about how the same approach could work for you?",
  scarcity:
    "We're currently onboarding 3 more clients this month and have capacity for just 2 more. If you decide within the next 7 days, I can guarantee priority implementation.",
  authority:
    "We've deployed AI sales agents across 200+ companies, handling over 500,000 conversations. Our system processes more sales calls in a day than most SDR teams do in a quarter.",
  liking:
    "I noticed we both [shared connection / background / interest]. That's actually how I came across [company] — I've been following your work on [topic].",
  consistency:
    "You mentioned earlier that [stated priority] is your #1 concern. Is that still the case? Because our AI handles exactly that, and I'd love to show you how.",
  socialProof:
    "[Client Name] in your industry had the exact same concern. After implementing, they saw a 40% increase in qualified meetings. Would you like to speak with them directly?",
}

// ─────────────────────────────────────────────────────────────
// Conversation Engine Class
// ─────────────────────────────────────────────────────────────

export class ConversationEngine {
  private openai: OpenAI

  constructor(config?: { openai?: OpenAI }) {
    this.openai =
      config?.openai ??
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      })
  }

  // ── Personality ──────────────────────────────────────────

  /**
   * Select the best personality for a given context (§4.5.4)
   */
  selectPersonality(
    channel: Channel,
    sentiment: Sentiment | "neutral",
    stage: ConversationState,
    industry?: string
  ): Personality {
    // Channel-based defaults
    const channelMap: Partial<Record<Channel, Personality>> = {
      email: "consultant",
      phone: "closer",
      linkedin: "consultant",
      whatsapp: "closer",
      chat: "supporter",
    }
    let personality = channelMap[channel] ?? "consultant"

    // Sentiment overrides
    const sentimentMap: Partial<Record<Sentiment, Personality>> = {
      angry: "supporter",
      curious: "consultant",
      excited: "closer",
    }
    if (sentiment !== "neutral" && sentimentMap[sentiment]) {
      personality = sentimentMap[sentiment]!
    }

    // Stage overrides (stage-specific personalities trumps sentiment)
    const stageMap: Partial<Record<ConversationState, Personality>> = {
      closing: "closer",
      booked: "closer",
    }
    if (stageMap[stage]) {
      personality = stageMap[stage]!
    }

    // Industry overrides
    const industryMap: Record<string, Personality> = {
      "real estate": "closer",
      "home services": "closer",
      healthcare: "supporter",
      "enterprise saas": "consultant",
      legal: "consultant",
    }
    if (industry && industryMap[industry.toLowerCase()]) {
      personality = industryMap[industry.toLowerCase()]
    }

    return personality
  }

  /**
   * Get the full personality profile
   */
  getPersonalityProfile(type: Personality): PersonalityProfile {
    return PERSONALITIES[type]
  }

  // ── Objection Handling (§4.2) ─────────────────────────────

  /**
   * Detect an objection from prospect text using keyword matching
   * Returns the best match or null
   */
  detectObjection(text: string): ObjectionResult | null {
    if (!text) return null

    const lower = text.toLowerCase()
    let bestMatch: ObjectionConfig | null = null
    let bestScore = 0

    for (const obj of OBJECTIONS) {
      let score = 0
      for (const keyword of obj.keywords) {
        if (lower.includes(keyword)) {
          // Weight by how many words matched
          score += keyword.split(" ").length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = obj
      }
    }

    if (!bestMatch || bestScore < 1) return null

    return {
      id: bestMatch.id,
      label: bestMatch.label,
      detected: true,
      confidence: Math.min(bestScore / 5, 1),
      framework: bestMatch.framework,
      response: bestMatch.template,
    }
  }

  /**
   * Get objection response by type
   */
  getObjectionResponse(id: ObjectionId, useFollowUp: boolean = false): ObjectionConfig | undefined {
    const objection = OBJECTIONS.find((o) => o.id === id)
    if (!objection) return undefined
    return {
      ...objection,
      template: useFollowUp && objection.followUp ? objection.followUp : objection.template,
    }
  }

  /**
   * Get all objection configs (for reference/training)
   */
  getAllObjections(): ObjectionConfig[] {
    return OBJECTIONS
  }

  /**
   * Get LAER framework script (§4.2.2)
   */
  getLAERScript(objection: string): string {
    return [
      `LISTEN: "I hear your concern about ${objection}."`,
      `ACKNOWLEDGE: "That's a valid point, and you're not alone in feeling that way."`,
      `EXPLORE: "Can I ask what specifically drives that concern?"`,
      `RESPOND: "Here's how we address that…"`,
    ].join("\n")
  }

  // ── GPCT Scoring (§4.3) ─────────────────────────────────

  /**
   * Score a prospect using GPCT criteria
   */
  scoreGPCT(input: GPCTInput): GPCTScore {
    // Goals score — alignment with product
    const goalsScore = this.scoreDimension(input.goals, {
      highKeywords: ["grow", "scale", "automate", "increase", "revenue", "efficiency"],
      lowKeywords: ["maintain", "unsure", "not sure", "maybe"],
    })

    // Plans score — lack of plan = urgency
    const plansScore = this.scoreDimension(input.plans, {
      highKeywords: ["no plan", "not yet", "nothing", "looking", "evaluating", "manual"],
      lowKeywords: ["already", "implemented", "solved", "working", "satisfied"],
    })

    // Challenges score — pain severity
    const challengesScore = this.scoreDimension(input.challenges, {
      highKeywords: ["significant", "major", "critical", "too much", "waste", "hours", "expensive", "struggling"],
      lowKeywords: ["minor", "small", "manageable", "fine", "okay"],
    })

    // Timeline score — urgency
    const timelineScore = this.evaluateTimeline(input.timeline)

    const overall =
      goalsScore * 0.3 + plansScore * 0.25 + challengesScore * 0.25 + timelineScore * 0.2

    return {
      goals: goalsScore,
      plans: plansScore,
      challenges: challengesScore,
      timeline: timelineScore,
      overall: Math.round(overall),
      tier: this.getQualificationTier(Math.round(overall)),
      label: this.getQualificationLabel(Math.round(overall)),
    }
  }

  private scoreDimension(text: string, keywords: { highKeywords: string[]; lowKeywords: string[] }): number {
    const lower = text.toLowerCase()
    let score = 50 // neutral starting point

    for (const kw of keywords.highKeywords) {
      if (lower.includes(kw)) score = Math.min(score + 15, 100)
    }
    for (const kw of keywords.lowKeywords) {
      if (lower.includes(kw)) score = Math.max(score - 15, 0)
    }

    return score
  }

  private evaluateTimeline(timeline: string): number {
    const lower = timeline.toLowerCase()

    // Extract time references
    if (/\b\d+\s*day/i.test(lower)) return 100
    if (/\bdays?\b/i.test(lower)) return 100
    if (/\bthis\s*week\b/i.test(lower)) return 100
    if (/\bnext\s*week\b/i.test(lower)) return 85
    if (/\bnext\s*month\b/i.test(lower)) return 70
    if (/\bin\s*\d+\s*weeks?\b/i.test(lower)) return 80
    if (/\bin\s*\d+\s*months?\b/i.test(lower)) return Math.max(50 - parseInt(lower.match(/\d+/)?.[0] || "0") * 10, 10)
    if (/soon|immediately|asap|urgent|quickly/i.test(lower)) return 100
    if (/quarter/i.test(lower)) return 40
    if (/year/i.test(lower)) return 10
    if (/someday|eventually|later|no rush/i.test(lower)) return 5

    return 30 // unknown timeline = lukewarm
  }

  private getQualificationTier(score: number): GPCTScore["tier"] {
    if (score >= 80) return "hot"
    if (score >= 60) return "warm"
    if (score >= 40) return "cold"
    return "disqualified"
  }

  private getQualificationLabel(score: number): string {
    if (score >= 80) return "Hot Lead — Book demo immediately, priority follow-up"
    if (score >= 60) return "Warm Lead — Continue nurture sequence, 2 more touchpoints"
    if (score >= 40) return "Cold Lead — Add to drip campaign, 1 touchpoint/month"
    return "Disqualified — Tag, move to long-term nurture"
  }

  // ── Persuasion (§4.4) ──────────────────────────────────

  /**
   * Get a Cialdini persuasion script
   */
  getPersuasionScript(principle: keyof typeof PERSUASION_SCRIPTS, context?: Record<string, string>): string {
    let script = PERSUASION_SCRIPTS[principle] || ""
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        script = script.replace(`[${key}]`, value)
      }
    }
    return script
  }

  /**
   * Get all persuasion scripts
   */
  getAllPersuasionScripts(): typeof PERSUASION_SCRIPTS {
    return PERSUASION_SCRIPTS
  }

  // ── Sentiment (§4.6) ───────────────────────────────────

  /**
   * Detect sentiment from text using keyword analysis
   * Lightweight version — no extra API call needed
   */
  detectSentiment(text: string): { sentiment: Sentiment | "neutral"; confidence: number; toneOverride: string } {
    if (!text) return { sentiment: "neutral", confidence: 0, toneOverride: "" }

    const lower = text.toLowerCase()

    const sentimentPatterns: Array<{ sentiment: Sentiment; patterns: RegExp[] }> = [
      {
        sentiment: "angry",
        patterns: [/frustrat(ing|ed|ion)/, /annoy(ing|ed)/, /terrible/, /awful/, /worst/, /useless/, /ridiculous/, /unacceptable/, /not happy/, /pissed/, /angry/],
      },
      {
        sentiment: "skeptical",
        patterns: [/skepti(c|cal)/, /doubt/, /prove it/, /really\?/, /show me/, /too good/, /sounds fake/, /hard to believe/, /i'll believe it when/, /sure it/],
      },
      {
        sentiment: "excited",
        patterns: [/excit(ed|ing)/, /amazing/, /love it/, /can't wait/, /wow/, /awesome/, /great/, /perfect/, /finally/, /incredible/],
      },
      {
        sentiment: "curious",
        patterns: [/how does/, /tell me more/, /interesting/, /curious/, /how\?/, /what about/, /does it/, /can it/, /explain/],
      },
      {
        sentiment: "confused",
        patterns: [/confus(ed|ing)/, /don't understand/, /unclear/, /what do you mean/, /can you explain/, /complicated/, /too complex/, /not sure i follow/],
      },
      {
        sentiment: "busy",
        patterns: [/busy/, /hurry/, /quick/, /short/, /brief/, /not much time/, /in a meeting/, /on the go/, /driving/, /in a rush/],
      },
      {
        sentiment: "indifferent",
        patterns: [/whatever/, /fine/, /ok/, /sure/, /i guess/, /don't care/, /doesn't matter/, /not really/, /maybe/, /i'll think about it/],
      },
    ]

    let bestMatch: Sentiment | "neutral" = "neutral"
    let bestScore = 0

    for (const entry of sentimentPatterns) {
      let score = 0
      for (const pattern of entry.patterns) {
        if (pattern.test(lower)) {
          score += 1
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = entry.sentiment
      }
    }

    if (bestMatch === "neutral" || bestScore === 0) {
      return { sentiment: "neutral", confidence: 0, toneOverride: "" }
    }

    const confidence = Math.min(bestScore / 3, 1)

    return {
      sentiment: bestMatch as Sentiment,
      confidence,
      toneOverride: SENTIMENT_TONE_MAP[bestMatch as Sentiment]?.systemOverride ?? "",
    }
  }

  /**
   * Get tone adjustment for a sentiment
   */
  getToneAdjustment(sentiment: Sentiment): { shift: string; languagePattern: string; systemOverride: string } {
    return SENTIMENT_TONE_MAP[sentiment] ?? {
      shift: "Neutral — Standard approach",
      languagePattern: "",
      systemOverride: "",
    }
  }

  // ── System Prompt Builder (§Appendix A) ─────────────────

  /**
   * Build a complete system prompt for the AI agent
   */
  buildSystemPrompt(input: SystemPromptInput): string {
    const { personality: personalityType, lead, stage, channel, turnNumber, objectionFramework, conversationHistory } = input
    const profile = PERSONALITIES[personalityType]

    const sentimentInstruction = lead.sentiment
      ? SENTIMENT_TONE_MAP[lead.sentiment]?.systemOverride ?? ""
      : ""

    const objectionInstruction = objectionFramework
      ? `Use '${this.frameworkToInstruction(objectionFramework)}' framework for objection handling.`
      : ""

    const historyText = conversationHistory
      ? conversationHistory.slice(-5).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")
      : "No previous conversation history."

    return `You are an AI sales agent for DREAM.CO, an AI sales outsourcing company.

PERSONALITY: ${personalityType.toUpperCase()}
  - ${profile.systemInstruction}

${sentimentInstruction}

${objectionInstruction}

PROSPECT INFO:
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Role: ${lead.title || "Unknown"}
- Industry: ${lead.industry || "Unknown"}
- Pain Points: ${lead.painPoints?.join(", ") || "Not yet identified"}
- Previous Objections: ${lead.previousObjections?.join(", ") || "None"}
- Objection Status: ${lead.objectionStatus || "Not applicable"}
- Sentiment: ${lead.sentiment || "neutral"}
- Stage: ${stage}
- Score: ${lead.score ?? "Not scored yet"}

CURRENT CHANNEL: ${channel}
TURN NUMBER: ${turnNumber}

RULES:
1. Never say "as an AI" or acknowledge you're artificial unless directly asked
2. Drive every conversation toward booking a meeting
3. Keep phone responses to 2-3 sentences maximum
4. Use "${objectionFramework || "feel_felt_found"}" framework for objection handling
5. Reference previous conversations naturally
6. Be specific about numbers and results
7. Ask permission before going into detail
8. Use assumptive closes when appropriate
9. If interrupted, stop and address the interruption
10. Never make up facts about pricing or features

AVAILABLE ACTIONS (call functions when needed):
- lookup_company_info(company_name)
- check_calendar_availability(date_range)
- book_appointment(prospect_email, datetime, duration)
- send_email(to, subject, body)
- update_crm(prospect_id, status, notes, next_action)
- get_pricing(plan)

CONVERSATION HISTORY (last 5 turns):
${historyText}

PROSPECT JUST SAID: {input}

Respond naturally, driving toward a booked meeting.`
  }

  private frameworkToInstruction(framework: ObjectionFramework): string {
    const map: Record<ObjectionFramework, string> = {
      feel_felt_found: "Feel-Felt-Found: Validate feeling → Share similar story → Present outcome",
      sandler: "Sandler: Acknowledge → Question to surface pain → Contrast pain vs cost",
      laer: "LAER: Listen → Acknowledge → Explore → Respond",
      spin: "SPIN: Situation → Problem → Implication → Need-payoff",
      value_compression: "Value compression: Show how solution saves time → Ask low-commitment question",
      specific_questioning: "Specific questioning: Ask clarifying questions to isolate the real objection",
      urgency_social_proof: "Urgency + Social proof: Create scarcity while showing similar cases",
      commitment_specificity: "Commitment + Specificity: Get a specific commitment on timeline",
      scaled_offering: "Scaled offering: Propose a scaled-down, no-risk entry point",
      enterprise_authority: "Enterprise authority: Lead with credentials, references, compliance",
      factual_social_proof: "Factual + Social proof: Cite security certifications and reference clients",
      social_proof_specifics: "Social proof + specifics: Name specific clients, metrics, and case studies",
      direct_demo_close: "Direct demo close: Assume agreement and propose a specific time",
      adoption_framework: "Adoption framework: Address change management, offer training and pilot",
      creative_budget: "Creative budget: Offer risk-free pilot, ROI guarantee, or phased rollout",
    }
    return map[framework] || framework.replace(/_/g, " ")
  }

  // ── OpenAI Integration ──────────────────────────────────

  /**
   * Get a streaming response from the AI
   * Returns a ReadableStream for real-time output
   */
  async getStreamingResponse(input: StreamingResponseInput): Promise<ReadableStream<string>> {
    const { messages, leadContext, personality: personalityType, stage, channel, functions, temperature, maxTokens } = input

    // Build the full system prompt if we have context
    let systemMessage: string | undefined
    if (leadContext) {
      systemMessage = this.buildSystemPrompt({
        personality: personalityType || "consultant",
        lead: leadContext,
        stage: stage || "initial",
        channel: channel || "email",
        turnNumber: messages.length + 1,
        conversationHistory: messages,
      })
    }

    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemMessage
      ? [{ role: "system", content: systemMessage }, ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))]
      : messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast & cost-effective (§5.3)
      messages: allMessages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 500,
      stream: true,
      tools: functions
        ? [
            {
              type: "function",
              function: {
                name: "lookup_company_info",
                description: "Look up company details from CRM",
                parameters: {
                  type: "object",
                  properties: {
                    company_name: { type: "string" },
                    domain: { type: "string" },
                  },
                  required: ["company_name"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "check_calendar_availability",
                description: "Check available meeting slots",
                parameters: {
                  type: "object",
                  properties: {
                    date_range: { type: "string" },
                    duration_minutes: { type: "number" },
                  },
                  required: ["date_range"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "book_appointment",
                description: "Book a meeting in the calendar",
                parameters: {
                  type: "object",
                  properties: {
                    prospect_email: { type: "string" },
                    prospect_name: { type: "string" },
                    datetime: { type: "string", description: "ISO datetime" },
                    duration_minutes: { type: "number" },
                  },
                  required: ["prospect_email", "prospect_name", "datetime"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "send_email",
                description: "Send an email to the prospect",
                parameters: {
                  type: "object",
                  properties: {
                    to: { type: "string" },
                    subject: { type: "string" },
                    body: { type: "string" },
                  },
                  required: ["to", "subject", "body"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "update_crm",
                description: "Update CRM record with conversation notes",
                parameters: {
                  type: "object",
                  properties: {
                    prospect_id: { type: "string" },
                    status: { type: "string" },
                    notes: { type: "string" },
                    next_action: { type: "string" },
                  },
                  required: ["prospect_id"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "get_pricing",
                description: "Get pricing information for a specific plan",
                parameters: {
                  type: "object",
                  properties: {
                    plan: { type: "string", enum: ["starter", "professional", "enterprise"] },
                    seats: { type: "number" },
                  },
                  required: ["plan"],
                },
              },
            },
          ]
        : undefined,
    })

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            controller.enqueue(delta)
          }
        }
        controller.close()
      },
    })
  }

  /**
   * Non-streaming response (for quick requests)
   */
  async getResponse(input: StreamingResponseInput): Promise<string> {
    const { messages, leadContext, personality: personalityType, stage, channel, functions, temperature, maxTokens } = input

    let systemMessage: string | undefined
    if (leadContext) {
      systemMessage = this.buildSystemPrompt({
        personality: personalityType || "consultant",
        lead: leadContext,
        stage: stage || "initial",
        channel: channel || "email",
        turnNumber: messages.length + 1,
        conversationHistory: messages,
      })
    }

    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemMessage
      ? [{ role: "system", content: systemMessage }, ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))]
      : messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: allMessages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 500,
      stream: false,
      tools: functions
        ? [
            {
              type: "function",
              function: {
                name: "lookup_company_info",
                description: "Look up company details from CRM",
                parameters: {
                  type: "object",
                  properties: { company_name: { type: "string" }, domain: { type: "string" } },
                  required: ["company_name"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "check_calendar_availability",
                description: "Check available meeting slots",
                parameters: {
                  type: "object",
                  properties: { date_range: { type: "string" }, duration_minutes: { type: "number" } },
                  required: ["date_range"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "book_appointment",
                description: "Book a meeting in the calendar",
                parameters: {
                  type: "object",
                  properties: {
                    prospect_email: { type: "string" },
                    prospect_name: { type: "string" },
                    datetime: { type: "string", description: "ISO datetime" },
                    duration_minutes: { type: "number" },
                  },
                  required: ["prospect_email", "prospect_name", "datetime"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "send_email",
                description: "Send an email to the prospect",
                parameters: {
                  type: "object",
                  properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } },
                  required: ["to", "subject", "body"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "update_crm",
                description: "Update CRM record with conversation notes",
                parameters: {
                  type: "object",
                  properties: {
                    prospect_id: { type: "string" },
                    status: { type: "string" },
                    notes: { type: "string" },
                    next_action: { type: "string" },
                  },
                  required: ["prospect_id"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "get_pricing",
                description: "Get pricing information for a specific plan",
                parameters: {
                  type: "object",
                  properties: { plan: { type: "string", enum: ["starter", "professional", "enterprise"] }, seats: { type: "number" } },
                  required: ["plan"],
                },
              },
            },
          ]
        : undefined,
    })

    return response.choices[0]?.message?.content || ""
  }
}

// ── Singleton export ──────────────────────────────────────

export const conversationEngine = new ConversationEngine()
