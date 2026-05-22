"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft, Send, Bot, User, Sparkles, Mail, BarChart3, Lightbulb, Loader2,
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatDateTime } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Lead, LeadActivity, ChatMessage } from "@/types"

const statusColors: Record<string, "default" | "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  new: "default", contacted: "secondary", qualified: "warning",
  proposal: "warning", won: "success", lost: "destructive",
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  // Fetch lead
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", params.id],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").eq("id", params.id).single()
      return data as Lead
    },
  })

  // Fetch activities
  const { data: activities } = useQuery({
    queryKey: ["lead-activities", params.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", params.id)
        .order("created_at", { ascending: false })
        .limit(10)
      return (data || []) as LeadActivity[]
    },
  })

  // Fetch chat messages
  const { data: messages } = useQuery({
    queryKey: ["lead-chat", params.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return []
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("lead_id", params.id)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: true })
      return (data || []) as ChatMessage[]
    },
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  // Send chat message with streaming support
  const sendMessage = useMutation({
    mutationFn: async ({ content, useStream }: { content: string; useStream?: boolean }) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      // Save user message
      await supabase.from("chat_messages").insert({
        lead_id: params.id,
        user_id: user.user.id,
        role: "user",
        content,
      })

      // Get AI response
      const leadContext = lead
        ? `Name: ${lead.first_name} ${lead.last_name}\nCompany: ${lead.company}\nTitle: ${lead.title}\nStatus: ${lead.status}\nScore: ${lead.score}\nNotes: ${lead.notes}`
        : ""

      if (useStream) {
        setIsStreaming(true)
        setStreamingContent("")

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "user", content },
              ...(messages || []).slice(-10).map((m) => ({ role: m.role, content: m.content })),
            ],
            leadContext,
            stream: true,
          }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Stream request failed")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let fullContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          setStreamingContent(fullContent)
        }

        // Save complete AI response to DB
        await supabase.from("chat_messages").insert({
          lead_id: params.id,
          user_id: user.user.id,
          role: "assistant",
          content: fullContent,
        })

        setIsStreaming(false)
        setStreamingContent("")
        return fullContent
      }

      // Non-streaming fallback
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content },
            ...(messages || []).slice(-10).map((m) => ({ role: m.role, content: m.content })),
          ],
          leadContext,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "AI request failed")

      // Save AI response
      await supabase.from("chat_messages").insert({
        lead_id: params.id,
        user_id: user.user.id,
        role: "assistant",
        content: data.response,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-chat", params.id] })
      setMessage("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Update lead status
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", params.id)
      if (error) throw error
      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: params.id,
        type: "status_change",
        description: `Status changed to ${status}`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", params.id] })
      queryClient.invalidateQueries({ queryKey: ["lead-activities", params.id] })
      toast.success("Status updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Quick AI actions
  const quickActions = [
    {
      label: "Generate Email",
      icon: Mail,
      action: () => sendMessage.mutate({ content: `Write a cold email for ${lead?.first_name} ${lead?.last_name} at ${lead?.company}`, useStream: true }),
    },
    {
      label: "Analyze Lead",
      icon: BarChart3,
      action: () => sendMessage.mutate({ content: `Analyze this lead: ${lead?.first_name} ${lead?.last_name} from ${lead?.company}. What's their fit score and recommended approach?`, useStream: true }),
    },
    {
      label: "Suggest Next Step",
      icon: Lightbulb,
      action: () => sendMessage.mutate({ content: `What should I do next with ${lead?.first_name} ${lead?.last_name} who is currently at status "${lead?.status}"?`, useStream: true }),
    },
  ]

  if (isLoading) return <div className="flex justify-center py-12">Loading...</div>
  if (!lead) return <div className="flex justify-center py-12">Lead not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{lead.first_name} {lead.last_name}</h1>
            <Badge variant={statusColors[lead.status]}>{lead.status}</Badge>
          </div>
          <p className="text-muted-foreground">{lead.company} · {lead.title}</p>
        </div>
        <Select value={lead.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{lead.email || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{lead.phone || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Source</p><p className="font-medium capitalize">{lead.source}</p></div>
              <div><p className="text-sm text-muted-foreground">Score</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="text-sm font-medium">{lead.score}/100</span>
                </div>
              </div>
              <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{formatDate(lead.created_at)}</p></div>
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{lead.notes}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>
              {!activities || activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="text-sm border-l-2 border-muted pl-3">
                      <p className="font-medium capitalize">{a.type}</p>
                      <p className="text-muted-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={action.action}>
                <action.icon className="mr-1 h-3 w-3" /> {action.label}
              </Button>
            ))}
          </div>

          {/* Chat */}
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Sales Assistant</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {!messages || messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4" />
                  <p className="font-medium">AI Assistant ready</p>
                  <p className="text-sm">Ask me to analyze this lead, write emails, or suggest next steps</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`rounded-full p-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Streaming content display */}
              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="rounded-full p-2 bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg p-3 bg-muted">
                      <p className="text-sm whitespace-pre-wrap">
                        {streamingContent}
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (message.trim()) sendMessage.mutate({ content: message, useStream: true })
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask the AI assistant..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}