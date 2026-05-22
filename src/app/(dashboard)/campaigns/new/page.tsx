"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewCampaignPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", type: "email" as const, subject: "", body: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { toast.error("Not authenticated"); setLoading(false); return }

    const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.user.id).single()
    if (!profile) { toast.error("Profile not found"); setLoading(false); return }

    const { error } = await supabase.from("campaigns").insert({
      name: form.name,
      type: form.type,
      status: "draft",
      organization_id: profile.organization_id,
    })

    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success("Campaign created!"); router.push("/campaigns") }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/campaigns"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-3xl font-bold">New Campaign</h1><p className="text-muted-foreground">Create an email sequence</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle><CardDescription>Set up your outreach campaign</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Q2 Outreach" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="multichannel">Multi-channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-4">
              <Link href="/campaigns"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Campaign"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}