"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, Zap, TrendingUp, Calendar, MessageCircle, Phone, 
  BarChart3, Users, CheckCircle, ArrowRight, Star, Menu, X,
  Shield, Clock, DollarSign, Target, Sparkles, ChevronRight
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: MessageCircle,
    title: "AI Responds Instantly",
    desc: "Answers every lead in under 3 seconds. Never miss a customer again. Works 24/7/365.",
  },
  {
    icon: Phone,
    title: "AI Voice Agent",
    desc: "Natural voice conversations that book appointments. Your customers won't know it's AI.",
  },
  {
    icon: Zap,
    title: "Auto Follow-Up",
    desc: "AI follows up with every lead automatically until they book or opt out. No leads slip through.",
  },
  {
    icon: Calendar,
    title: "Smart Booking",
    desc: "AI books appointments directly into your calendar. Syncs with Google Calendar automatically.",
  },
  {
    icon: TrendingUp,
    title: "Qualifies Leads",
    desc: "AI scores and prioritizes leads using GPCT framework. Focus on hot leads first.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time metrics: response rates, bookings, conversion funnels. Know what's working.",
  },
]

const industries = [
  { name: "HVAC", color: "bg-blue-50 text-blue-700" },
  { name: "Plumbing", color: "bg-cyan-50 text-cyan-700" },
  { name: "Electrical", color: "bg-yellow-50 text-yellow-700" },
  { name: "Roofing", color: "bg-orange-50 text-orange-700" },
  { name: "Real Estate", color: "bg-green-50 text-green-700" },
  { name: "Dental", color: "bg-purple-50 text-purple-700" },
  { name: "Law Firms", color: "bg-red-50 text-red-700" },
  { name: "Solar", color: "bg-emerald-50 text-emerald-700" },
]

const plans = [
  {
    name: "Starter",
    price: "$997",
    period: "/month",
    desc: "For small businesses ready to automate sales",
    features: [
      "1 AI Sales Agent",
      "200 calls/month",
      "AI chat + email follow-up",
      "Lead management dashboard",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: "$2,497",
    period: "/month",
    desc: "For growing teams that need full automation",
    features: [
      "2 AI Sales Agents",
      "500 calls/month",
      "AI voice agent included",
      "Appointment booking system",
      "Multi-channel (email + SMS + chat)",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    price: "$4,997",
    period: "/month",
    desc: "For businesses ready to dominate their market",
    features: [
      "5 AI Sales Agents",
      "2,000 calls/month",
      "WhatsApp + Instagram outreach",
      "CRM integration (HubSpot/Salesforce)",
      "Custom AI training on your data",
      "Dedicated account manager",
      "99.9% uptime SLA",
    ],
    cta: "Talk to Sales",
    popular: false,
  },
]

const testimonials = [] // Placeholder for future social proof

const stats = [
  { value: "3 sec", label: "Average response time" },
  { value: "40%", label: "More appointments booked" },
  { value: "85%", label: "Leads followed up automatically" },
  { value: "24/7", label: "AI works around the clock" },
]

const faqs = [
  {
    q: "How fast can I get started?",
    a: "Most businesses are live within 48 hours. We train your AI agent on your business, set up your phone number, and integrate your calendar.",
  },
  {
    q: "Will customers know they're talking to AI?",
    a: "Our AI is trained on thousands of real sales conversations. Most customers can't tell — and they don't care because they get instant responses.",
  },
  {
    q: "What if the AI makes a mistake?",
    a: "Every conversation is logged and monitored. You can review transcripts, and if something needs human intervention, it escalates instantly.",
  },
  {
    q: "Can I customize what the AI says?",
    a: "Yes. You control the AI's script, tone, pricing info, and booking rules. It learns your business and sounds like your brand.",
  },
  {
    q: "What industries do you work with?",
    a: "We specialize in home services (HVAC, plumbing, electrical, roofing), real estate, dental practices, law firms, and solar companies.",
  },
]

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">DREAM.CO</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="text-sm">Get Started</Button>
              </Link>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-b px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm py-2">Features</a>
            <a href="#how-it-works" className="block text-sm py-2">How It Works</a>
            <a href="#pricing" className="block text-sm py-2">Pricing</a>
            <a href="#faq" className="block text-sm py-2">FAQ</a>
            <Link href="/auth/login" className="block text-sm py-2">Sign In</Link>
            <Link href="/auth/signup"><Button className="w-full">Get Started</Button></Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 px-4 py-1.5 text-sm" variant="secondary">
            ⚡ AI Sales Team — Live in 48 Hours
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your AI Sales Team
            <br />
            <span className="text-primary">Works While You Sleep</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            DREAM.CO gives you AI employees that answer every call, follow up with every lead, 
            and book more appointments — 24 hours a day, 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="text-base px-8">
                Claim Your AI Employee <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base px-8">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By - Industries */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-6">TRUSTED BY BUSINESSES IN</p>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map((ind, i) => (
              <Badge key={i} className={`px-4 py-2 text-sm ${ind.color}`} variant="outline">
                {ind.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Your AI Sales Team Does Everything</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From the first touch to the booked appointment — fully automated, fully intelligent.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                  <CardDescription className="text-base">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Your AI employee goes live in 48 hours</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect", desc: "Tell us about your business. We train the AI on your services, pricing, and schedule." },
              { step: "02", title: "Configure", desc: "Set your AI's voice, tone, and booking rules. Customize what it says and how it sells." },
              { step: "03", title: "Launch", desc: "Your AI employee goes live. It answers calls, chats leads, and books appointments." },
              { step: "04", title: "Scale", desc: "Track results in your dashboard. Add more AI agents as your business grows." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-3 py-1" variant="secondary">PRICING</Badge>
            <h2 className="text-4xl font-bold mb-4">Less Than One Human Dispatcher</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              An AI dispatcher costs $997/mo. A human dispatcher costs $3,500/mo + benefits + PTO.
              Your ROI is immediate.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 py-1 bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="text-base mt-2">{plan.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.popular ? "/auth/signup" : "/auth/signup"}>
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              All plans include 14-day free trial. No credit card required.{' '}
              <a href="#faq" className="text-primary hover:underline">See FAQ</a>
            </p>
          </div>
        </div>
      </section>

      {/* Risk Reversal */}
      <section className="py-20 bg-primary text-primary-foreground px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Triple Your Response Rate or Get Your First Month Free</h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            We're so confident DREAM.CO will transform your sales that we guarantee it. 
            If your response rate doesn't triple in 30 days, your first month is on us.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Shield, text: "30-Day Risk Free" },
              { icon: Clock, text: "Live in 48 Hours" },
              { icon: DollarSign, text: "Cancel Anytime" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-base px-8">
              Claim Your Risk-Free Trial <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-primary/10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Your First AI Employee Is Ready</h2>
          <p className="text-lg text-muted-foreground mb-8">
            48 hours from now, your AI sales team will be answering calls, following up with leads, and booking appointments.
            Your competitors are already automating. Don't get left behind.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-base px-10">
              Hire Your AI Employee Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">DREAM.CO</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI employees that never sleep, never call in sick, and never miss a lead.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><Link href="/auth/signup" className="hover:text-foreground">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Industries</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {industries.slice(0, 4).map((ind, i) => (
                  <li key={i}>{ind.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Contact: ayushigarg0302@gmail.com</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 DREAM.CO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
