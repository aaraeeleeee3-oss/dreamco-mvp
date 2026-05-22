"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Plus, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import type { Deal } from "@/types"

const stageColors: Record<string, "default" | "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  discovery: "secondary", qualified: "warning", proposal: "default",
  negotiation: "warning", closed_won: "success", closed_lost: "destructive",
}

export default function DealsPage() {
  const supabase = createClient()

  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false })
      return (data || []) as Deal[]
    },
  })

  const totalPipeline = deals?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0

  const stages = ["discovery", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Track your sales pipeline</p>
        </div>
        <Link href="/leads/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Deal</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pipeline</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Deals</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{deals?.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).length || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals && deals.length > 0
                ? `${Math.round((deals.filter(d => d.stage === "closed_won").length / deals.length) * 100)}%`
                : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban-style pipeline */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
        {stages.map((stage) => {
          const stageDeals = deals?.filter((d) => d.stage === stage) || []
          const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0)
          return (
            <Card key={stage} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm capitalize">{stage.replace("_", " ")}</CardTitle>
                  <Badge variant={stageColors[stage]}>{stageDeals.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatCurrency(stageTotal)}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageDeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No deals</p>
                ) : (
                  stageDeals.map((deal) => (
                    <div key={deal.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-muted-foreground">{formatCurrency(deal.amount)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className="text-xs">{deal.probability}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}