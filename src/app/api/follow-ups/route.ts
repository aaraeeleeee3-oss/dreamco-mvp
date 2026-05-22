import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/resend"
import { generateColdEmail } from "@/lib/openai"

// GET: Fetch pending follow-ups
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get follow-ups from the leads table (leads that need follow-up)
    const { data: pendingFollowUps } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, company, status, created_at")
      .eq("organization_id", user.organization_id)
      .in("status", ["new", "contacted"])
      .order("created_at", { ascending: true })
      .limit(20)

    return NextResponse.json({ follow_ups: pendingFollowUps || [] })
  } catch (error) {
    console.error("Follow-ups API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Trigger a follow-up email
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    const { leadId } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    // Get lead info
    const { data: lead } = await supabase
      .from("leads")
      .select("*, users!inner(organization_id)")
      .eq("id", leadId)
      .single()

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Generate AI email
    const emailContent = await generateColdEmail(
      `${lead.first_name} ${lead.last_name}`,
      lead.company || "",
      lead.title || "",
      "Following up on our conversation. Let me know if you have any questions."
    )

    // Send the email via Resend
    const { success, error: emailError } = await sendEmail({
      to: lead.email,
      subject: `Following up, ${lead.first_name}`,
      html: emailContent.replace(/\n/g, "<br/>"),
    })

    if (!success) {
      throw new Error(String(emailError) || "Failed to send email")
    }

    // Log the activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "email",
      description: `Follow-up email sent via AI`,
    })

    // Update lead status to contacted
    await supabase
      .from("leads")
      .update({ status: "contacted", updated_at: new Date().toISOString() })
      .eq("id", leadId)

    return NextResponse.json({
      success: true,
      message: `Follow-up sent to ${lead.first_name} ${lead.last_name}`,
    })
  } catch (error: any) {
    console.error("Follow-up send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send follow-up" },
      { status: 500 }
    )
  }
}