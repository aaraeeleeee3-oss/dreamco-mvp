import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    redirect("/dashboard")
  }

  redirect("/auth/login")
}