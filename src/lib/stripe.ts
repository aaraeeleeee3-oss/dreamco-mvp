import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia" as any,
      typescript: true,
    })
  }
  return stripeInstance
}

export const PLANS = {
  free: {
    name: "Free Trial",
    priceId: null,
    price: 0,
    leads_limit: 20,
    emails_limit: 50,
    ai_chat: true,
    team_members: 1,
    trial_days: 7,
  },
  starter: {
    name: "Starter",
    priceId: "price_starter",
    price: 49,
    leads_limit: 500,
    emails_limit: 1000,
    ai_chat: true,
    team_members: 3,
    trial_days: 7,
  },
  growth: {
    name: "Growth",
    priceId: "price_growth",
    price: 149,
    leads_limit: 5000,
    emails_limit: 10000,
    ai_chat: true,
    team_members: 10,
    trial_days: 7,
  },
  scale: {
    name: "Scale",
    priceId: "price_scale",
    price: 399,
    leads_limit: -1,
    emails_limit: -1,
    ai_chat: true,
    team_members: -1,
    trial_days: 7,
  },
} as const

export type PlanType = keyof typeof PLANS