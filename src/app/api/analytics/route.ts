import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const { data: user } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch aggregated analytics
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", user.organization_id)

    const { data: deals } = await supabase
      .from("deals")
      .select("*")
      .eq("organization_id", user.organization_id)

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("organization_id", user.organization_id)

    const { data: emails } = await supabase
      .from("campaign_emails")
      .select("*")

    const leadCount = leads?.length || 0
    const dealCount = deals?.length || 0
    const wonDeals = deals?.filter((d: any) => d.stage === "closed_won").length || 0
    const pipelineValue = deals?.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0) || 0
    const appointmentCount = appointments?.length || 0
    const emailSent = emails?.length || 0
    const emailOpened = emails?.filter((e: any) => e.opened_at).length || 0

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {}
    leads?.forEach((l: any) => {
      const src = l.source || "unknown"
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1
    })

    return NextResponse.json({
      total_leads: leadCount,
      total_deals: dealCount,
      won_deals: wonDeals,
      conversion_rate: leadCount > 0 ? Math.round((wonDeals / leadCount) * 100) : 0,
      pipeline_value: pipelineValue,
      total_appointments: appointmentCount,
      emails_sent: emailSent,
      emails_opened: emailOpened,
      open_rate: emailSent > 0 ? Math.round((emailOpened / emailSent) * 100) : 0,
      leads_by_source: Object.entries(sourceBreakdown).map(([name, value]) => ({ name, value })),
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}