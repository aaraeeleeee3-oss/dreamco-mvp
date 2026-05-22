"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { usePathname } from "next/navigation"

const hiddenPaths = ["/auth/login", "/auth/signup", "/auth/callback", "/"]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = hiddenPaths.some((p) => pathname === p || pathname.startsWith(p))

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-6 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  )
}