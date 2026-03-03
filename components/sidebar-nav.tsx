"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Upload,
  LineChart,
  Layers,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Data Upload", icon: Upload },
  { href: "/prediction", label: "Prediction", icon: LineChart },
  { href: "/clustering", label: "Clustering", icon: Layers },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/chatbot", label: "AI Assistant", icon: MessageSquare },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-semibold text-lg text-sidebar-foreground">SoilPredict</span>}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  collapsed && "justify-center px-2",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="w-full justify-center">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  )
}
