import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const campaignId = url.searchParams.get("campaign")
  const leadId = url.searchParams.get("lead")

  if (campaignId && leadId) {
    try {
      const supabase = createClient()
      await supabase
        .from("campaign_emails")
        .update({ opened_at: new Date().toISOString() })
        .eq("campaign_id", campaignId)
        .eq("lead_id", leadId)
        .is("opened_at", null)
    } catch (err) {
      console.error("Email tracking error:", err)
    }
  }

  // Return a 1x1 transparent pixel
  return new NextResponse(
    Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
    {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}