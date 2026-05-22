"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Calendar, Copy, Check } from "lucide-react"

export default function BookPage() {
  const [copied, setCopied] = useState(false)
  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/appointments/book`

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Book a Meeting</h1>
        <p className="text-muted-foreground">Share this link with prospects to book time with you</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Your Booking Link</CardTitle><CardDescription>Share this link with prospects</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={bookingUrl} readOnly className="flex-1" />
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Prospects can use this link to see your availability and book a meeting directly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Availability</CardTitle><CardDescription>Set your available hours</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" defaultValue="17:00" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <Button key={day} variant="outline" className="flex-1">{day}</Button>
            ))}
          </div>
          <Button>Save Availability</Button>
        </CardContent>
      </Card>
    </div>
  )
}