"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBook2,
  IconInnerShadowTop,
  IconSettings,
  IconBrain,
  IconLayoutDashboard,
  IconFileTextSpark,
  IconStar,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useGamification } from "@/lib/gamification-context"
import { getProfile } from "@/lib/user-profile"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "AI Coach",
      url: "/dashboard/coach",
      icon: IconBrain,
    },
    {
      title: "Quests",
      url: "/dashboard/quests",
      icon: IconFileTextSpark,
    },
    {
      title: "Market Insights",
      url: "/dashboard/learn",
      icon: IconBook2,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ],
}

function XPDisplay() {
  const { xp, level, xpProgressPercent, completedQuestIds } = useGamification()
  const [name, setName] = React.useState<string>('')

  React.useEffect(() => {
    const profile = getProfile()
    if (profile?.full_name) setName(profile.full_name)
  }, [])

  return (
    <div className="mx-2 mb-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <IconStar className="size-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400">Level {level}</span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${xpProgressPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {completedQuestIds.size} quest{completedQuestIds.size !== 1 ? 's' : ''} done
        </span>
        {name && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{name}</span>
        )}
      </div>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/" className="flex items-center gap-2">
                <IconInnerShadowTop className="!size-5 text-[#FF444F]" />
                <span className="relative text-2xl font-bold text-white">Trade<span className="bg-[#FF444F] text-black rounded-md font-black p-1 ml-1">Quest</span></span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <XPDisplay />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
