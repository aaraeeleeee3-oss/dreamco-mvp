"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { useState } from "react"
import { Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function AnalyticsPage() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState("30d")

  const { data: stats } = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: async () => {
      const { data: leads } = await supabase.from("leads").select("*")
      const { data: deals } = await supabase.from("deals").select("*")
      const { data: appointments } = await supabase.from("appointments").select("*")
      const { data: emails } = await supabase.from("campaign_emails").select("*")

      const leadsList = leads || []
      const dealsList = deals || []
      const appointmentsList = appointments || []
      const emailsList = emails || []

      // Source breakdown
      const sourceMap: Record<string, number> = {}
      leadsList.forEach((l: any) => {
        sourceMap[l.source || "unknown"] = (sourceMap[l.source || "unknown"] || 0) + 1
      })

      // Stage breakdown
      const stageMap: Record<string, number> = {}
      dealsList.forEach((d: any) => {
        stageMap[d.stage || "unknown"] = (stageMap[d.stage || "unknown"] || 0) + 1
      })

      // Stage amounts
      const stageAmount: Record<string, number> = {}
      dealsList.forEach((d: any) => {
        stageAmount[d.stage || "unknown"] = (stageAmount[d.stage || "unknown"] || 0) + Number(d.amount || 0)
      })

      return {
        total_leads: leadsList.length,
        total_deals: dealsList.length,
        total_appointments: appointmentsList.length,
        total_emails_sent: emailsList.length,
        emails_opened: emailsList.filter((e: any) => e.opened_at).length,
        conversion_rate: leadsList.length > 0
          ? Math.round((dealsList.filter((d: any) => d.stage === "closed_won").length / leadsList.length) * 100)
          : 0,
        pipeline_value: dealsList.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
        leads_by_source: Object.entries(sourceMap).map(([name, value]) => ({ name, value })),
        deals_by_stage: Object.entries(stageMap).map(([name, count]) => ({
          name,
          count,
          amount: stageAmount[name] || 0,
        })),
      }
    },
  })

  if (!stats) return <div className="flex justify-center py-12">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your sales performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Leads</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total_leads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.conversion_rate}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pipeline Value</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{formatCurrency(stats.pipeline_value)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Appointments</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total_appointments}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Sources */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Leads by Source</CardTitle></CardHeader>
          <CardContent>
            {stats.leads_by_source.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.leads_by_source}
                      cx="50%" cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.leads_by_source.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals by Stage */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            {stats.deals_by_stage.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.deals_by_stage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Performance */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Email Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.total_emails_sent}</div>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.emails_opened}</div>
                <p className="text-xs text-muted-foreground">Opened</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats.total_emails_sent > 0
                    ? `${Math.round((stats.emails_opened / stats.total_emails_sent) * 100)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Deals</span><span className="font-bold">{stats.total_deals}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Appointments Booked</span><span className="font-bold">{stats.total_appointments}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Emails Sent</span><span className="font-bold">{stats.total_emails_sent}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Open Rate</span><span className="font-bold">{stats.total_emails_sent > 0 ? `${Math.round((stats.emails_opened / stats.total_emails_sent) * 100)}%` : "0%"}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}