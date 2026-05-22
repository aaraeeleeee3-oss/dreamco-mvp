"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock, Check } from "lucide-react"
import toast from "react-hot-toast"

// Generate time slots
const generateTimeSlots = () => {
  const slots = []
  for (let h = 9; h <= 17; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`)
    if (h < 17) slots.push(`${h.toString().padStart(2, "0")}:30`)
  }
  return slots
}

// Generate next 7 days
const generateDays = () => {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const [step, setStep] = useState<"date" | "info" | "confirm">("date")
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)

  const days = generateDays()
  const timeSlots = generateTimeSlots()

  const handleBook = async () => {
    if (!selectedDay || !selectedTime || !form.name || !form.email) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)

    const [hours, minutes] = selectedTime.split(":").map(Number)
    const startTime = new Date(selectedDay)
    startTime.setHours(hours, minutes, 0)
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 1)

    try {
      // Look up the organization by slug
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", params.slug)
        .single()

      if (!org) {
        toast.error("Organization not found")
        setSubmitting(false)
        return
      }

      // Create lead
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          organization_id: org.id,
          first_name: form.name.split(" ")[0] || form.name,
          last_name: form.name.split(" ").slice(1).join(" ") || ".",
          email: form.email,
          phone: form.phone || null,
          source: "web",
          status: "booked",
          notes: "Booked via public booking page",
        })
        .select()
        .single()

      if (leadErr) throw leadErr

      // Create appointment
      const { error: aptErr } = await supabase
        .from("appointments")
        .insert({
          organization_id: org.id,
          lead_id: lead.id,
          title: `Meeting with ${form.name}`,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "scheduled",
        })

      if (aptErr) throw aptErr

      setStep("confirm")
      toast.success("Appointment booked!")
    } catch (err: any) {
      toast.error(err.message || "Failed to book")
    }

    setSubmitting(false)
  }

  const formatDay = (d: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return { dayName: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Your appointment has been scheduled. You&apos;ll receive a confirmation email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {form.name}</p>
              <p><strong>Email:</strong> {form.email}</p>
              {selectedDay && selectedTime && (
                <p>
                  <strong>Time:</strong>{" "}
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at {selectedTime}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Book a Meeting</CardTitle>
          <CardDescription>
            Select a date and time that works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Select a Day</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day) => {
                const fmt = formatDay(day)
                const isSelected = selectedDay?.toDateString() === day.toDateString()
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDay(day); setSelectedTime(null) }}
                    className={`flex flex-col items-center min-w-[72px] rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    } ${isToday(day) ? "bg-muted" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{fmt.dayName}</span>
                    <span className="text-xl font-bold">{fmt.date}</span>
                    <span className="text-xs text-muted-foreground">{fmt.month}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDay && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Select a Time</Label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time
                  // Grey out past times for today
                  const [h, m] = time.split(":").map(Number)
                  const slotDate = new Date(selectedDay)
                  slotDate.setHours(h, m)
                  const isPast = slotDate < new Date()

                  return (
                    <button
                      key={time}
                      disabled={isToday(selectedDay) && isPast}
                      onClick={() => setSelectedTime(time)}
                      className={`flex items-center justify-center gap-1 rounded-md border p-2 text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : isPast
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {selectedTime && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleBook}
                disabled={submitting || !form.name || !form.email}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}