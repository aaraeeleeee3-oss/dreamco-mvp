"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, Key, CreditCard, UserPlus } from "lucide-react"
import toast from "react-hot-toast"

export default function AdminPage() {
  const supabase = createClient()

  const { data: orgUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return []
      const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.user.id).single()
      if (!profile) return []
      const { data: users } = await supabase.from("users").select("*").eq("organization_id", profile.organization_id)
      return users || []
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Manage your organization settings</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Team</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" /> Billing</TabsTrigger>
          <TabsTrigger value="api"><Key className="mr-2 h-4 w-4" /> API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage who has access to your organization</CardDescription>
              </div>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Invite</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgUsers?.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "Unnamed"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Subscription</CardTitle><CardDescription>Manage your plan and billing</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-muted-foreground">50 leads, 100 emails/month</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Starter", price: "$97/mo", leads: "500", emails: "1,000" },
                  { name: "Professional", price: "$297/mo", leads: "5,000", emails: "10,000" },
                  { name: "Enterprise", price: "$997/mo", leads: "Unlimited", emails: "Unlimited" },
                ].map((plan) => (
                  <Card key={plan.name} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-2xl font-bold text-foreground">{plan.price}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{plan.leads} leads</p>
                      <p>{plan.emails} emails/mo</p>
                      <p>AI chat included</p>
                      <Button className="w-full mt-2" variant="outline">Upgrade</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Manage API access for integrations</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>No API keys created yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}