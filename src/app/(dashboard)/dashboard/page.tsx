"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Calendar, Mail, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

const stats = [
  { name: "Total Leads", value: "0", icon: Users, change: "+0%", href: "/leads" },
  { name: "Pipeline Value", value: "$0", icon: TrendingUp, change: "+0%", href: "/deals" },
  { name: "Appointments", value: "0", icon: Calendar, change: "+0", href: "/appointments" },
  { name: "Emails Sent", value: "0", icon: Mail, change: "+0%", href: "/campaigns" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your AI sales command center</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/leads/new">
              <Button variant="outline" className="w-full justify-between">
                Import Leads <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="outline" className="w-full justify-between">
                Create Campaign <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/appointments/book">
              <Button variant="outline" className="w-full justify-between">
                Share Booking Link <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>No recent activity. Start by adding your first lead!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Sales Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg bg-primary/5 p-4">
            <div className="flex-1">
              <h3 className="font-semibold">Your AI SDR is ready</h3>
              <p className="text-sm text-muted-foreground">
                Use the AI chat to generate cold emails, analyze leads, and get next-step recommendations.
              </p>
            </div>
            <Link href="/leads">
              <Button variant="secondary">
                Try It <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}