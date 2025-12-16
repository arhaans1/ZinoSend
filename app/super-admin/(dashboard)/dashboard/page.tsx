"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  Users,
  MessageSquare,
  CreditCard,
  Contact2,
  Send,
  TrendingUp,
  IndianRupee,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
  overview: {
    totalOrganizations: number
    totalUsers: number
    totalMessages: number
    totalContacts: number
    totalBroadcasts: number
    totalRevenue: number
    totalMessageCost: number
  }
  recentOrganizations: Array<{
    id: string
    name: string
    slug: string
    plan: string
    usersCount: number
    contactsCount: number
    messagesCount: number
    createdAt: string
  }>
  topOrganizations: Array<{
    id: string
    name: string
    slug: string
    plan: string
    walletBalance: number
    usersCount: number
    contactsCount: number
    messagesCount: number
    totalTopUps: number
    createdAt: string
  }>
}

const planColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  FREE: "secondary",
  STARTER: "default",
  GROWTH: "success",
  ENTERPRISE: "warning",
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/super-admin/stats")
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-400 py-12">
        Failed to load dashboard stats
      </div>
    )
  }

  const overviewCards = [
    {
      title: "Total Organizations",
      value: stats.overview.totalOrganizations,
      icon: Building2,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "Total Users",
      value: stats.overview.totalUsers,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      title: "Total Contacts",
      value: stats.overview.totalContacts,
      icon: Contact2,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "Total Messages",
      value: stats.overview.totalMessages,
      icon: MessageSquare,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
    {
      title: "Total Broadcasts",
      value: stats.overview.totalBroadcasts,
      icon: Send,
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.overview.totalRevenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      title: "Message Costs",
      value: `₹${stats.overview.totalMessageCost.toLocaleString("en-IN")}`,
      icon: CreditCard,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      title: "Profit Margin",
      value: `₹${(stats.overview.totalRevenue - stats.overview.totalMessageCost).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-gray-400">Platform-wide statistics and analytics</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.title} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {typeof card.value === "number"
                      ? card.value.toLocaleString()
                      : card.value}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Organizations */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Organizations</CardTitle>
            <CardDescription className="text-gray-400">
              Newly registered organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50"
                >
                  <div>
                    <p className="font-medium text-white">{org.name}</p>
                    <p className="text-sm text-gray-400">
                      {org.usersCount} users • {org.contactsCount} contacts
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={planColors[org.plan] || "default"}>{org.plan}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Organizations by Revenue */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Organizations</CardTitle>
            <CardDescription className="text-gray-400">
              By messages sent and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topOrganizations.map((org, index) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{org.name}</p>
                      <p className="text-sm text-gray-400">
                        {org.messagesCount.toLocaleString()} messages
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-400">
                      ₹{org.totalTopUps.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: ₹{org.walletBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
