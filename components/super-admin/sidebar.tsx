"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "/super-admin/organizations", icon: Building2 },
  { name: "All Users", href: "/super-admin/users", icon: Users },
  { name: "Messages", href: "/super-admin/messages", icon: MessageSquare },
  { name: "Revenue", href: "/super-admin/revenue", icon: CreditCard },
  { name: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/super-admin/settings", icon: Settings },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">ZinoSend</span>
            <span className="block text-xs text-amber-400">Super Admin</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? "bg-gray-700 text-amber-400"
                          : "text-gray-400 hover:text-white hover:bg-gray-700",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
