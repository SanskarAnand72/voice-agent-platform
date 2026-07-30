import type React from "react"
import { AppSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      {/* Fixed sidebar */}
      <AppSidebar />

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="animate-page-in">
          {children}
        </div>
      </main>
    </div>
  )
}
