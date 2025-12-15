import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Send, CheckCircle2, Eye, XCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

type BroadcastWithTemplate = {
  id: string
  name: string
  template: { name: string }
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  createdAt: Date
}

async function getAnalyticsData(organizationId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [messages, broadcasts] = await Promise.all([
    prisma.message.findMany({
      where: {
        organizationId,
        direction: "OUTBOUND",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { status: true, createdAt: true },
    }),
    prisma.broadcast.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { template: { select: { name: true } } },
    }),
  ])

  const stats = {
    sent: messages.length,
    delivered: messages.filter((m: { status: string }) => m.status === "DELIVERED" || m.status === "READ").length,
    read: messages.filter((m: { status: string }) => m.status === "READ").length,
    failed: messages.filter((m: { status: string }) => m.status === "FAILED").length,
  }

  return { stats, broadcasts }
}

export default async function AnalyticsPage() {
  const session = await auth()
  const { stats, broadcasts } = await getAnalyticsData(session!.user.organizationId)

  const deliveryRate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0
  const readRate = stats.delivered > 0 ? Math.round((stats.read / stats.delivered) * 100) : 0

  const statCards = [
    {
      title: "Total Sent",
      value: stats.sent.toLocaleString(),
      icon: Send,
      description: "Last 30 days",
    },
    {
      title: "Delivered",
      value: `${stats.delivered.toLocaleString()} (${deliveryRate}%)`,
      icon: CheckCircle2,
      description: "Delivery rate",
    },
    {
      title: "Read",
      value: `${stats.read.toLocaleString()} (${readRate}%)`,
      icon: Eye,
      description: "Read rate",
    },
    {
      title: "Failed",
      value: stats.failed.toLocaleString(),
      icon: XCircle,
      description: "Failed messages",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your messaging performance</p>
      </div>

      {/* Stats Cards */}
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

      {/* Recent Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((broadcast: BroadcastWithTemplate) => {
                const deliveryPct =
                  broadcast.totalRecipients > 0
                    ? Math.round((broadcast.deliveredCount / broadcast.totalRecipients) * 100)
                    : 0
                const readPct =
                  broadcast.deliveredCount > 0
                    ? Math.round((broadcast.readCount / broadcast.deliveredCount) * 100)
                    : 0

                return (
                  <TableRow key={broadcast.id}>
                    <TableCell className="font-medium">{broadcast.name}</TableCell>
                    <TableCell>{broadcast.template.name}</TableCell>
                    <TableCell>{broadcast.sentCount}</TableCell>
                    <TableCell>
                      {broadcast.deliveredCount}{" "}
                      <span className="text-gray-500">({deliveryPct}%)</span>
                    </TableCell>
                    <TableCell>
                      {broadcast.readCount}{" "}
                      <span className="text-gray-500">({readPct}%)</span>
                    </TableCell>
                    <TableCell>
                      {broadcast.failedCount > 0 ? (
                        <Badge variant="error">{broadcast.failedCount}</Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(broadcast.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {broadcasts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No broadcasts yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
