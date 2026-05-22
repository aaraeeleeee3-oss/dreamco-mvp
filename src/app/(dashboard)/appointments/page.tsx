"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils"
import type { Appointment } from "@/types"

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  scheduled: "default", completed: "success", cancelled: "destructive", rescheduled: "warning",
}

export default function AppointmentsPage() {
  const supabase = createClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("*, leads(first_name, last_name)").order("start_time", { ascending: false })
      return data || []
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage scheduled meetings with prospects</p>
        </div>
        <div className="flex gap-2">
          <Link href="/appointments/book">
            <Button variant="outline"><ExternalLink className="mr-2 h-4 w-4" /> Booking Page</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Appointments</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : !appointments || appointments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4" />
              <p className="font-medium">No appointments</p>
              <p className="text-sm">Share your booking page to start scheduling</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt: any) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-medium">{apt.title}</TableCell>
                    <TableCell>{apt.leads?.first_name} {apt.leads?.last_name || "-"}</TableCell>
                    <TableCell>{formatDateTime(apt.start_time)}</TableCell>
                    <TableCell><Badge variant={statusColors[apt.status] || "default"}>{apt.status}</Badge></TableCell>
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