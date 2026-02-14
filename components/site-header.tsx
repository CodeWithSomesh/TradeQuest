'use client'

import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useDemoMode } from "@/lib/demo-context"

const titleByPath: Record<string, string> = {
  '/dashboard': 'AI Coach Dashboard',
  '/dashboard/coach': 'AI Coach Dashboard',
  '/dashboard/learn': 'Market Insights',
  '/dashboard/social': 'Social Studio',
  '/dashboard/settings': 'Settings',
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = titleByPath[pathname ?? ''] ?? 'Dashboard'
  const { showDemoData, setShowDemoData } = useDemoMode()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/10 bg-[#0A0A0F] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-[#ededed] hover:bg-white/10" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-white/10"
        />
        <h1 className="text-base font-medium text-[#ededed]">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showDemoData ? "default" : "ghost"}
            size="sm"
            className={`hidden sm:flex ${showDemoData ? "bg-[#FF444F] hover:bg-[#E63946] text-white" : "text-[#ededed] hover:bg-white/10 hover:text-[#ededed]"}`}
            onClick={() => setShowDemoData(!showDemoData)}
          >
            Demo Data
          </Button>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex text-[#ededed] hover:bg-white/10 hover:text-[#ededed]">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
