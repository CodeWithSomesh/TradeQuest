'use client'

import { DemoProvider } from "@/lib/demo-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-[#0A0A0F] text-[#ededed]">
        <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col bg-[#0A0A0F]">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </div>
    </DemoProvider>
  )
}
