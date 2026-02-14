"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBook2,
  IconBrandTiktok,
  IconDatabase,
  IconFileWord,
  IconInnerShadowTop,
  IconReport,
  IconSettings,
  IconBrain,
  IconLayoutDashboard,
  IconFileTextSpark,
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
import { NavDocuments } from "./nav-documents"

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
    // {
    //   title: "Social Studio",
    //   url: "/dashboard/social",
    //   icon: IconBrandTiktok,
    // },
    // {
    //   title: "Market Insights",
    //   url: "/dashboard/learn",
    //   icon: IconBook2,
    // },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
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
                <span className="relative text-2xl font-bold text-white">Deriv<span className="bg-[#FF444F] text-black rounded-md font-black p-1 ml-1">Hub</span></span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
