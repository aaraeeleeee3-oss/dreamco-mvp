import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
  typescript: true,
})

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    price: 0,
    leads_limit: 50,
    emails_limit: 100,
    ai_chat: false,
    team_members: 1,
  },
  starter: {
    name: "Starter",
    priceId: "price_starter", // Replace with real Stripe price ID
    price: 97,
    leads_limit: 500,
    emails_limit: 1000,
    ai_chat: true,
    team_members: 3,
  },
  professional: {
    name: "Professional",
    priceId: "price_professional",
    price: 297,
    leads_limit: 5000,
    emails_limit: 10000,
    ai_chat: true,
    team_members: 10,
  },
  enterprise: {
    name: "Enterprise",
    priceId: "price_enterprise",
    price: 997,
    leads_limit: -1,
    emails_limit: -1,
    ai_chat: true,
    team_members: -1,
  },
} as const

export type PlanType = keyof typeof PLANS