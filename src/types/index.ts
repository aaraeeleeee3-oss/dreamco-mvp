export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  organization_id: string
  role: "admin" | "agent" | "client"
}

export interface Lead {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  title?: string
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
  source: "manual" | "csv" | "web" | "referral" | "linkedin" | "ai_scraped"
  score: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  type: "note" | "email" | "call" | "meeting" | "status_change" | "system"
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Deal {
  id: string
  organization_id: string
  lead_id: string
  name: string
  amount: number
  stage: string
  probability: number
  expected_close_date?: string
  created_at: string
}

export interface Campaign {
  id: string
  organization_id: string
  name: string
  status: "draft" | "active" | "paused" | "completed"
  type: "email" | "linkedin" | "multichannel"
  created_at: string
}

export interface CampaignEmail {
  id: string
  campaign_id: string
  lead_id: string
  subject: string
  body: string
  sent_at?: string
  opened_at?: string
  replied_at?: string
  bounced?: boolean
}

export interface ChatMessage {
  id: string
  lead_id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
}

export interface Appointment {
  id: string
  organization_id: string
  lead_id: string
  title: string
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  calendar_event_id?: string
  created_at: string
}

export interface OrganizationPlan {
  id: string
  organization_id: string
  plan_type: "free" | "starter" | "professional" | "enterprise"
  status: "active" | "canceled" | "past_due"
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

export interface AnalyticsSummary {
  total_leads: number
  conversion_rate: number
  pipeline_value: number
  meetings_booked: number
  emails_sent: number
  emails_opened: number
  leads_by_source: { source: string; count: number }[]
  deals_by_stage: { stage: string; count: number; amount: number }[]
  revenue_over_time: { date: string; revenue: number }[]
  lead_trend: { date: string; count: number }[]
}