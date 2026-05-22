"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Mail, Play, Pause } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { Campaign } from "@/types"

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  draft: "secondary", active: "success", paused: "warning", completed: "default",
}

export default function CampaignsPage() {
  const supabase = createClient()

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false })
      return (data || []) as Campaign[]
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Create and manage email sequences</p>
        </div>
        <Link href="/campaigns/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Campaign</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>All Campaigns</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mb-4" />
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm mb-4">Create your first email campaign</p>
              <Link href="/campaigns/new"><Button><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="capitalize">{c.type}</TableCell>
                    <TableCell><Badge variant={statusColors[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Pause className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}