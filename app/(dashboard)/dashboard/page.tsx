import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Wallet,
  MessageSquare,
  TrendingUp,
  Users,
  Plus,
  Send,
  FileText,
} from "lucide-react"
import Link from "next/link"

async function getDashboardData(organizationId: string) {
  const [organization, contactsCount, messagesThisMonth, recentBroadcasts] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { walletBalance: true, name: true },
      }),
      prisma.contact.count({
        where: { organizationId, optedIn: true },
      }),
      prisma.message.count({
        where: {
          organizationId,
          direction: "OUTBOUND",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.broadcast.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          template: { select: { name: true } },
        },
      }),
    ])

  // Calculate delivery rate from recent messages
  const recentMessages = await prisma.message.findMany({
    where: {
      organizationId,
      direction: "OUTBOUND",
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    select: { status: true },
  })

  const deliveredCount = recentMessages.filter(
    (m) => m.status === "DELIVERED" || m.status === "READ"
  ).length
  const deliveryRate =
    recentMessages.length > 0
      ? Math.round((deliveredCount / recentMessages.length) * 100)
      : 0

  return {
    walletBalance: Number(organization?.walletBalance || 0),
    organizationName: organization?.name || "",
    contactsCount,
    messagesThisMonth,
    deliveryRate,
    recentBroadcasts,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData(session!.user.organizationId)

  const statCards = [
    {
      title: "Wallet Balance",
      value: formatCurrency(data.walletBalance),
      icon: Wallet,
      description: data.walletBalance < 500 ? "Low balance" : "Available",
      trend: data.walletBalance < 500 ? "warning" : "success",
    },
    {
      title: "Messages Sent",
      value: data.messagesThisMonth.toLocaleString(),
      icon: MessageSquare,
      description: "This month",
      trend: "default",
    },
    {
      title: "Delivery Rate",
      value: `${data.deliveryRate}%`,
      icon: TrendingUp,
      description: "Last 30 days",
      trend: data.deliveryRate >= 90 ? "success" : data.deliveryRate >= 70 ? "warning" : "error",
    },
    {
      title: "Active Contacts",
      value: data.contactsCount.toLocaleString(),
      icon: Users,
      description: "Opted in",
      trend: "default",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>
      case "PROCESSING":
        return <Badge variant="warning">Processing</Badge>
      case "SCHEDULED":
        return <Badge variant="secondary">Scheduled</Badge>
      case "FAILED":
        return <Badge variant="error">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500">
          Here&apos;s what&apos;s happening with your WhatsApp campaigns
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/broadcast">
          <Button>
            <Send className="mr-2 h-4 w-4" />
            New Broadcast
          </Button>
        </Link>
        <Link href="/contacts">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </Link>
        <Link href="/templates">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Recent Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentBroadcasts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No broadcasts yet</p>
              <p className="text-sm">Start by creating your first broadcast campaign</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentBroadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="font-medium">{broadcast.name}</TableCell>
                    <TableCell>{broadcast.template.name}</TableCell>
                    <TableCell>{broadcast.totalRecipients}</TableCell>
                    <TableCell>
                      {broadcast.deliveredCount} ({broadcast.totalRecipients > 0
                        ? Math.round((broadcast.deliveredCount / broadcast.totalRecipients) * 100)
                        : 0}%)
                    </TableCell>
                    <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
