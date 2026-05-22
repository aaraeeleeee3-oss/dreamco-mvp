import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") || ""

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any
        const organizationId = session.metadata?.organization_id

        if (organizationId) {
          const supabase = createClient()
          await supabase
            .from("organization_plans")
            .upsert({
              organization_id: organizationId,
              plan_type: session.metadata?.plan_type || "starter",
              status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any
        const supabase = createClient()
        await supabase
          .from("organization_plans")
          .update({
            status: subscription.status === "active" ? "active" : "canceled",
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Stripe webhook error:", err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}