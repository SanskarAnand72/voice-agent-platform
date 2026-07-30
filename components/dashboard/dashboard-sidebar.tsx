"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Bot,
  Phone,
  BarChart3,
  Terminal,
  Webhook,
  KeyRound,
  Radio,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  Zap,
  type LucideIcon,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview",     href: "/dashboard",            icon: LayoutDashboard },
      { label: "Agents",       href: "/dashboard/agents",     icon: Bot },
      { label: "Call History", href: "/dashboard/calls",      icon: Phone },
      { label: "Analytics",    href: "/dashboard/analytics",  icon: BarChart3 },
    ],
  },
  {
    label: "Develop",
    items: [
      { label: "Playground",   href: "/dashboard/playground", icon: Terminal },
      { label: "Webhooks",     href: "/dashboard/webhooks",   icon: Webhook },
      { label: "API Keys",     href: "/dashboard/api-keys",   icon: KeyRound },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Live Monitor", href: "/dashboard/monitoring", icon: Radio },
      { label: "Team",         href: "/dashboard/team",       icon: Users },
      { label: "Settings",     href: "/dashboard/settings",   icon: Settings },
    ],
  },
]

// ─── NavItem Component ────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-2.5 py-2",
        "text-sm transition-all duration-150 ease-smooth",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isActive
          ? "bg-accent/10 text-accent-light"
          : "text-text-2 hover:bg-surface-2 hover:text-text-1",
        isCollapsed && "justify-center px-0"
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-accent" />
      )}

      <Icon
        className={cn(
          "shrink-0 size-4 transition-colors duration-150",
          isActive ? "text-accent" : "text-text-3 group-hover:text-text-2"
        )}
      />

      {!isCollapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}

      {!isCollapsed && item.badge && (
        <span className="ml-auto rounded-md border border-border-2 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-3 tabular-nums">
          {item.badge}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div
          className={cn(
            "pointer-events-none absolute left-full ml-3 z-50",
            "rounded-md border border-border-2 bg-elevated px-2.5 py-1.5",
            "text-xs font-medium text-text-1 whitespace-nowrap shadow-lg",
            "opacity-0 group-hover:opacity-100",
            "translate-x-1 group-hover:translate-x-0",
            "transition-all duration-150"
          )}
        >
          {item.label}
        </div>
      )}
    </Link>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }, [supabase, router])

  const isActive = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href),
    [pathname]
  )

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        // Layout
        "flex h-screen flex-col",
        "sticky top-0 shrink-0 overflow-hidden",
        // Visual
        "bg-surface border-r border-border",
        // Width transition
        "transition-[width] duration-200 ease-smooth",
        collapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      {/* ── Logo / Workspace ──────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center h-14 px-4 border-b border-border shrink-0",
          collapsed ? "justify-center px-0" : "gap-3"
        )}
      >
        {/* Logo mark */}
        <div className="size-7 rounded-lg bg-gradient-to-br from-accent to-teal flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="size-3.5 text-white" />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-1 truncate leading-none">VoiceAI</p>
            <p className="text-[10px] text-text-3 truncate mt-0.5 leading-none">Personal workspace</p>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {/* Group label */}
            {!collapsed && (
              <p className="section-label px-2.5 mb-2">{group.label}</p>
            )}
            {collapsed && (
              <div className="h-px bg-border mx-2 mb-2" />
            )}

            {/* Group items */}
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                isCollapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── New Agent CTA ─────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pb-3 shrink-0">
          <Link
            href="/dashboard/agents"
            className={cn(
              "flex items-center justify-center gap-2 w-full",
              "h-9 rounded-md text-xs font-medium",
              "bg-accent/10 text-accent-light border border-accent/20",
              "hover:bg-accent/20 hover:border-accent/40",
              "transition-all duration-150"
            )}
          >
            <Plus className="size-3.5" />
            New Agent
          </Link>
        </div>
      )}

      {/* ── Collapse toggle + user ────────────────────────────── */}
      <div className={cn(
        "shrink-0 border-t border-border",
        collapsed ? "p-2 flex flex-col gap-1 items-center" : "p-3"
      )}>
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-2 rounded-md px-2.5 py-2",
            "text-xs text-text-3 hover:bg-surface-2 hover:text-text-2",
            "transition-all duration-150 w-full",
            collapsed && "justify-center px-0 w-9 h-9"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2 rounded-md px-2.5 py-2 mt-0.5",
            "text-xs text-text-3 hover:bg-danger/10 hover:text-danger",
            "transition-all duration-150 w-full",
            collapsed && "justify-center px-0 w-9 h-9"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
